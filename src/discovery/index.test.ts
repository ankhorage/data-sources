import { describe, expect, it } from 'bun:test';

import {
  createOpenApiDiscoveryCandidates,
  discoverOpenApiDataSource,
  introspectGraphQlDataSource,
  type ExternalApiFetch,
  type ExternalApiFetchInit,
  type ExternalApiFetchResponse,
} from './index';

function jsonResponse(value: unknown, status = 200): ExternalApiFetchResponse {
  return {
    status,
    text: async () => JSON.stringify(value),
  };
}

function createOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: { title: 'Inventory API', version: '1.0.0' },
    servers: [{ url: 'https://api.example.com' }],
    paths: {
      '/items': {
        get: {
          operationId: 'listItems',
          responses: {
            '200': {
              description: 'Items',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
  } as const;
}

function createGraphQlPayload() {
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
                type: {
                  kind: 'LIST',
                  name: null,
                  ofType: { kind: 'SCALAR', name: 'String' },
                },
              },
            ],
          },
        ],
      },
    },
  } as const;
}

describe('external API discovery', () => {
  it('creates direct, service-relative, and origin-relative OpenAPI candidates', () => {
    expect(createOpenApiDiscoveryCandidates('https://api.example.com/service')).toEqual(
      expect.arrayContaining([
        'https://api.example.com/service',
        'https://api.example.com/service/openapi.json',
        'https://api.example.com/openapi.json',
        'https://api.example.com/service/v3/api-docs',
        'https://api.example.com/v3/api-docs',
      ]),
    );
  });

  it('rejects non-http URLs and URLs containing inline credentials', () => {
    expect(createOpenApiDiscoveryCandidates('file:///tmp/openapi.json')).toEqual([]);
    expect(createOpenApiDiscoveryCandidates('https://user:secret@example.com/openapi.json')).toEqual(
      [],
    );
  });

  it('imports a directly supplied OpenAPI document URL', async () => {
    const calls: string[] = [];
    const fetch: ExternalApiFetch = async (url) => {
      calls.push(url);
      return jsonResponse(createOpenApiDocument());
    };

    const result = await discoverOpenApiDataSource({
      id: 'inventory',
      url: 'https://api.example.com/openapi.json',
      fetch,
    });

    expect(result.ok).toBe(true);
    expect(calls).toEqual(['https://api.example.com/openapi.json']);
    if (result.ok) {
      expect(result.documentUrl).toBe('https://api.example.com/openapi.json');
      expect(result.data.kind).toBe('openapi');
      expect(result.data.endpoints.items?.operations.listitems?.intent).toBe('read');
      expect(result.attempts).toEqual([
        {
          url: 'https://api.example.com/openapi.json',
          outcome: 'matched',
          status: 200,
        },
      ]);
    }
  });

  it('falls back to a conventional OpenAPI location', async () => {
    const calls: string[] = [];
    const fetch: ExternalApiFetch = async (url) => {
      calls.push(url);
      return url === 'https://api.example.com/service/openapi.json'
        ? jsonResponse(createOpenApiDocument())
        : jsonResponse({ message: 'not a schema' }, 404);
    };

    const result = await discoverOpenApiDataSource({
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
    if (result.ok) {
      expect(result.documentUrl).toBe('https://api.example.com/service/openapi.json');
      expect(result.attempts.map((attempt) => attempt.outcome)).toEqual([
        'http-error',
        'matched',
      ]);
    }
  });

  it('returns safe diagnostics when no OpenAPI document can be discovered', async () => {
    const fetch: ExternalApiFetch = async () => jsonResponse({ error: 'private detail' }, 404);
    const result = await discoverOpenApiDataSource({
      id: 'missing',
      url: 'https://api.example.com',
      conventionalPaths: [],
      fetch,
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'missing-schema',
      dataSourceId: 'missing',
      severity: 'error',
    });
    expect(JSON.stringify(result)).not.toContain('private detail');
  });

  it('executes GraphQL introspection and normalizes discovered operations', async () => {
    let capturedInit: ExternalApiFetchInit | undefined;
    const fetch: ExternalApiFetch = async (_url, init) => {
      capturedInit = init;
      return jsonResponse(createGraphQlPayload());
    };

    const result = await introspectGraphQlDataSource({
      id: 'catalog',
      endpointUrl: 'https://api.example.com/graphql',
      headers: { authorization: 'Bearer server-only' },
      fetch,
    });

    expect(result.ok).toBe(true);
    expect(capturedInit?.method).toBe('POST');
    expect(capturedInit?.body).toContain('AnkhorageGraphQlIntrospection');
    if (result.ok) {
      expect(result.data.kind).toBe('graphql');
      expect(result.data.endpoints.graphql?.operations['query.items']).toBeDefined();
      expect(JSON.stringify(result)).not.toContain('server-only');
    }
  });

  it('reports GraphQL transport and response-shape failures without response bodies', async () => {
    const httpFailure = await introspectGraphQlDataSource({
      id: 'catalog',
      endpointUrl: 'https://api.example.com/graphql',
      fetch: async () => jsonResponse({ secret: 'hidden' }, 403),
    });
    expect(httpFailure).toMatchObject({ ok: false, status: 403 });
    expect(JSON.stringify(httpFailure)).not.toContain('hidden');

    const shapeFailure = await introspectGraphQlDataSource({
      id: 'catalog',
      endpointUrl: 'https://api.example.com/graphql',
      fetch: async () => jsonResponse({ data: {} }),
    });
    expect(shapeFailure.ok).toBe(false);
    expect(shapeFailure.diagnostics[0]?.code).toBe('parse-error');
  });
});
