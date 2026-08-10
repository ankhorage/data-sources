import type { GeneratedApiDefinition } from '@ankhorage/contracts/data';
import { describe, expect, it } from 'bun:test';

import { validateGeneratedApiDefinition } from './index';

function createDefinition(): GeneratedApiDefinition {
  return {
    id: 'posts-api',
    protocol: 'rest',
    basePath: '/api',
    database: { id: 'primary-db', kind: 'database' },
    resources: [
      {
        id: 'posts',
        path: '/posts',
        operations: ['list', 'read'],
        collection: {
          name: 'posts',
          primaryKey: 'id',
          fields: [
            { name: 'id', type: 'uuid', required: true, unique: true },
            { name: 'title', type: 'text' },
          ],
        },
      },
    ],
  };
}

function diagnosticPaths(definition: GeneratedApiDefinition): readonly string[] {
  return validateGeneratedApiDefinition(definition).map((diagnostic) => diagnostic.path ?? '');
}

describe('generated API collection validation', () => {
  it('rejects resources without fields', () => {
    const definition = createDefinition();
    const [resource] = definition.resources;
    if (!resource) throw new Error('Expected resource fixture.');

    const paths = diagnosticPaths({
      ...definition,
      resources: [{ ...resource, collection: { ...resource.collection, fields: [] } }],
    });

    expect(paths).toContain('resources.posts.collection.fields');
  });

  it('rejects empty and duplicate field names', () => {
    const definition = createDefinition();
    const [resource] = definition.resources;
    if (!resource) throw new Error('Expected resource fixture.');

    const paths = diagnosticPaths({
      ...definition,
      resources: [
        {
          ...resource,
          collection: {
            ...resource.collection,
            fields: [
              { name: '', type: 'text' },
              { name: 'title', type: 'text' },
              { name: 'title', type: 'text' },
            ],
          },
        },
      ],
    });

    expect(paths).toContain('resources.posts.collection.fields.0.name');
    expect(paths).toContain('resources.posts.collection.fields.2.name');
  });

  it('rejects primary keys that do not reference a field', () => {
    const definition = createDefinition();
    const [resource] = definition.resources;
    if (!resource) throw new Error('Expected resource fixture.');

    const paths = diagnosticPaths({
      ...definition,
      resources: [
        {
          ...resource,
          collection: { ...resource.collection, primaryKey: 'missing' },
        },
      ],
    });

    expect(paths).toContain('resources.posts.collection.primaryKey');
  });
});
