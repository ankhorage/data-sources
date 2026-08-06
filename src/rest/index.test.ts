import { describe, expect, it } from 'bun:test';

import {
  createManualRestDataSource,
  extractRestPathParams,
  isManualRestMethod,
  type ManualRestDataSourceDefinition,
  normalizeManualRestDataSource,
  normalizeManualRestMethod,
} from './index';

function definition(): ManualRestDataSourceDefinition {
  return {
    id: 'blog-api',
    baseUrl: 'https://api.example.com',
    endpoints: [
      {
        id: 'posts',
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
          },
          { id: 'posts.create', method: 'POST', intent: 'create', path: '/posts' },
        ],
      },
    ],
  };
}

describe('manual REST normalization', () => {
  it('normalizes methods and path parameters', () => {
    expect(normalizeManualRestMethod('get')).toBe('GET');
    expect(isManualRestMethod('GET')).toBe(true);
    expect(isManualRestMethod('TRACE')).toBe(false);
    expect(extractRestPathParams('/posts/{postId}/comments/:commentId')).toEqual([
      'postId',
      'commentId',
    ]);
  });

  it('creates an external REST API source', () => {
    const source = normalizeManualRestDataSource(definition());
    expect(source).toMatchObject({ kind: 'api', origin: 'external', protocol: 'rest' });
    expect(source.endpoints.posts?.operations['posts.get']?.method).toBe('GET');
    expect(source.endpoints.posts?.operations['posts.create']?.intent).toBe('create');
  });

  it('returns canonical diagnostic results', () => {
    const valid = createManualRestDataSource(definition());
    const invalid = createManualRestDataSource({ ...definition(), baseUrl: ' ' });
    expect(valid.ok).toBe(true);
    expect(invalid.ok).toBe(false);
  });

  it('reports unsupported methods and missing path parameters', () => {
    const broken = definition();
    const result = createManualRestDataSource({
      ...broken,
      endpoints: [
        {
          id: 'broken',
          path: '/broken/{id}',
          operations: [{ id: 'broken.trace', method: 'TRACE', intent: 'read' }],
        },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
        'invalid-config',
        'invalid-config',
      ]);
    }
  });
});
