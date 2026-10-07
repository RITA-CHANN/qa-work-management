import { describe, expect, it } from 'vitest';
import { loginPathFor, safeReturnTo } from './return-to';

describe('safeReturnTo', () => {
  it.each(['/projects', '/projects?tab=open', '/a/b#c'])('keeps the app path %s', (path) => {
    expect(safeReturnTo(path)).toBe(path);
  });

  it.each([
    [null],
    [undefined],
    [''],
    ['https://evil.com'],
    ['//evil.com'],
    ['/\\evil.com'],
    ['javascript:alert(1)'],
    ['projects'],
    ['/login'],
    ['/login?returnTo=/projects'],
    [`/${'a'.repeat(2048)}`],
  ])('falls back to the dashboard for %s', (value) => {
    expect(safeReturnTo(value)).toBe('/');
  });
});

describe('loginPathFor', () => {
  it('adds an encoded returnTo for a page inside the app', () => {
    expect(loginPathFor('/projects?x=1')).toBe('/login?returnTo=%2Fprojects%3Fx%3D1');
  });

  it('has no returnTo for the dashboard', () => {
    expect(loginPathFor('/')).toBe('/login');
  });
});
