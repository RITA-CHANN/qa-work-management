import type { ErrorCode, FieldError, MessageCode, Problem } from '@qawm/shared';

/**
 * Thrown for any non-2xx API response. Carries the RFC 9457 problem details the API sends
 * (ADR-0010): the machine `code`, the `messageId` of the text, field errors and the requestId.
 */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode | 'NETWORK_ERROR',
    message: string,
    readonly requestId?: string,
    readonly messageId?: MessageCode,
    readonly errors: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }

  /** The message of one field, e.g. fieldError('/key'), for showing under that input. */
  fieldError(pointer: string): string | undefined {
    return this.errors.find((error) => error.pointer === pointer)?.detail;
  }
}

// Paths whose 401 is an answer, not a lost session.
const AUTH_PATHS = new Set(['/auth/login', '/auth/logout', '/auth/me']);
let onUnauthenticated: (() => void) | undefined;

/** Called for a 401 from any other endpoint: the session ended on the server (BR-AUTH-11). */
export function setUnauthenticatedHandler(handler: () => void) {
  onUnauthenticated = handler;
}

/**
 * The one place the web app calls the API. Every feature goes through here,
 * so credentials, JSON handling and error parsing are consistent.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json, application/problem+json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiRequestError(0, 'NETWORK_ERROR', 'Cannot reach the server');
  }

  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && !AUTH_PATHS.has(path)) onUnauthenticated?.();
    const problem = body as Partial<Problem> | null;
    throw new ApiRequestError(
      response.status,
      problem?.code ?? 'INTERNAL_ERROR',
      problem?.detail ?? `Request failed with status ${response.status}`,
      problem?.requestId,
      problem?.messageId,
      problem?.errors ?? [],
    );
  }
  return body as T;
}

/** apiFetch with a JSON body. */
export function apiSend<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
) {
  return apiFetch<T>(path, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
