import { describe, expect, it } from 'bun:test';

import { verifyZefixAuthenticationAsync } from '../../index.js';

describe('Zefix Basic authentication', () => {
  it('performs one protected request and returns only a safe status', async () => {
    const requests: Array<{ url: string; authorization: string | null; redirect: RequestRedirect }> = [];
    const result = await verifyZefixAuthenticationAsync({
      username: 'user@example.ch',
      password: 'a-private-password',
      fetch: async (url, init) => {
        const headers = new Headers(init?.headers);
        requests.push({
          url: String(url),
          authorization: headers.get('authorization'),
          redirect: init?.redirect ?? 'follow',
        });
        return new Response('[{"id":1}]', { status: 200 });
      },
    });

    expect(result).toBe('authenticated');
    expect(requests).toEqual([
      {
        url: 'https://www.zefix.admin.ch/ZefixPublicREST/api/v1/legalForm',
        authorization: `Basic ${btoa('user@example.ch:a-private-password')}`,
        redirect: 'error',
      },
    ]);
    expect(JSON.stringify(result)).not.toContain('a-private-password');
  });

  it('fails closed without credentials and makes no request', async () => {
    const result = await verifyZefixAuthenticationAsync({
      username: ' ',
      password: 'secret',
      fetch: () => {
        throw new Error('fetch must never be called');
      },
    });
    expect(result).toBe('missing-credentials');
  });

  it.each([
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [429, 'rate-limited'],
    [500, 'upstream-error'],
  ] as const)('maps HTTP %i to a redacted outcome', async (status, expected) => {
    const result = await verifyZefixAuthenticationAsync({
      username: 'user',
      password: 'secret',
      fetch: async () => new Response('upstream body with private details', { status }),
    });
    expect(result).toBe(expected);
    expect(JSON.stringify(result)).not.toContain('private details');
  });

  it('does not expose network exception messages', async () => {
    const result = await verifyZefixAuthenticationAsync({
      username: 'user',
      password: 'secret',
      fetch: () => Promise.reject(new Error('network failure containing secret')),
    });
    expect(result).toBe('network-error');
  });
});
