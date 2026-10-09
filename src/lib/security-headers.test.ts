import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

function directives(policy: string) {
  return new Map(
    policy.split(';').map((directive) => {
      const [name, ...sources] = directive.trim().split(/\s+/);
      return [name, sources] as const;
    }),
  );
}

describe('Content-Security-Policy', async () => {
  const headers = await readFile('public/_headers', 'utf8');
  const policy = /Content-Security-Policy:\s*(.+)/.exec(headers)?.[1] ?? '';
  const csp = directives(policy);

  it('allows only the Cloudflare Web Analytics beacon beyond the site itself', () => {
    expect(csp.get('script-src')).toEqual([
      "'self'",
      "'unsafe-inline'",
      'https://static.cloudflareinsights.com',
    ]);
    expect(csp.get('connect-src')).toEqual([
      "'self'",
      'https://cloudflareinsights.com',
    ]);
  });

  it('pins the complete directive set so no other directive widens', () => {
    expect(Object.fromEntries(csp)).toEqual({
      'base-uri': ["'self'"],
      'connect-src': ["'self'", 'https://cloudflareinsights.com'],
      'default-src': ["'self'"],
      'font-src': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'img-src': ["'self'", 'data:', 'blob:'],
      'object-src': ["'none'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'",
        'https://static.cloudflareinsights.com',
      ],
      'style-src': ["'self'", "'unsafe-inline'"],
    });
  });
});
