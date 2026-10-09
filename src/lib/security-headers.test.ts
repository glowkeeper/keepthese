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

  it('keeps every other fetch directive same-origin or closed', () => {
    expect(csp.get('default-src')).toEqual(["'self'"]);
    expect(csp.get('img-src')).toEqual(["'self'", 'data:', 'blob:']);
    expect(csp.get('font-src')).toEqual(["'self'"]);
    expect(csp.get('object-src')).toEqual(["'none'"]);
  });
});
