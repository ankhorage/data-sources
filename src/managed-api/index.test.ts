import { describe, expect, it } from 'bun:test';

import {
  createManagedApiDataSource,
  createManagedApiOperationId,
  createManagedApiResourceSchema,
  getManagedApiOperations,
  type ManagedApiGenerationDefinition,
  normalizeManagedApiDataSource,
} from './index';

function assertSerializable<TValue>(value: TValue): void {
  expect(JSON.parse(JSON.stringify(value))).toEqual(value);
}

function createPostsApiDefinition(): ManagedApiGenerationDefinition {
  return {
    id: 'posts-api',
    name: 'Posts API',
    adapter: {
      id: 'primary-db',
      kind: 'database',
      packageName: '@ankhorage/supabase-db',
    },
    resources: [
      {
        name: 'posts',
        collection: {
          name: 'posts',
          schema: 'public',
          primaryKey: 'id',
          fields: [
            { name: 'id', type: 'uuid', required: true, unique: true },
            { name: 'title', type: 'text', required: true },
            { name: 'published', type: 'boolean', defaultValue: false },
            { name: 'createdAt', type: 'datetime' },
            { name: 'metadata', type: 'json' },
          ],
        },
        policies: [{ id: 'posts-policy' }],
      },
    ],
  };
}

describe('managed API generation helpers', () => {
  it('generates deterministic operation IDs', () => {
    expect(createManagedApiOperationId('posts', 'list')).toBe('posts.list');
    expect(createManagedApiOperationId('posts', 'delete')).toBe('posts.delete');
  });

  it('uses all CRUD operations by default', () => {
    const [resource] = createPostsApiDefinition().resources;

    expect(resource).toBeDefined();
    if (resource !== undefined) {
      expect(getManagedApiOperations(resource)).toEqual([
        'list',
        'read',
        'create',
        'update',
        'delete',
      ]);
    }
  });

  it('generates a serializable resource schema from a DB collection', () => {
    const [resource] = createPostsApiDefinition().resources;

    expect(resource).toBeDefined();
    if (resource !== undefined) {
      const schema = createManagedApiResourceSchema(resource.collection);

      assertSerializable(schema);
      expect(schema.type).toBe('object');
      expect(schema.properties?.id?.format).toBe('uuid');
      expect(schema.properties?.createdAt?.format).toBe('date-time');
      expect(schema.properties?.metadata?.type).toBe('object');
      expect(schema.required).toEqual(['id', 'title']);
    }
  });

  it('generates list/read/create/update/delete endpoint configs', () => {
    const source = normalizeManagedApiDataSource(createPostsApiDefinition());

    assertSerializable(source);
    expect(source.kind).toBe('managed-api');
    expect(source.adapter.id).toBe('primary-db');
    expect(source.endpoints.posts?.kind).toBe('database');
    expect(source.endpoints.posts?.operations['posts.list']?.intent).toBe('read');
    expect(source.endpoints.posts?.operations['posts.read']?.intent).toBe('read');
    expect(source.endpoints.posts?.operations['posts.create']?.intent).toBe('create');
    expect(source.endpoints.posts?.operations['posts.update']?.intent).toBe('update');
    expect(source.endpoints.posts?.operations['posts.delete']?.intent).toBe('delete');
    expect(source.endpoints.posts?.operations['posts.read']?.request?.parameters?.[0]?.name).toBe(
      'id',
    );
    expect(
      source.endpoints.posts?.operations['posts.list']?.request?.parameters?.map(
        (parameter) => parameter.name,
      ),
    ).toEqual(['limit', 'offset']);
  });

  it('creates diagnostic result for valid managed APIs', () => {
    const result = createManagedApiDataSource(createPostsApiDefinition());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.resources[0]?.name).toBe('posts');
      expect(result.diagnostics).toEqual([]);
    }
  });

  it('supports multiple managed APIs backed by different adapter refs', () => {
    const postsApi = normalizeManagedApiDataSource(createPostsApiDefinition());
    const analyticsApi = normalizeManagedApiDataSource({
      id: 'analytics-api',
      adapter: {
        id: 'analytics-db',
        kind: 'database',
        packageName: '@ankhorage/postgres-db',
      },
      resources: [
        {
          name: 'events',
          operations: ['list'],
          collection: {
            name: 'events',
            primaryKey: 'id',
            fields: [
              { name: 'id', type: 'uuid', required: true, unique: true },
              { name: 'name', type: 'text', required: true },
            ],
          },
        },
      ],
    });

    assertSerializable([postsApi, analyticsApi]);
    expect(postsApi.id).toBe('posts-api');
    expect(analyticsApi.id).toBe('analytics-api');
    expect(postsApi.adapter.id).toBe('primary-db');
    expect(analyticsApi.adapter.id).toBe('analytics-db');
    expect(analyticsApi.endpoints.events?.operations['events.list']?.intent).toBe('read');
    expect(analyticsApi.endpoints.events?.operations['events.read']).toBeUndefined();
  });

  it('reports missing resources and missing primary key diagnostics', () => {
    const emptyResult = createManagedApiDataSource({
      id: 'empty-api',
      adapter: { id: 'db', kind: 'database' },
      resources: [],
    });
    const missingPrimaryKeyResult = createManagedApiDataSource({
      id: 'broken-api',
      adapter: { id: 'db', kind: 'database' },
      resources: [
        {
          name: 'posts',
          collection: {
            name: 'posts',
            fields: [{ name: 'title', type: 'text' }],
          },
        },
      ],
    });

    expect(emptyResult.ok).toBe(false);
    if (!emptyResult.ok) {
      expect(emptyResult.diagnostics.map((diagnostic) => diagnostic.path)).toContain('resources');
    }

    expect(missingPrimaryKeyResult.ok).toBe(false);
    if (!missingPrimaryKeyResult.ok) {
      expect(missingPrimaryKeyResult.diagnostics.map((diagnostic) => diagnostic.path)).toContain(
        'resources.posts.collection.primaryKey',
      );
    }
  });
});
