import { describe, expect, it } from 'vitest';
import {
  AppError,
  ConflictError,
  NotFoundError,
  parseOrThrow,
  UnprocessableError,
  ValidationError,
} from './errors';
import { projectCreateSchema } from '@qawm/shared';

describe('AppError subclasses', () => {
  it('maps NotFoundError to 404 / NOT_FOUND with the catalog text', () => {
    const error = new NotFoundError('MSG-PROJECT-06');

    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.messageId).toBe('MSG-PROJECT-06');
    expect(error.message).toBe('Project not found');
    expect(error.name).toBe('NotFoundError');
  });

  it('keeps field errors for the client', () => {
    const errors = [{ pointer: '/name', detail: 'Required' }];
    expect(new ValidationError(errors).errors).toEqual(errors);
  });

  it('fills placeholders of the message', () => {
    const error = new UnprocessableError('ACTIVE_RELEASE_EXISTS', 'MSG-PROJECT-17', {
      name: '2.4',
    });
    expect(error.status).toBe(422);
    expect(error.message).toBe('Release 2.4 is already active. Release it first.');
  });

  it('maps ConflictError to 409 with its own code', () => {
    const error = new ConflictError('VERSION_CONFLICT', 'MSG-PROJECT-07');
    expect(error.status).toBe(409);
    expect(error.code).toBe('VERSION_CONFLICT');
  });
});

describe('parseOrThrow', () => {
  it('returns the parsed value', () => {
    expect(parseOrThrow(projectCreateSchema, { key: ' demo ', name: 'Demo' })).toEqual({
      key: 'DEMO',
      name: 'Demo',
    });
  });

  it('lists every invalid field as a JSON Pointer with its message ID', () => {
    try {
      parseOrThrow(projectCreateSchema, { key: '1AB', name: 'ab', version: 9 });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ pointer: '/key', messageId: 'MSG-PROJECT-02' }),
          expect.objectContaining({ pointer: '/name', messageId: 'MSG-PROJECT-03' }),
          // Unknown field (mass assignment, NFR-PROJECT-04)
          expect.objectContaining({ pointer: '/version', detail: 'This field is not allowed' }),
        ]),
      );
    }
  });
});
