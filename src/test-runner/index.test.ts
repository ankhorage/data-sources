import type { ApiDefinition, ExternalRestApiDefinition } from '@ankhorage/contracts/data';
import { expect, it } from 'bun:test';

import { buildEndpointTestRequest, type EndpointTestFetch, testEndpoint } from './index';

function nutritionApi(): ExternalRestApiDefinition {
  return {
    id: 'nutrition',
    origin: 'external',
    protocol: 'rest',
    baseUrl: 'https://api.ankhorage.com/v1/nutrition',
    endpoints: {
      products: {
        id: 'products',
        kind: 'http',
        path: '/products',
        operations: {
          'products.list': {
            id: 'products.list',
            endpointId: 'products',
            protocol: 'http',
            intent: 'read',
            method: 'GET',
            path: '/products',
          },
        },
      },
    },
  };
}

function parameterApi(): ExternalRestApiDefinition {
  return {
    id: 'cms',
    origin: 'external',
    protocol: 'rest',
    baseUrl: 'https://cms.example.com',
    credential: { id: 'cms-token', kind: 'bearer' },
    endpoints: {
      posts: {
        id: 'posts',
        kind: 'http',
        operations: {
          'posts.get': {
            id: 'posts.get',
            endpointId: 'posts',
            protocol: 'http',
            intent: 'read',
            method: 'GET',
            path: '/posts/{postId}',
            request: {
              parameters: [
                { name: 'postId', location: 'path', required: true, schema: { type: 'string' } },
                { name: 'preview', location: 'query', schema: { type: 'boolean' } },
                { name: 'x-locale', location: 'header', schema: { type: 'string' } },
              ],
            },
          },
          'posts.create': {
            id: 'posts.create',
            endpointId: 'posts',
            protocol: 'http',
            intent: 'create',
            method: 'POST',
            path: '/posts',
            request: {
              contentType: 'application/json',
              parameters: [
                { name: 'title', location: 'body', required: true, schema: { type: 'string' } },
                { name: 'published', location: 'body', schema: { type: 'boolean' } },
              ],
            },
          },
        },
      },
    },
  };
}

function graphQlApi(): ApiDefinition {
  return {
    id: 'content',
    origin: 'external',
    protocol: 'graphql',
    endpointUrl: 'https://content.example.com/graphql',
    endpoints: {
      graphql: {
        id: 'graphql',
        kind: 'graphql',
        operations: {
          'query.viewer': {
            id: 'query.viewer',
            endpointId: 'graphql',
            protocol: 'graphql',
            intent: 'read',
            metadata: { document: 'query Viewer($id: ID!) { viewer(id: $id) { id } }' },
          },
        },
      },
    },
  };
}

it('builds the canonical Nutrition products URL', async () => {
  const result = await buildEndpointTestRequest({
    api: nutritionApi(),
    endpointId: 'products',
    operationId: 'products.list',
    dryRun: true,
  });
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.request.apiId).toBe('nutrition');
    expect(result.request.method).toBe('GET');
    expect(result.request.url).toBe('https://api.ankhorage.com/v1/nutrition/products');
  }
});

it('serializes path, query and header parameters with credentials', async () => {
  const result = await buildEndpointTestRequest({
    api: parameterApi(),
    endpointId: 'posts',
    operationId: 'posts.get',
    dryRun: true,
    values: { postId: 'post 1', preview: true, 'x-locale': 'de-CH' },
    credentialResolver: () => ({ headers: { authorization: 'Bearer token' } }),
  });
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.request.url).toBe('https://cms.example.com/posts/post%201?preview=true');
    expect(result.request.headers).toEqual({
      authorization: 'Bearer token',
      'x-locale': 'de-CH',
    });
  }
});

it('serializes body parameters without provider-specific handling', async () => {
  const result = await buildEndpointTestRequest({
    api: parameterApi(),
    endpointId: 'posts',
    operationId: 'posts.create',
    dryRun: true,
    values: { title: 'Hello', published: true },
    credentialResolver: () => ({ headers: {} }),
  });
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.request.body).toBe('{"title":"Hello","published":true}');
    expect(result.request.headers['content-type']).toBe('application/json');
  }
});

it('executes external REST requests and parses responses', async () => {
  const fetch: EndpointTestFetch = () =>
    Promise.resolve({ status: 200, text: () => Promise.resolve('{"products":[]}') });
  const result = await testEndpoint({
    api: nutritionApi(),
    endpointId: 'products',
    operationId: 'products.list',
    fetch,
  });
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.data).toEqual({ products: [] });
});

it('builds GraphQL requests through the same canonical API input', async () => {
  const result = await buildEndpointTestRequest({
    api: graphQlApi(),
    endpointId: 'graphql',
    operationId: 'query.viewer',
    dryRun: true,
    values: { variables: { id: 'viewer-1' } },
  });
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.request.url).toBe('https://content.example.com/graphql');
    expect(result.request.method).toBe('POST');
  }
});

it('rejects internal APIs during phase 1', async () => {
  const internal: ApiDefinition = {
    id: 'future-api',
    origin: 'internal',
    protocol: 'rest',
    basePath: '/v1/future',
    endpoints: {},
  };
  const result = await buildEndpointTestRequest({
    api: internal,
    endpointId: 'products',
    operationId: 'products.list',
  });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.diagnostics[0]?.apiId).toBe('future-api');
    expect(result.diagnostics[0]?.message).toContain('not executable in API phase 1');
  }
});

it('never treats database protocol operations as API HTTP operations', async () => {
  const api: ExternalRestApiDefinition = {
    id: 'broken-api',
    origin: 'external',
    protocol: 'rest',
    baseUrl: 'https://example.com',
    endpoints: {
      products: {
        id: 'products',
        kind: 'http',
        operations: {
          'products.list': {
            id: 'products.list',
            endpointId: 'products',
            protocol: 'database',
            intent: 'read',
            path: '/products',
          },
        },
      },
    },
  };
  const result = await buildEndpointTestRequest({
    api,
    endpointId: 'products',
    operationId: 'products.list',
  });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.diagnostics[0]?.message).toContain("protocol 'database'");
});
