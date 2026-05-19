import { describe, expect, it } from 'bun:test';

import type { DataSourceConfig } from '@ankhorage/contracts/data';

import { buildEndpointTestRequest, testEndpoint, type EndpointTestFetch } from './index';

function createRestDataSource(): DataSourceConfig {
  return {
    id: 'cms',
    kind: 'rest',
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
                {
                  name: 'preview',
                  location: 'query',
                  schema: { type: 'boolean' },
                },
              ],
            },
            response: {
              status: 200,
              schema: {
                type: 'object',
              },
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
              schema: { type: 'object' },
            },
            response: {
              status: 201,
              schema: { type: 'object' },
            },
          },
        },
      },
    },
  };
}

function createGraphQlDataSource(): DataSourceConfig {
  return {
    id: 'content',
    kind: 'graphql',
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
            request: { schema: { type: 'object' } },
            response: { schema: { type: 'object' } },
            metadata: {
              document: 'query Viewer($id: ID!) { viewer(id: $id) { id } }',
              selectionPath: '$.data.viewer',
            },
          },
        },
      },
    },
  };
}

describe('endpoint test runner', () => {
  it('builds a dry-run REST request with path, query, and credential headers', async () => {
    const result = await buildEndpointTestRequest({
      dataSource: createRestDataSource(),
      endpointId: 'posts',
      operationId: 'posts.get',
      dryRun: true,
      values: {
        postId: 'post 1',
        preview: true,
      },
      credentialResolver: () => ({
        headers: { authorization: 'Bearer token' },
      }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.request.url).toBe('https://cms.example.com/posts/post%201?preview=true');
      expect(result.request.method).toBe('GET');
      expect(result.request.headers.authorization).toBe('Bearer token');
      expect(result.request.dryRun).toBe(true);
    }
  });

  it('executes a successful REST request and parses JSON responses', async () => {
    const fetch: EndpointTestFetch = (url, init) => {
      expect(url).toBe('https://cms.example.com/posts/post-1');
      expect(init.method).toBe('GET');
      return Promise.resolve({
        status: 200,
        headers: { 'content-type': 'application/json' },
        text: () => Promise.resolve('{"id":"post-1"}'),
      });
    };

    const result = await testEndpoint({
      dataSource: createRestDataSource(),
      endpointId: 'posts',
      operationId: 'posts.get',
      values: { postId: 'post-1' },
      credentialResolver: () => ({ headers: { authorization: 'Bearer token' } }),
      fetch,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.response?.status).toBe(200);
      expect(result.data).toEqual({ id: 'post-1' });
    }
  });

  it('returns structured diagnostics for HTTP errors', async () => {
    const fetch: EndpointTestFetch = () =>
      Promise.resolve({
        status: 404,
        text: () => Promise.resolve('{"error":"Not found"}'),
      });

    const result = await testEndpoint({
      dataSource: createRestDataSource(),
      endpointId: 'posts',
      operationId: 'posts.get',
      values: { postId: 'missing' },
      credentialResolver: () => ({ headers: { authorization: 'Bearer token' } }),
      fetch,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response?.status).toBe(404);
      expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain('http-error');
    }
  });

  it('returns structured diagnostics for network errors', async () => {
    const fetch: EndpointTestFetch = () => Promise.reject(new Error('Connection failed'));

    const result = await testEndpoint({
      dataSource: createRestDataSource(),
      endpointId: 'posts',
      operationId: 'posts.get',
      values: { postId: 'post-1' },
      credentialResolver: () => ({ headers: { authorization: 'Bearer token' } }),
      fetch,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain('network-error');
      expect(result.diagnostics.map((diagnostic) => diagnostic.message)).toContain('Connection failed');
    }
  });

  it('returns structured diagnostics for missing credentials', async () => {
    const result = await buildEndpointTestRequest({
      dataSource: createRestDataSource(),
      endpointId: 'posts',
      operationId: 'posts.get',
      values: { postId: 'post-1' },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain('missing-credential');
    }
  });

  it('returns structured diagnostics for invalid input', async () => {
    const result = await buildEndpointTestRequest({
      dataSource: createRestDataSource(),
      endpointId: 'posts',
      operationId: 'posts.get',
      credentialResolver: () => ({ headers: { authorization: 'Bearer token' } }),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics.map((diagnostic) => diagnostic.message)).toContain(
        "Missing required path parameter 'postId'.",
      );
    }
  });

  it('builds POST request bodies from input body values', async () => {
    const result = await buildEndpointTestRequest({
      dataSource: createRestDataSource(),
      endpointId: 'posts',
      operationId: 'posts.create',
      dryRun: true,
      values: {
        body: { title: 'Hello' },
      },
      credentialResolver: () => ({ headers: { authorization: 'Bearer token' } }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.request.method).toBe('POST');
      expect(result.request.body).toBe('{"title":"Hello"}');
      expect(result.request.headers['content-type']).toBe('application/json');
    }
  });

  it('builds dry-run GraphQL requests from operation metadata', async () => {
    const result = await buildEndpointTestRequest({
      dataSource: createGraphQlDataSource(),
      endpointId: 'graphql',
      operationId: 'query.viewer',
      dryRun: true,
      values: {
        variables: { id: 'viewer-1' },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.request.url).toBe('https://content.example.com/graphql');
      expect(result.request.method).toBe('POST');
      expect(result.request.headers['content-type']).toBe('application/json');
      expect(result.request.body).toBe(
        '{"query":"query Viewer($id: ID!) { viewer(id: $id) { id } }","variables":{"id":"viewer-1"}}',
      );
    }
  });
});
