import { describe, expect, it } from 'bun:test';

import {
  createManualRestDataSource,
  extractRestPathParams,
  isManualRestMethod,
  type ManualRestDataSourceDefinition,
  normalizeManualRestDataSource,
  normalizeManualRestMethod,
} from './index';

function assertSerializable<TValue>(value: TValue): void {
  expect(JSON.parse(JSON.stringify(value))).toEqual(value);
}

function createBlogDefinition(): ManualRestDataSourceDefinition {
  return {
    id: 'blog-api',
    name: 'Blog API',
    baseUrl: 'https://api.example.com',
    credential: {
      id: 'blog-api-token',
      kind: 'bearer',
      label: 'Blog API token',
    },
    schemas: {
      post: {
        type: 'object',
        required: ['id', 'title'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          published: { type: 'boolean' },
        },
      },
    },
    endpoints: [
      {
        id: 'posts',
        path: '/posts',
        operations: [
          {
            id: 'posts.list',
            method: 'GET',
            intent: 'read',
            parameters: [
              {
                name: 'limit',
                location: 'query',
                schema: { type: 'integer', default: 20 },
              },
            ],
            response: {
              status: 200,
              schema: {
                type: 'array',
                items: { ref: { id: 'post' } },
              },
            },
            pagination: {
              kind: 'limit-offset',
              limitParameter: 'limit',
              offsetParameter: 'offset',
            },
          },
          {
            id: 'posts.create',
            method: 'POST',
            intent: 'create',
            request: {
              contentType: 'application/json',
              schemaRef: { id: 'post' },
            },
            response: {
              status: 201,
              schemaRef: { id: 'post' },
            },
          },
        ],
      },
      {
        id: 'post',
        path: '/posts/{postId}',
        operations: [
          {
            id: 'posts.get',
            method: 'get',
            intent: 'read',
            parameters: [
              {
                name: 'postId',
                location: 'path',
                required: true,
                schema: { type: 'string' },
              },
            ],
            response: {
              status: 200,
              schemaRef: { id: 'post' },
            },
          },
          {
            id: 'posts.update',
            method: 'PATCH',
            intent: 'update',
            parameters: [
              {
                name: 'postId',
                location: 'path',
                required: true,
                schema: { type: 'string' },
              },
            ],
            request: {
              contentType: 'application/json',
              schemaRef: { id: 'post' },
            },
            response: {
              status: 200,
              schemaRef: { id: 'post' },
            },
          },
          {
            id: 'posts.delete',
            method: 'DELETE',
            intent: 'delete',
            parameters: [
              {
                name: 'postId',
                location: 'path',
                required: true,
                schema: { type: 'string' },
              },
            ],
            response: {
              status: 204,
            },
          },
        ],
      },
    ],
  };
}

describe('manual REST data-source helpers', () => {
  it('normalizes REST methods', () => {
    expect(normalizeManualRestMethod('get')).toBe('GET');
    expect(isManualRestMethod('GET')).toBe(true);
    expect(isManualRestMethod('TRACE')).toBe(false);
  });

  it('extracts braced and colon path parameters', () => {
    expect(extractRestPathParams('/posts/{postId}/comments/:commentId')).toEqual([
      'postId',
      'commentId',
    ]);
  });

  it('normalizes list, get, create, update, and delete operations', () => {
    const source = normalizeManualRestDataSource(createBlogDefinition());

    assertSerializable(source);
    expect(source.kind).toBe('rest');
    expect(source.endpoints.posts?.operations['posts.list']?.intent).toBe('read');
    expect(source.endpoints.post?.operations['posts.get']?.method).toBe('GET');
    expect(source.endpoints.posts?.operations['posts.create']?.intent).toBe('create');
    expect(source.endpoints.post?.operations['posts.update']?.intent).toBe('update');
    expect(source.endpoints.post?.operations['posts.delete']?.intent).toBe('delete');
  });

  it('returns an ok diagnostic result for valid manual definitions', () => {
    const result = createManualRestDataSource(createBlogDefinition());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(
        result.data.endpoints.post?.operations['posts.get']?.request?.parameters?.[0]?.name,
      ).toBe('postId');
      expect(result.diagnostics).toEqual([]);
    }
  });

  it('reports missing base URL', () => {
    const result = createManualRestDataSource({
      ...createBlogDefinition(),
      baseUrl: ' ',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics.map((diagnostic) => diagnostic.path)).toContain('baseUrl');
    }
  });

  it('reports invalid methods and path-template mismatches', () => {
    const result = createManualRestDataSource({
      id: 'broken-api',
      baseUrl: 'https://api.example.com',
      endpoints: [
        {
          id: 'broken',
          path: 'broken/{id}',
          operations: [
            {
              id: 'broken.trace',
              method: 'TRACE',
              intent: 'read',
              parameters: [
                {
                  name: 'unusedId',
                  location: 'path',
                  schema: { type: 'string' },
                },
              ],
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics.map((diagnostic) => diagnostic.message)).toEqual(
        expect.arrayContaining([
          'Manual REST endpoint paths must start with `/`.',
          'Manual REST operation method must be one of DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT.',
          "Path template parameter 'id' must have a matching path parameter definition.",
          "Path parameter 'unusedId' is not referenced by the operation path template.",
        ]),
      );
    }
  });
});
