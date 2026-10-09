// Builds docs/api/openapi.yaml (OpenAPI 3.1) from the Zod schemas in packages/shared.
//
//   npm run openapi:build   rewrite docs/api/openapi.yaml
//   npm run openapi:check   fail if docs/api/openapi.yaml is out of date (also run by docs:check)
//
// Request and response bodies come from the same Zod schemas the API validates with, so the contract can't
// drift from the code. The error statuses and codes of each operation come from the "Errors" table of its
// endpoint doc in docs/api/, so the Markdown and the OpenAPI file can't disagree either.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  activityEntrySchema,
  activityQuerySchema,
  authUserSchema,
  emptyBodySchema,
  healthResponseSchema,
  loginRequestSchema,
  memberAddSchema,
  memberSchema,
  memberUpdateSchema,
  milestoneCreateSchema,
  milestoneListQuerySchema,
  milestoneSchema,
  milestoneUpdateSchema,
  problemSchema,
  projectCreateSchema,
  projectListQuerySchema,
  projectSchema,
  projectSummarySchema,
  projectUpdateSchema,
  releaseCreateSchema,
  releaseSchema,
  releaseUpdateSchema,
  userListQuerySchema,
  userOptionSchema,
} from '@qawm/shared';
import * as prettier from 'prettier';
import { stringify } from 'yaml';
import { z } from 'zod';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOCS_API = join(ROOT, 'docs', 'api');
const OUTPUT = join(DOCS_API, 'openapi.yaml');

type JsonSchema = Record<string, unknown>;

function jsonSchema(schema: z.ZodType, io: 'input' | 'output'): JsonSchema {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema, {
    target: 'draft-2020-12',
    io,
    unrepresentable: 'any',
  }) as JsonSchema;
  return rest;
}

// Named schemas under components/schemas. Responses use the output side, bodies the input side
// (what a client sends, before the API trims or upper-cases it).
const responseSchemas = {
  Problem: problemSchema,
  AuthUser: authUserSchema,
  Health: healthResponseSchema,
  ProjectSummary: projectSummarySchema,
  Project: projectSchema,
  Member: memberSchema,
  Release: releaseSchema,
  Milestone: milestoneSchema,
  ActivityEntry: activityEntrySchema,
  UserOption: userOptionSchema,
} as const;
const bodySchemas = {
  LoginRequest: loginRequestSchema,
  ProjectCreate: projectCreateSchema,
  ProjectUpdate: projectUpdateSchema,
  EmptyBody: emptyBodySchema,
  MemberAdd: memberAddSchema,
  MemberUpdate: memberUpdateSchema,
  ReleaseCreate: releaseCreateSchema,
  ReleaseUpdate: releaseUpdateSchema,
  MilestoneCreate: milestoneCreateSchema,
  MilestoneUpdate: milestoneUpdateSchema,
} as const;
type ResponseName = keyof typeof responseSchemas;
type BodyName = keyof typeof bodySchemas;

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

type Operation = {
  id: string;
  method: 'get' | 'post' | 'patch' | 'delete';
  path: string;
  summary: string;
  tag: string;
  auth?: false;
  body?: BodyName;
  query?: z.ZodObject;
  /** Success status and body: one item, a list, a cursor page, or nothing (204). */
  ok: { status: number; schema?: ResponseName; shape?: 'item' | 'list' | 'page' | 'raw' };
  created?: boolean;
};

const key = {
  name: 'key',
  in: 'path',
  required: true,
  description: 'Project key, case-insensitive',
  schema: { type: 'string' },
};
const id = (name: string, description: string) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'string' },
});

// prettier-ignore
const OPERATIONS: Operation[] = [
  { id: 'API-HEALTH-01', method: 'get', path: '/api/health', summary: 'Health of the API and its database', tag: 'Health', auth: false, ok: { status: 200, schema: 'Health', shape: 'item' } },
  { id: 'API-AUTH-01', method: 'post', path: '/api/auth/login', summary: 'Log in', tag: 'Auth', auth: false, body: 'LoginRequest', ok: { status: 200, schema: 'AuthUser', shape: 'item' } },
  { id: 'API-AUTH-02', method: 'post', path: '/api/auth/logout', summary: 'Log out', tag: 'Auth', auth: false, ok: { status: 204 } },
  { id: 'API-AUTH-03', method: 'get', path: '/api/auth/me', summary: 'The logged-in user', tag: 'Auth', ok: { status: 200, schema: 'AuthUser', shape: 'item' } },
  { id: 'API-PROJECT-01', method: 'get', path: '/api/projects', summary: "The caller's projects", tag: 'Projects', query: projectListQuerySchema, ok: { status: 200, schema: 'ProjectSummary', shape: 'list' } },
  { id: 'API-PROJECT-02', method: 'post', path: '/api/projects', summary: 'Create a project', tag: 'Projects', body: 'ProjectCreate', ok: { status: 201, schema: 'Project', shape: 'item' }, created: true },
  { id: 'API-PROJECT-03', method: 'get', path: '/api/projects/{key}', summary: 'One project', tag: 'Projects', ok: { status: 200, schema: 'Project', shape: 'item' } },
  { id: 'API-PROJECT-04', method: 'patch', path: '/api/projects/{key}', summary: 'Edit a project', tag: 'Projects', body: 'ProjectUpdate', ok: { status: 200, schema: 'Project', shape: 'item' } },
  { id: 'API-PROJECT-05', method: 'post', path: '/api/projects/{key}/archive', summary: 'Archive a project', tag: 'Projects', body: 'EmptyBody', ok: { status: 200, schema: 'Project', shape: 'item' } },
  { id: 'API-PROJECT-06', method: 'post', path: '/api/projects/{key}/restore', summary: 'Restore a project', tag: 'Projects', body: 'EmptyBody', ok: { status: 200, schema: 'Project', shape: 'item' } },
  { id: 'API-PROJECT-07', method: 'delete', path: '/api/projects/{key}', summary: 'Delete an archived project', tag: 'Projects', ok: { status: 204 } },
  { id: 'API-PROJECT-08', method: 'get', path: '/api/projects/{key}/members', summary: 'Members of a project', tag: 'Members', ok: { status: 200, schema: 'Member', shape: 'list' } },
  { id: 'API-PROJECT-09', method: 'post', path: '/api/projects/{key}/members', summary: 'Add a member', tag: 'Members', body: 'MemberAdd', ok: { status: 201, schema: 'Member', shape: 'item' } },
  { id: 'API-PROJECT-10', method: 'patch', path: '/api/projects/{key}/members/{userId}', summary: "Change a member's role", tag: 'Members', body: 'MemberUpdate', ok: { status: 200, schema: 'Member', shape: 'item' } },
  { id: 'API-PROJECT-11', method: 'delete', path: '/api/projects/{key}/members/{userId}', summary: 'Remove a member, or leave', tag: 'Members', ok: { status: 204 } },
  { id: 'API-PROJECT-12', method: 'get', path: '/api/projects/{key}/activity', summary: 'Activity log, newest first', tag: 'Activity', query: activityQuerySchema, ok: { status: 200, schema: 'ActivityEntry', shape: 'page' } },
  { id: 'API-RELEASE-01', method: 'get', path: '/api/projects/{key}/releases', summary: 'Releases of a project', tag: 'Releases', ok: { status: 200, schema: 'Release', shape: 'list' } },
  { id: 'API-RELEASE-02', method: 'post', path: '/api/projects/{key}/releases', summary: 'Create a release', tag: 'Releases', body: 'ReleaseCreate', ok: { status: 201, schema: 'Release', shape: 'item' } },
  { id: 'API-RELEASE-03', method: 'patch', path: '/api/projects/{key}/releases/{id}', summary: 'Edit a release or move its status', tag: 'Releases', body: 'ReleaseUpdate', ok: { status: 200, schema: 'Release', shape: 'item' } },
  { id: 'API-RELEASE-04', method: 'delete', path: '/api/projects/{key}/releases/{id}', summary: 'Delete a planned release', tag: 'Releases', ok: { status: 204 } },
  { id: 'API-MILESTONE-01', method: 'get', path: '/api/projects/{key}/milestones', summary: 'Milestones of a project', tag: 'Milestones', query: milestoneListQuerySchema, ok: { status: 200, schema: 'Milestone', shape: 'list' } },
  { id: 'API-MILESTONE-02', method: 'post', path: '/api/projects/{key}/milestones', summary: 'Create a milestone', tag: 'Milestones', body: 'MilestoneCreate', ok: { status: 201, schema: 'Milestone', shape: 'item' } },
  { id: 'API-MILESTONE-03', method: 'patch', path: '/api/projects/{key}/milestones/{id}', summary: 'Edit a milestone or move its status', tag: 'Milestones', body: 'MilestoneUpdate', ok: { status: 200, schema: 'Milestone', shape: 'item' } },
  { id: 'API-MILESTONE-04', method: 'delete', path: '/api/projects/{key}/milestones/{id}', summary: 'Delete a planned milestone', tag: 'Milestones', ok: { status: 204 } },
  { id: 'API-USER-01', method: 'get', path: '/api/users', summary: 'Users for the member picker', tag: 'Users', query: userListQuerySchema, ok: { status: 200, schema: 'UserOption', shape: 'list' } },
];

// prettier-ignore
const REASONS: Record<number, string> = {
  200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
  404: 'Not Found', 409: 'Conflict', 415: 'Unsupported Media Type', 422: 'Unprocessable Content',
  429: 'Too Many Requests', 500: 'Internal Server Error', 503: 'Service Unavailable',
};

/** Each endpoint doc's id → its file, and the error rows of its "Errors" table: [status, code]. */
function readEndpointDocs(): Map<
  string,
  { file: string; title: string; errors: [number, string][] }
> {
  const docs = new Map<string, { file: string; title: string; errors: [number, string][] }>();
  for (const dir of readdirSync(DOCS_API, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const name of readdirSync(join(DOCS_API, dir.name)).filter((f) => f.endsWith('.md'))) {
      const file = `${dir.name}/${name}`;
      const text = readFileSync(join(DOCS_API, file), 'utf8');
      const docId = /^id: (API-[A-Z]+-\d+)$/m.exec(text)?.[1];
      const title = /^title: (.+)$/m.exec(text)?.[1] ?? '';
      if (!docId) continue;
      const errorsSection = text.split(/^### Errors$/m)[1]?.split(/^## /m)[0] ?? '';
      const errors = [...errorsSection.matchAll(/^\| (\d{3}) +\| `([A-Z_]+)`/gm)].map(
        (m) => [Number(m[1]), m[2]!] as [number, string],
      );
      docs.set(docId, { file, title, errors });
    }
  }
  return docs;
}

function successResponse(op: Operation) {
  const { status, schema, shape } = op.ok;
  const description = REASONS[status]!;
  if (!schema) return { description };
  const item = ref(schema);
  const data = shape === 'list' || shape === 'page' ? { type: 'array', items: item } : item;
  const body =
    shape === 'raw'
      ? item
      : {
          type: 'object',
          required: shape === 'page' ? ['data', 'meta'] : ['data'],
          properties: {
            data,
            ...(shape === 'page'
              ? {
                  meta: {
                    type: 'object',
                    required: ['nextCursor'],
                    properties: { nextCursor: { type: ['string', 'null'] } },
                  },
                }
              : {}),
          },
        };
  return {
    description,
    ...(op.created
      ? {
          headers: {
            Location: { schema: { type: 'string' }, description: 'URL of the new resource' },
          },
        }
      : {}),
    content: { 'application/json': { schema: body } },
  };
}

function queryParameters(schema: z.ZodObject) {
  const json = jsonSchema(schema, 'input') as {
    properties?: Record<string, JsonSchema>;
    required?: string[];
  };
  return Object.entries(json.properties ?? {}).map(([name, property]) => ({
    name,
    in: 'query',
    required: json.required?.includes(name) ?? false,
    schema: property,
  }));
}

function pathParameters(path: string) {
  const names = [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
  return names.map((name) =>
    name === 'key'
      ? key
      : name === 'userId'
        ? id('userId', 'User id of the member')
        : id(name, 'Id of the release or milestone'),
  );
}

function buildDocument() {
  const docs = readEndpointDocs();
  const problems: string[] = [];
  const paths: Record<string, Record<string, unknown>> = {};

  for (const op of OPERATIONS) {
    const doc = docs.get(op.id);
    const title = `${op.method.toUpperCase()} ${op.path.replace(/\{(\w+)\}/g, ':$1')}`;
    if (!doc) {
      problems.push(`${op.id}: no endpoint doc in docs/api/`);
      continue;
    }
    if (doc.title !== title)
      problems.push(`${op.id}: doc title "${doc.title}" but the route is "${title}"`);

    const responses: Record<string, unknown> = { [op.ok.status]: successResponse(op) };
    const byStatus = new Map<number, string[]>();
    for (const [status, code] of doc.errors) {
      byStatus.set(status, [...new Set([...(byStatus.get(status) ?? []), code])]);
    }
    for (const [status, codes] of [...byStatus].sort(([a], [b]) => a - b)) {
      responses[status] = {
        description: `${REASONS[status] ?? 'Error'}: ${codes.join(', ')}`,
        content: {
          'application/problem+json': {
            schema: { allOf: [ref('Problem'), { properties: { code: { enum: codes } } }] },
          },
        },
      };
    }

    const parameters = [...pathParameters(op.path), ...(op.query ? queryParameters(op.query) : [])];
    paths[op.path] ??= {};
    paths[op.path]![op.method] = {
      operationId: op.id,
      summary: op.summary,
      description: `Docs: docs/api/${doc.file}`,
      tags: [op.tag],
      ...(op.auth === false ? { security: [] } : {}),
      ...(parameters.length ? { parameters } : {}),
      ...(op.body
        ? {
            requestBody: {
              required: true,
              content: { 'application/json': { schema: ref(op.body) } },
            },
          }
        : {}),
      responses,
    };
  }

  const documented = [...docs.keys()].filter((docId) => !OPERATIONS.some((op) => op.id === docId));
  for (const docId of documented)
    problems.push(`${docId}: endpoint doc without a route in scripts/openapi/generate.ts`);

  const schemas: Record<string, JsonSchema> = {};
  for (const [name, schema] of Object.entries(responseSchemas))
    schemas[name] = jsonSchema(schema, 'output');
  for (const [name, schema] of Object.entries(bodySchemas))
    schemas[name] = jsonSchema(schema, 'input');

  const document = {
    openapi: '3.1.0',
    info: {
      title: 'QA Work Management API',
      version: '0.3.0',
      description:
        'Generated from the Zod schemas in packages/shared by scripts/openapi/generate.ts. Do not edit by hand.\n' +
        'Errors are RFC 9457 problem details (docs/decisions/ADR-0010-problem-details-errors.md).',
    },
    servers: [{ url: 'http://localhost:3000', description: 'npm run dev' }],
    security: [{ session: [] }],
    tags: [
      'Health',
      'Auth',
      'Projects',
      'Members',
      'Releases',
      'Milestones',
      'Activity',
      'Users',
    ].map((name) => ({ name })),
    paths,
    components: {
      securitySchemes: {
        session: {
          type: 'apiKey',
          in: 'cookie',
          name: 'qawm_sid',
          description: 'Set by POST /api/auth/login',
        },
      },
      schemas,
    },
  };
  return { document, problems };
}

async function main() {
  const { document, problems } = buildDocument();
  if (problems.length) {
    console.error(problems.map((p) => `  ✗ ${p}`).join('\n'));
    process.exitCode = 1;
    return;
  }
  const header = '# Generated by scripts/openapi/generate.ts from packages/shared. Do not edit.\n';
  const yaml = await prettier.format(
    header + stringify(document, { lineWidth: 0, aliasDuplicateObjects: false }),
    { ...(await prettier.resolveConfig(OUTPUT)), parser: 'yaml' },
  );

  if (process.argv.includes('--check')) {
    let current = '';
    try {
      current = readFileSync(OUTPUT, 'utf8');
    } catch {
      // missing file: reported below
    }
    if (current !== yaml) {
      console.error('  ✗ docs/api/openapi.yaml is out of date. Run: npm run openapi:build');
      process.exitCode = 1;
    } else {
      console.log(`✓ docs/api/openapi.yaml is up to date (${OPERATIONS.length} operations)`);
    }
    return;
  }
  writeFileSync(OUTPUT, yaml);
  console.log(`Wrote docs/api/openapi.yaml (${OPERATIONS.length} operations)`);
}

await main();
