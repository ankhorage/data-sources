import { describe, expect, it } from 'bun:test';

import {
  createOpenApiDiscoveryCandidates,
  discoverOpenApiDataSource,
  type ExternalApiFetch,
  type ExternalApiFetchResponse,
  introspectGraphQlDataSource,
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

describe('external API discovery', () => {
  it('creates direct and conventional candidates and rejects unsafe URLs', () => {
    const candidates = createOpenApiDiscoveryCandidates('https://api.example.com/service');
    expect(candidates).toContain('https://api.example.com/service');
    expect(candidates).toContain('https://api.example.com/service/openapi.json');
    expect(candidates).toContain('https://api.example.com/openapi.json');
    expect(createOpenApiDiscoveryCandidates('file:///tmp/openapi.json')).toEqual([]);
    expect(
      createOpenApiDiscoveryCandidates('https://user:secret@example.com/openapi.json'),
    ).toEqual([]);
  });

  it('discovers OpenAPI into an external REST source', async () => {
    const result = await discoverOpenApiDataSource({
      id: 'inventory',
      url: 'https://api.example.com/openapi.json',
      fetch: () => Promise.resolve(jsonResponse(openApiDocument())),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({ kind: 'api', origin: 'external', protocol: 'rest' });
      expect(result.data.openApi?.url).toBe('https://api.example.com/openapi.json');
      expect(result.attempts[0]?.outcome).toBe('matched');
    }
  });

  it('falls back to conventional locations and keeps diagnostics safe', async () => {
    const calls: string[] = [];
    const fetch: ExternalApiFetch = (url) => {
      calls.push(url);
      return Promise.resolve(
        url.endsWith('/service/openapi.json')
          ? jsonResponse(openApiDocument())
          : jsonResponse({ private: 'hidden' }, 404),
      );
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
    expect(JSON.stringify(result)).not.toContain('hidden');
  });

  it('introspects GraphQL without echoing trusted headers', async () => {
    const result = await introspectGraphQlDataSource({
      id: 'catalog',
      endpointUrl: 'https://api.example.com/graphql',
      headers: { authorization: 'Bearer server-only' },
      fetch: () => Promise.resolve(jsonResponse(graphQlPayload())),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({ kind: 'api', origin: 'external', protocol: 'graphql' });
      expect(result.data.endpoints.graphql?.operations['query.items']).toBeDefined();
      expect(JSON.stringify(result)).not.toContain('server-only');
    }
  });

  it('reports transport and response-shape failures safely', async () => {
    const http = await introspectGraphQlDataSource({
      id: 'catalog',
      endpointUrl: 'https://api.example.com/graphql',
      fetch: () => Promise.resolve(jsonResponse({ secret: 'hidden' }, 403)),
    });
    const shape = await introspectGraphQlDataSource({
      id: 'catalog',
      endpointUrl: 'https://api.example.com/graphql',
      fetch: () => Promise.resolve(jsonResponse({ data: {} })),
    });
    expect(http).toMatchObject({ ok: false, status: 403 });
    expect(JSON.stringify(http)).not.toContain('hidden');
    expect(shape.ok).toBe(false);
  });
});
