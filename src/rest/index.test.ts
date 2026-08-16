import { describe, expect, it } from 'bun:test';

import {
  createManualRestApi,
  extractRestPathParams,
  isManualRestMethod,
  type ManualRestApiDefinition,
  normalizeManualRestApi,
  normalizeManualRestMethod,
} from './index';

function definition(): ManualRestApiDefinition {
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

describe('manual REST API normalization', () => {
  it('normalizes methods and path parameters', () => {
    expect(normalizeManualRestMethod('get')).toBe('GET');
    expect(isManualRestMethod('GET')).toBe(true);
    expect(isManualRestMethod('TRACE')).toBe(false);
    expect(extractRestPathParams('/posts/{postId}/comments/:commentId')).toEqual([
      'postId',
      'commentId',
    ]);
  });

  it('creates a canonical external REST API', () => {
    const api = normalizeManualRestApi(definition());
    expect(api).toMatchObject({ origin: 'external', protocol: 'rest' });
    expect('kind' in api).toBe(false);
    expect(api.endpoints.posts?.baseUrl).toBeUndefined();
    expect(api.endpoints.posts?.operations['posts.get']?.method).toBe('GET');
    expect(api.endpoints.posts?.operations['posts.create']?.intent).toBe('create');
  });

  it('returns canonical diagnostics with API identity', () => {
    const valid = createManualRestApi(definition());
    const invalid = createManualRestApi({ ...definition(), baseUrl: ' ' });
    expect(valid.ok).toBe(true);
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.diagnostics[0]?.apiId).toBe('blog-api');
  });

  it('reports unsupported methods and missing path parameters', () => {
    const broken = definition();
    const result = createManualRestApi({
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
