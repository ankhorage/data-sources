import { normalizeManualRestApi } from '../../rest/index.js';
import { testEndpoint } from '../../test-runner/index.js';

/***
 * Verify Zefix HTTP Basic credentials with exactly one protected, non-personal-data request.
 *
 * Only call this function on a trusted server. The returned status intentionally excludes
 * credentials, request headers, upstream response bodies, and provider diagnostics.
 * @security Keep Zefix credentials in a server-side secret store; never relay the raw
 * test-runner result or this function's input to clients or logs.
 */
export async function verifyZefixAuthenticationAsync(input: {
  readonly username?: string;
  readonly password?: string;
  readonly fetch?: typeof globalThis.fetch;
}): Promise<
  | 'authenticated'
  | 'missing-credentials'
  | 'unauthorized'
  | 'forbidden'
  | 'rate-limited'
  | 'network-error'
  | 'upstream-error'
> {
  const { username, password } = input;
  if (username === undefined || username.trim().length === 0 || password === undefined || password.length === 0)
    return 'missing-credentials';

  const encodedCredentials = btoa(
    String.fromCharCode(...new TextEncoder().encode(`${username}:${password}`)),
  );
  const fetch = input.fetch ?? globalThis.fetch;
  const result = await testEndpoint({
    api: ZEFIX_AUTHENTICATION_API,
    endpointId: 'legal-form',
    operationId: 'legal-form.list',
    credentialResolver: () => ({
      headers: {
        authorization: `Basic ${encodedCredentials}`,
        accept: 'application/json',
      },
    }),
    fetch: async (url, init) => {
      const response = await fetch(url, {
        method: init.method,
        headers: init.headers,
        body: init.body,
        redirect: 'error',
        cache: 'no-store',
      });
      return { status: response.status, text: () => response.text() };
    },
  });

  if (result.ok) return 'authenticated';
  if (result.response?.status === 401) return 'unauthorized';
  if (result.response?.status === 403) return 'forbidden';
  if (result.response?.status === 429) return 'rate-limited';
  if (result.diagnostics.some((diagnostic) => diagnostic.code === 'network-error'))
    return 'network-error';
  return 'upstream-error';
}

const ZEFIX_AUTHENTICATION_API = normalizeManualRestApi({
  id: 'zefix',
  name: 'Zefix PublicREST',
  baseUrl: 'https://www.zefix.admin.ch/ZefixPublicREST',
  credential: { id: 'zefix-credentials', kind: 'basic' },
  endpoints: [
    {
      id: 'legal-form',
      path: '/api/v1/legalForm',
      operations: [{ id: 'legal-form.list', method: 'GET', intent: 'read' }],
    },
  ],
});
