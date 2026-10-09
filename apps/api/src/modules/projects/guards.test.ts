import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// NFR-PROJECT-02 / OWASP API5: every write in a project-scoped service checks the permission map.
// A new write function without assertCan fails this test.
const MODULES = join(import.meta.dirname, '..');
const WRITE =
  /^export async function ((?:create|update|archive|restore|delete|add|change|remove)\w*)\(/;
// Creating a project has no project yet: it checks the global role instead (BR-PROJECT-01).
const SYSTEM_ADMIN_ONLY = new Set(['createProject']);

function writeFunctions() {
  const found: { file: string; name: string; body: string }[] = [];
  for (const dir of ['projects', 'releases', 'milestones']) {
    for (const file of readdirSync(join(MODULES, dir)).filter((f) => f.endsWith('.service.ts'))) {
      const source = readFileSync(join(MODULES, dir, file), 'utf8');
      // Split at each top-level function; each chunk is one function and its body.
      for (const chunk of source.split(/\n(?=export async function |async function |function )/)) {
        const name = WRITE.exec(chunk)?.[1];
        if (name) found.push({ file: `${dir}/${file}`, name, body: chunk });
      }
    }
  }
  return found;
}

describe('project-scoped write functions', () => {
  const functions = writeFunctions();

  it('are found', () => {
    expect(functions.length).toBeGreaterThanOrEqual(14);
  });

  it.each(functions.map((f) => [`${f.file} ${f.name}`, f] as const))(
    '%s calls assertCan',
    (_label, { name, body }) => {
      if (SYSTEM_ADMIN_ONLY.has(name)) {
        expect(body).toMatch(/if \(user\.globalRole !== 'ADMIN'\) throw new ForbiddenError\(/);
        return;
      }
      expect(body).toMatch(/assertCan\(ctx\.access, '[a-z-]+:[a-z-]+'\)/);
    },
  );
});
