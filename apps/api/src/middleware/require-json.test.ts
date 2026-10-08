import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { UnsupportedMediaTypeError } from '../lib/errors';
import { requireJson } from './require-json';

function run(method: string, contentType?: string) {
  const req = {
    method,
    is: (type: string) => (contentType?.startsWith(type) ? type : false),
  } as unknown as Request;
  const next = vi.fn();
  requireJson(req, {} as Response, next);
  return next;
}

describe('requireJson', () => {
  it('lets reads through without a content type', () => {
    expect(run('GET')).toHaveBeenCalled();
  });

  it('lets JSON writes through', () => {
    expect(run('POST', 'application/json; charset=utf-8')).toHaveBeenCalled();
  });

  it.each(['text/plain', 'application/x-www-form-urlencoded', undefined])(
    'rejects a POST with %s',
    (type) => {
      expect(() => run('POST', type)).toThrow(UnsupportedMediaTypeError);
    },
  );
});
