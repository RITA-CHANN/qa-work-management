import { describe, expect, it } from 'vitest';
import { AppError, ConflictError, NotFoundError, ValidationError } from './errors';

describe('AppError subclasses', () => {
  it('maps NotFoundError to 404 / NOT_FOUND', () => {
    const error = new NotFoundError('Project not found');

    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Project not found');
    expect(error.name).toBe('NotFoundError');
  });

  it('keeps validation details for the client', () => {
    const error = new ValidationError([{ path: 'title', message: 'Required' }]);

    expect(error.status).toBe(400);
    expect(error.details).toEqual([{ path: 'title', message: 'Required' }]);
  });

  it('maps ConflictError to 409', () => {
    expect(new ConflictError('Version mismatch').status).toBe(409);
  });
});
