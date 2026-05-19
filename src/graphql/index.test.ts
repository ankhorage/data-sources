import { describe, expect, it } from 'bun:test';

import {
  createGraphQlDataSource,
  createGraphQlIntrospectionRequest,
  type GraphQlIntrospectionResult,
  normalizeGraphQlIntrospectionOperations,
  normalizeGraphQlIntrospectionSchemas,
  normalizeGraphQlOperationId,
} from './index';

function assertSerializable<TValue>(value: TValue): void {
  expect(JSON.parse(JSON.stringify(value))).toEqual(value);
}

function createIntrospection(): GraphQlIntrospectionResult {
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
              description: 'List posts.',
              args: [
                {
                  name: 'limit',
                  type: { kind: 'SCALAR', name: 'Int' },
                  defaultValue: '20',
                },
              ],
              type: {
                kind: 'LIST',
                ofType: { kind: 'OBJECT', name: 'Post' },
              },
            },
          ],
        },
        {
          kind: 'OBJECT',
          name: 'Mutation',
          fields: [
            {
              name: 'createPost',
              args: [
                {
                  name: 'title',
                  type: { kind: 'NON_NULL', ofType: { kind: 'SCALAR', name: 'String' } },
                },
              ],
              type: { kind: 'OBJECT', name: 'Post' },
            },
          ],
        },
        {
          kind: 'OBJECT',
          name: 'Post',
          fields: [
            {
              name: 'id',
              type: { kind: 'NON_NULL', ofType: { kind: 'SCALAR', name: 'ID' } },
            },
            {
              name: 'title',
              type: { kind: 'SCALAR', name: 'String' },
            },
          ],
        },
      ],
    },
  };
}

describe('GraphQL introspection normalization', () => {
  it('creates the standard introspection request', () => {
    const request = createGraphQlIntrospectionRequest();

    expect(request.operationName).toBe('AnkhorageGraphQlIntrospection');
    expect(request.query).toContain('__schema');
  });

  it('normalizes operation ids', () => {
    expect(normalizeGraphQlOperationId('query', 'Posts')).toBe('query.posts');
    expect(normalizeGraphQlOperationId('mutation', 'Create Post')).toBe('mutation.create-post');
  });

  it('normalizes schemas from introspection results', () => {
    const schemas = normalizeGraphQlIntrospectionSchemas(createIntrospection());

    assertSerializable(schemas);
    expect(schemas?.Post?.properties?.id?.type).toBe('string');
    expect(schemas?.Post?.required).toContain('id');
  });

  it('normalizes query and mutation operations from introspection results', () => {
    const operations = normalizeGraphQlIntrospectionOperations(createIntrospection());

    assertSerializable(operations);
    expect(operations.map((operation) => operation.id)).toEqual([
      'query.posts',
      'mutation.createpost',
    ]);
    expect(operations[0]?.variables?.properties?.limit?.type).toBe('integer');
    expect(operations[1]?.variables?.required).toContain('title');
  });

  it('creates a serializable GraphQL data source from introspection', () => {
    const result = createGraphQlDataSource({
      id: 'content-graphql',
      endpointUrl: 'https://content.example.com/graphql',
      introspection: createIntrospection(),
      schemaVersion: '2026-05-19',
      credential: {
        id: 'content-token',
        kind: 'bearer',
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      assertSerializable(result.data);
      expect(result.data.kind).toBe('graphql');
      expect(result.data.endpointUrl).toBe('https://content.example.com/graphql');
      expect(result.data.introspection?.enabled).toBe(true);
      expect(result.data.endpoints.graphql?.operations['query.posts']?.intent).toBe('read');
      expect(result.data.endpoints.graphql?.operations['mutation.createpost']?.intent).toBe(
        'action',
      );
      expect(
        result.data.endpoints.graphql?.operations['mutation.createpost']?.request?.schema?.required,
      ).toContain('title');
    }
  });

  it('creates a data source with manual GraphQL operations when introspection is unavailable', () => {
    const result = createGraphQlDataSource({
      id: 'manual-graphql',
      endpointUrl: 'https://manual.example.com/graphql',
      introspectionEnabled: false,
      operations: [
        {
          id: 'query.viewer',
          kind: 'query',
          name: 'viewer',
          document: 'query Viewer { viewer { id } }',
          variables: { type: 'object' },
          response: {
            type: 'object',
            properties: {
              viewer: { type: 'object' },
            },
          },
          selectionPath: '$.data.viewer',
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const metadata = result.data.endpoints.graphql?.operations['query.viewer']?.metadata;

      expect(metadata).toBeDefined();
      if (metadata !== undefined && typeof metadata === 'object' && !Array.isArray(metadata)) {
        expect(metadata.selectionPath).toBe('$.data.viewer');
      }
      expect(result.diagnostics).toEqual([]);
    }
  });

  it('reports invalid endpoint URLs and disabled-introspection mismatches', () => {
    const result = createGraphQlDataSource({
      id: 'broken-graphql',
      endpointUrl: ' ',
      introspectionEnabled: false,
      introspection: createIntrospection(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const paths = result.diagnostics.map((diagnostic) => diagnostic.path);

      expect(paths).toContain('endpointUrl');
      expect(paths).toContain('introspection');
    }
  });

  it('reports missing introspection as info for manual operation workflows', () => {
    const result = createGraphQlDataSource({
      id: 'manual-graphql',
      endpointUrl: 'https://manual.example.com/graphql',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.diagnostics?.map((diagnostic) => diagnostic.code)).toContain('missing-schema');
    }
  });
});
