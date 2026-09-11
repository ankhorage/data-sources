import { expect, it } from 'bun:test';

import { buildEndpointTestRequest } from '../test-runner';
import {
  createOpenApiDiscoveryCandidates,
  discoverOpenApi,
  type ExternalApiFetch,
  type ExternalApiFetchResponse,
  introspectGraphQlApi,
} from './index';

function jsonResponse(value: unknown, status = 200): ExternalApiFetchResponse {
  return { status, text: () => Promise.resolve(JSON.stringify(value)) };
}

function openApiDocument() {
  return {
    openapi: '3.1.0',
    info: { title: 'Inventory API', version: '1.0.0' },
    servers: [{ url: 'https://api.example.com' }],
    paths: {
      '/items': {
        get: { operationId: 'listItems', responses: { '200': { description: 'Items' } } },
      },
    },
  } as const;
}

function gatewayOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: { title: 'Shared Gateway', version: '1.0.0' },
    servers: [{ url: 'https://api.example.com' }],
    paths: {
      '/health': { get: {} },
      '/v1/chess/openings': { get: {} },
      '/v1/poker/health': { get: {} },
      '/v1/poker/training/tasks': { get: {} },
      '/v1/poker/training/tasks/{taskId}': { get: {} },
      '/v1/poker/training/tasks/{taskId}/answer': { post: {} },
      '/v1/poker/training/tasks/by-slug/{slug}': { get: {} },
      '/v1/poker-admin/status': { get: {} },
      '/v1/pokerface/status': { get: {} },
    },
  } as const;
}

function serviceLocalOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: { title: 'Poker API', version: '1.0.0' },
    servers: [{ url: 'https://api.example.com/v1/poker' }],
    paths: { '/health': { get: {} } },
  } as const;
}

function graphQlPayload() {
  return {
    data: {
      __schema: {
        queryType: { name: 'Query' },
        mutationType: null,
        subscriptionType: null,
        types: [
          {
            kind: 'OBJECT',
            name: 'Query',
            fields: [
              {
                name: 'items',
                args: [],
                type: { kind: 'LIST', ofType: { kind: 'SCALAR', name: 'String' } },
              },
            ],
          },
        ],
      },
    },
  } as const;
}

it('creates OpenAPI discovery candidates and rejects unsafe URLs', () => {
  const candidates = createOpenApiDiscoveryCandidates('https://api.example.com/service');
  expect(candidates).toContain('https://api.example.com/service');
  expect(candidates).toContain('https://api.example.com/service/openapi.json');
  expect(candidates).toContain('https://api.example.com/openapi.json');
  expect(createOpenApiDiscoveryCandidates('file:///tmp/openapi.json')).toEqual([]);
  expect(createOpenApiDiscoveryCandidates('https://user:secret@example.com/openapi.json')).toEqual(
    [],
  );
});

it('discovers an external REST API', async () => {
  const result = await discoverOpenApi({
    id: 'inventory',
    url: 'https://api.example.com/openapi.json',
    fetch: () => Promise.resolve(jsonResponse(openApiDocument())),
  });
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.data).toMatchObject({ origin: 'external', protocol: 'rest' });
    expect('kind' in result.data).toBe(false);
    expect(result.data.openApi?.url).toBe('https://api.example.com/openapi.json');
    expect(result.attempts[0]?.outcome).toBe('matched');
  }
});

it('falls back to OpenAPI conventional locations without leaking response data', async () => {
  const calls: string[] = [];
  const fetch: ExternalApiFetch = (url) => {
    calls.push(url);
    return Promise.resolve(
      url.endsWith('/service/openapi.json')
        ? jsonResponse(openApiDocument())
        : jsonResponse({ private: 'hidden' }, 404),
    );
  };
  const result = await discoverOpenApi({
    id: 'inventory',
    url: 'https://api.example.com/service',
    conventionalPaths: ['openapi.json'],
    fetch,
  });
  expect(result.ok).toBe(true);
  expect(calls).toEqual([
    'https://api.example.com/service',
    'https://api.example.com/service/openapi.json',
  ]);
  expect(JSON.stringify(result)).not.toContain('hidden');
});

it('scopes root OpenAPI discovery to the requested service and preserves runtime URLs', async () => {
  const calls: string[] = [];
  const fetch: ExternalApiFetch = (url) => {
    calls.push(url);
    return Promise.resolve(
      url === 'https://api.example.com/openapi.json'
        ? jsonResponse(gatewayOpenApiDocument())
        : jsonResponse({ private: 'hidden' }, 404),
    );
  };
  const result = await discoverOpenApi({
    id: 'poker',
    url: 'https://api.example.com/v1/poker/?tenant=private#fragment',
    conventionalPaths: ['openapi.json'],
    fetch,
  });

  expect(calls).toEqual([
    'https://api.example.com/v1/poker/?tenant=private',
    'https://api.example.com/v1/poker/openapi.json',
    'https://api.example.com/openapi.json',
  ]);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.documentUrl).toBe('https://api.example.com/openapi.json');
    expect(result.data.baseUrl).toBe('https://api.example.com');
    expect(result.data.openApi?.url).toBe('https://api.example.com/openapi.json');
    expect(
      Object.values(result.data.endpoints)
        .map((endpoint) => endpoint.path)
        .sort(),
    ).toEqual([
      '/v1/poker/health',
      '/v1/poker/training/tasks',
      '/v1/poker/training/tasks/by-slug/{slug}',
      '/v1/poker/training/tasks/{taskId}',
      '/v1/poker/training/tasks/{taskId}/answer',
    ]);
    const request = await buildEndpointTestRequest({
      api: result.data,
      endpointId: 'v1-poker-training-tasks',
      operationId: 'get-v1-poker-training-tasks',
      dryRun: true,
    });
    expect(request.ok).toBe(true);
    if (request.ok) {
      expect(request.request.url).toBe('https://api.example.com/v1/poker/training/tasks');
    }
  }
});

it('keeps service-local OpenAPI documents unscoped', async () => {
  const fetch: ExternalApiFetch = (url) =>
    Promise.resolve(
      url === 'https://api.example.com/v1/poker/openapi.json'
        ? jsonResponse(serviceLocalOpenApiDocument())
        : jsonResponse({}, 404),
    );
  const result = await discoverOpenApi({
    id: 'poker',
    url: 'https://api.example.com/v1/poker/',
    conventionalPaths: ['openapi.json'],
    fetch,
  });

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.documentUrl).toBe('https://api.example.com/v1/poker/openapi.json');
    expect(result.data.baseUrl).toBe('https://api.example.com/v1/poker');
    expect(result.data.endpoints.health?.path).toBe('/health');
  }
});

it('keeps root host and explicit root-document discovery unscoped', async () => {
  for (const url of ['https://api.example.com/', 'https://api.example.com/openapi.json']) {
    const result = await discoverOpenApi({
      id: 'gateway',
      url,
      conventionalPaths: ['openapi.json'],
      fetch: (candidate) =>
        Promise.resolve(
          candidate === 'https://api.example.com/openapi.json'
            ? jsonResponse(gatewayOpenApiDocument())
            : jsonResponse({}, 404),
        ),
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(Object.keys(result.data.endpoints)).toHaveLength(9);
  }
});

it('fails safely when a root document has no paths in the requested scope', async () => {
  const result = await discoverOpenApi({
    id: 'missing',
    url: 'https://api.example.com/v1/missing',
    conventionalPaths: ['openapi.json'],
    fetch: (url) =>
      Promise.resolve(
        url === 'https://api.example.com/openapi.json'
          ? jsonResponse(gatewayOpenApiDocument())
          : jsonResponse({ private: 'hidden' }, 404),
      ),
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.attempts.at(-1)).toEqual({
      url: 'https://api.example.com/openapi.json',
      outcome: 'invalid-document',
      status: 200,
    });
    expect(result.diagnostics[0]).toMatchObject({ code: 'missing-schema', path: 'paths' });
    expect(result.diagnostics[0]?.message).toContain("requested service scope '/v1/missing'");
    expect(result.diagnostics[0]?.message).toContain('https://api.example.com/openapi.json');
    expect(JSON.stringify(result)).not.toContain('hidden');
  }
});

it('introspects GraphQL without echoing trusted headers', async () => {
  const result = await introspectGraphQlApi({
    id: 'catalog',
    endpointUrl: 'https://api.example.com/graphql',
    headers: { authorization: 'Bearer server-only' },
    fetch: () => Promise.resolve(jsonResponse(graphQlPayload())),
  });
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.data).toMatchObject({ origin: 'external', protocol: 'graphql' });
    expect('kind' in result.data).toBe(false);
    expect(result.data.endpoints.graphql?.operations['query.items']).toBeDefined();
    expect(JSON.stringify(result)).not.toContain('server-only');
  }
});

it('reports GraphQL transport and response-shape failures safely', async () => {
  const http = await introspectGraphQlApi({
    id: 'catalog',
    endpointUrl: 'https://api.example.com/graphql',
    fetch: () => Promise.resolve(jsonResponse({ secret: 'hidden' }, 403)),
  });
  const shape = await introspectGraphQlApi({
    id: 'catalog',
    endpointUrl: 'https://api.example.com/graphql',
    fetch: () => Promise.resolve(jsonResponse({ data: {} })),
  });
  expect(http).toMatchObject({ ok: false, status: 403 });
  expect(JSON.stringify(http)).not.toContain('hidden');
  expect(shape.ok).toBe(false);
  if (!shape.ok) expect(shape.diagnostics[0]?.apiId).toBe('catalog');
});
