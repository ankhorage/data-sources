import { describe, expect, it } from 'bun:test';

import {
  createGraphQlDataSource,
  createGraphQlIntrospectionRequest,
  type GraphQlIntrospectionResult,
  normalizeGraphQlIntrospectionOperations,
  normalizeGraphQlIntrospectionSchemas,
  normalizeGraphQlOperationId,
} from './index';

function introspection(): GraphQlIntrospectionResult {
  return {
    __schema: {
      queryType: { name: 'Query' },
      mutationType: { name: 'Mutation' },
      types: [
        {
          kind: 'OBJECT',
          name: 'Query',
          fields: [
            {
              name: 'posts',
              args: [],
              type: { kind: 'LIST', ofType: { kind: 'OBJECT', name: 'Post' } },
            },
          ],
        },
        {
          kind: 'OBJECT',
          name: 'Mutation',
          fields: [{ name: 'createPost', args: [], type: { kind: 'OBJECT', name: 'Post' } }],
        },
        {
          kind: 'OBJECT',
          name: 'Post',
          fields: [
            {
              name: 'id',
              type: { kind: 'NON_NULL', ofType: { kind: 'SCALAR', name: 'ID' } },
            },
          ],
        },
      ],
    },
  };
}

describe('GraphQL normalization', () => {
  it('creates the standard introspection request and stable IDs', () => {
    expect(createGraphQlIntrospectionRequest().query).toContain('__schema');
    expect(normalizeGraphQlOperationId('query', 'Posts')).toBe('query.posts');
  });

  it('normalizes introspection schemas and operations', () => {
    expect(normalizeGraphQlIntrospectionSchemas(introspection())?.Post?.required).toContain('id');
    expect(normalizeGraphQlIntrospectionOperations(introspection()).map((item) => item.id)).toEqual(
      ['query.posts', 'mutation.createpost'],
    );
  });

  it('creates an external GraphQL API source', () => {
    const result = createGraphQlDataSource({
      id: 'content',
      endpointUrl: 'https://example.com/graphql',
      introspection: introspection(),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({
        kind: 'api',
        origin: 'external',
        protocol: 'graphql',
      });
      expect(result.data.endpoints.graphql?.operations['query.posts']?.intent).toBe('read');
    }
  });

  it('supports manual operations and validates endpoint URLs', () => {
    const manual = createGraphQlDataSource({
      id: 'manual',
      endpointUrl: 'https://example.com/graphql',
      introspectionEnabled: false,
      operations: [
        {
          id: 'query.viewer',
          kind: 'query',
          document: 'query Viewer { viewer { id } }',
        },
      ],
    });
    const invalid = createGraphQlDataSource({ id: 'broken', endpointUrl: ' ' });
    expect(manual.ok).toBe(true);
    expect(invalid.ok).toBe(false);
  });
});
