import type { DataSourceConfig } from '@ankhorage/contracts/data';
import { describe, expect, it } from 'bun:test';

import { buildEndpointTestRequest, type EndpointTestFetch, testEndpoint } from './index';

function restSource(): DataSourceConfig {
  return {
    id: 'cms',
    kind: 'api',
    origin: 'external',
    protocol: 'rest',
    baseUrl: 'https://cms.example.com',
    credential: { id: 'cms-token', kind: 'bearer' },
    endpoints: {
      posts: {
        id: 'posts',
        kind: 'http',
        path: '/posts/{postId}',
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
                {
                  name: 'postId',
                  location: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
                { name: 'preview', location: 'query', schema: { type: 'boolean' } },
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
          },
        },
      },
    },
  };
}

function graphQlSource(): DataSourceConfig {
  return {
    id: 'content',
    kind: 'api',
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

describe('endpoint test runner', () => {
  it('builds REST dry runs with params and credential headers', async () => {
    const result = await buildEndpointTestRequest({
      dataSource: restSource(),
      endpointId: 'posts',
      operationId: 'posts.get',
      dryRun: true,
      values: { postId: 'post 1', preview: true },
      credentialResolver: () => ({ headers: { authorization: 'Bearer token' } }),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.request.url).toBe('https://cms.example.com/posts/post%201?preview=true');
      expect(result.request.headers.authorization).toBe('Bearer token');
    }
  });

  it('executes REST requests and parses responses', async () => {
    const fetch: EndpointTestFetch = () =>
      Promise.resolve({ status: 200, text: () => Promise.resolve('{"id":"post-1"}') });
    const result = await testEndpoint({
      dataSource: restSource(),
      endpointId: 'posts',
      operationId: 'posts.get',
      values: { postId: 'post-1' },
      credentialResolver: () => ({ headers: { authorization: 'Bearer token' } }),
      fetch,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: 'post-1' });
  });

  it('returns HTTP, network, credential and input diagnostics', async () => {
    const http = await testEndpoint({
      dataSource: restSource(),
      endpointId: 'posts',
      operationId: 'posts.get',
      values: { postId: 'missing' },
      credentialResolver: () => ({ headers: {} }),
      fetch: () => Promise.resolve({ status: 404, text: () => Promise.resolve('{}') }),
    });
    const network = await testEndpoint({
      dataSource: restSource(),
      endpointId: 'posts',
      operationId: 'posts.get',
      values: { postId: 'x' },
      credentialResolver: () => ({ headers: {} }),
      fetch: () => Promise.reject(new Error('Connection failed')),
    });
    const credential = await buildEndpointTestRequest({
      dataSource: restSource(),
      endpointId: 'posts',
      operationId: 'posts.get',
      values: { postId: 'x' },
    });
    const input = await buildEndpointTestRequest({
      dataSource: restSource(),
      endpointId: 'posts',
      operationId: 'posts.get',
      credentialResolver: () => ({ headers: {} }),
    });
    expect(http.ok).toBe(false);
    expect(network.ok).toBe(false);
    expect(credential.ok).toBe(false);
    expect(input.ok).toBe(false);
  });

  it('builds POST bodies and GraphQL requests', async () => {
    const post = await buildEndpointTestRequest({
      dataSource: restSource(),
      endpointId: 'posts',
      operationId: 'posts.create',
      dryRun: true,
      values: { body: { title: 'Hello' } },
      credentialResolver: () => ({ headers: {} }),
    });
    const graphql = await buildEndpointTestRequest({
      dataSource: graphQlSource(),
      endpointId: 'graphql',
      operationId: 'query.viewer',
      dryRun: true,
      values: { variables: { id: 'viewer-1' } },
    });
    expect(post.ok).toBe(true);
    if (post.ok) expect(post.request.body).toBe('{"title":"Hello"}');
    expect(graphql.ok).toBe(true);
    if (graphql.ok) expect(graphql.request.url).toBe('https://content.example.com/graphql');
  });

  it('does not pretend database-backed generated operations are HTTP endpoints', async () => {
    const source: DataSourceConfig = {
      id: 'catalog',
      kind: 'api',
      origin: 'generated',
      protocol: 'rest',
      generatedApiId: 'catalog',
      adapter: { id: 'db', kind: 'database' },
      endpoints: {
        products: {
          id: 'products',
          kind: 'database',
          operations: {
            'products.list': {
              id: 'products.list',
              endpointId: 'products',
              protocol: 'database',
              intent: 'read',
            },
          },
        },
      },
    };
    const result = await buildEndpointTestRequest({
      dataSource: source,
      endpointId: 'products',
      operationId: 'products.list',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics[0]?.message).toContain('adapter executor');
  });
});
