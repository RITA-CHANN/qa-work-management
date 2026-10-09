import type { NextFunction, Request, Response } from 'express';
import { problemSchema } from '@qawm/shared';
import { describe, expect, it, vi } from 'vitest';
import { UnprocessableError, ValidationError } from '../lib/errors';
import { errorHandler } from './error-handler';

function run(err: unknown) {
  const req = {
    originalUrl: '/api/projects/OLD?x=1',
    requestId: 'req-1',
    log: { info: vi.fn(), error: vi.fn() },
  } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    type: vi.fn().mockReturnThis(),
    send: vi.fn(),
  };
  errorHandler(err, req, res as unknown as Response, vi.fn() as NextFunction);
  return { res, body: JSON.parse(res.send.mock.calls[0]![0] as string) };
}

describe('errorHandler (RFC 9457, ADR-0010)', () => {
  it('sends application/problem+json that matches problemSchema (NFR-PROJECT-08)', () => {
    const { res, body } = run(new UnprocessableError('PROJECT_ARCHIVED', 'MSG-PROJECT-08'));
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.type).toHaveBeenCalledWith('application/problem+json');
    expect(problemSchema.parse(body)).toEqual({
      type: 'https://qawm.test/problems/project-archived',
      title: 'Project is archived',
      status: 422,
      detail: 'This project is archived. Restore it to make changes.',
      instance: '/api/projects/OLD',
      code: 'PROJECT_ARCHIVED',
      messageId: 'MSG-PROJECT-08',
      requestId: 'req-1',
    });
  });

  it('lists field errors only for a 400', () => {
    const { body } = run(ValidationError.field('/key', 'MSG-PROJECT-01'));
    expect(body.errors).toEqual([
      { pointer: '/key', detail: 'Key is required', messageId: 'MSG-PROJECT-01' },
    ]);
  });

  it('hides the details of an unexpected error', () => {
    const { res, body } = run(new Error('SELECT * failed at db.internal:5432'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(body)).not.toContain('db.internal');
  });
});
