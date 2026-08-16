import { describe, expect, it } from 'bun:test';

import {
  createGraphQlApi,
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

describe('GraphQL API normalization', () => {
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

  it('creates a canonical external GraphQL API', () => {
    const result = createGraphQlApi({
      id: 'content',
      endpointUrl: 'https://example.com/graphql',
      introspection: introspection(),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({ origin: 'external', protocol: 'graphql' });
      expect('kind' in result.data).toBe(false);
      expect(result.data.endpoints.graphql?.baseUrl).toBeUndefined();
      expect(result.data.endpoints.graphql?.operations['query.posts']?.intent).toBe('read');
    }
  });

  it('supports manual operations and validates endpoint URLs', () => {
    const manual = createGraphQlApi({
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
    const invalid = createGraphQlApi({ id: 'broken', endpointUrl: ' ' });
    expect(manual.ok).toBe(true);
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.diagnostics[0]?.apiId).toBe('broken');
  });
});
