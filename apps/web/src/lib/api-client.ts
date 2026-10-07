import type { ApiError, ErrorCode } from '@qawm/shared';

/** Thrown for any non-2xx API response. Carries the server's error code and requestId. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode | 'NETWORK_ERROR',
    message: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
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
        Accept: 'application/json',
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
    const error = (body as ApiError | null)?.error;
    throw new ApiRequestError(
      response.status,
      error?.code ?? 'INTERNAL_ERROR',
      error?.message ?? `Request failed with status ${response.status}`,
      error?.requestId,
    );
  }
  return body as T;
}
