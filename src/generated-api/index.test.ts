import type { GeneratedApiDefinition } from '@ankhorage/contracts/data';
import { describe, expect, it } from 'bun:test';

import {
  createGeneratedApiDataSource,
  createGeneratedApiOperationId,
  createGeneratedApiResourceSchema,
  normalizeGeneratedApiDataSource,
} from './index';

function assertSerializable<TValue>(value: TValue): void {
  expect(JSON.parse(JSON.stringify(value))).toEqual(value);
}

function createPostsApiDefinition(): GeneratedApiDefinition {
  return {
    id: 'posts-api',
    protocol: 'rest',
    name: 'Posts API',
    basePath: '/api',
    database: {
      id: 'primary-db',
      kind: 'database',
      packageName: '@ankhorage/supabase-db',
    },
    resources: [
      {
        id: 'posts',
        name: 'Posts',
        path: '/posts',
        operations: ['list', 'read', 'create', 'update', 'delete'],
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
        seed: [{ id: 'seed-1', title: 'Hello' }],
        policies: [{ id: 'posts-policy' }],
      },
    ],
  };
}

describe('generated API normalization', () => {
  it('generates deterministic operation IDs', () => {
    expect(createGeneratedApiOperationId('posts', 'list')).toBe('posts.list');
    expect(createGeneratedApiOperationId('posts', 'delete')).toBe('posts.delete');
  });

  it('generates a serializable resource schema from a DB collection', () => {
    const [resource] = createPostsApiDefinition().resources;
    expect(resource).toBeDefined();
    if (resource === undefined) return;

    const schema = createGeneratedApiResourceSchema(resource.collection);
    assertSerializable(schema);
    expect(schema.type).toBe('object');
    expect(schema.properties?.id?.format).toBe('uuid');
    expect(schema.properties?.createdAt?.format).toBe('date-time');
    expect(schema.properties?.metadata?.type).toBe('object');
    expect(schema.required).toEqual(['id', 'title']);
  });

  it('normalizes generated REST desired state into canonical API operations', () => {
    const source = normalizeGeneratedApiDataSource(createPostsApiDefinition());

    assertSerializable(source);
    expect(source.kind).toBe('api');
    expect(source.origin).toBe('generated');
    expect(source.protocol).toBe('rest');
    expect(source.generatedApiId).toBe('posts-api');
    expect(source.adapter.id).toBe('primary-db');
    expect(source.endpoints.posts?.kind).toBe('database');
    expect(source.endpoints.posts?.path).toBe('/posts');
    expect(source.endpoints.posts?.operations['posts.list']?.intent).toBe('read');
    expect(source.endpoints.posts?.operations['posts.create']?.intent).toBe('create');
    expect(source.endpoints.posts?.operations['posts.update']?.intent).toBe('update');
    expect(source.endpoints.posts?.operations['posts.delete']?.intent).toBe('delete');
    expect(source.endpoints.posts?.operations['posts.read']?.request?.parameters?.[0]?.name).toBe(
      'id',
    );
  });

  it('creates a diagnostic result for valid generated APIs', () => {
    const result = createGeneratedApiDataSource(createPostsApiDefinition());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.endpoints.posts?.operations['posts.list']).toBeDefined();
      expect(result.diagnostics).toEqual([]);
    }
  });

  it('supports multiple generated APIs backed by different database adapters', () => {
    const postsApi = normalizeGeneratedApiDataSource(createPostsApiDefinition());
    const analyticsApi = normalizeGeneratedApiDataSource({
      id: 'analytics-api',
      protocol: 'rest',
      basePath: '/analytics',
      database: {
        id: 'analytics-db',
        kind: 'database',
        packageName: '@ankhorage/postgres-db',
      },
      resources: [
        {
          id: 'events',
          path: '/events',
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
    expect(postsApi.adapter.id).toBe('primary-db');
    expect(analyticsApi.adapter.id).toBe('analytics-db');
    expect(analyticsApi.endpoints.events?.operations['events.list']?.intent).toBe('read');
    expect(analyticsApi.endpoints.events?.operations['events.read']).toBeUndefined();
  });

  it('reports missing resources, invalid paths and missing primary keys', () => {
    const emptyResult = createGeneratedApiDataSource({
      id: 'empty-api',
      protocol: 'rest',
      basePath: 'api',
      database: { id: 'db', kind: 'database' },
      resources: [],
    });
    const missingPrimaryKeyResult = createGeneratedApiDataSource({
      id: 'broken-api',
      protocol: 'rest',
      basePath: '/api',
      database: { id: 'db', kind: 'database' },
      resources: [
        {
          id: 'posts',
          path: 'posts',
          operations: ['read'],
          collection: {
            name: 'posts',
            fields: [{ name: 'title', type: 'text' }],
          },
        },
      ],
    });

    expect(emptyResult.ok).toBe(false);
    expect(missingPrimaryKeyResult.ok).toBe(false);
    if (!missingPrimaryKeyResult.ok) {
      expect(missingPrimaryKeyResult.diagnostics.map((diagnostic) => diagnostic.path)).toContain(
        'resources.posts.collection.primaryKey',
      );
      expect(missingPrimaryKeyResult.diagnostics.map((diagnostic) => diagnostic.path)).toContain(
        'resources.posts.path',
      );
    }
  });
});
