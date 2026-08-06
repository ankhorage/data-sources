import { describe, expect, it } from 'bun:test';

import {
  importOpenApiDocument,
  normalizeOpenApiEndpointId,
  normalizeOpenApiOperationId,
  normalizeOpenApiSchema,
  type OpenApiDocumentObject,
} from './index';

function document(): OpenApiDocumentObject {
  return {
    openapi: '3.1.0',
    info: { title: 'Pet Store', version: '2026-08-06' },
    servers: [{ url: 'https://api.example.com' }],
    components: {
      schemas: {
        Pet: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' }, name: { type: 'string' } },
        },
      },
    },
    paths: {
      '/pets': {
        get: { operationId: 'listPets', responses: { '200': { description: 'Pets' } } },
        post: { operationId: 'createPet', responses: { '201': { description: 'Pet' } } },
      },
    },
  };
}

describe('OpenAPI normalization', () => {
  it('normalizes endpoint, operation and schema shapes', () => {
    expect(normalizeOpenApiEndpointId('/pets/{petId}')).toBe('pets-petid');
    expect(normalizeOpenApiOperationId('get', '/pets/{petId}')).toBe('get-pets-petid');
    expect(normalizeOpenApiSchema({ type: 'array', items: { type: 'string' } }).items?.type).toBe(
      'string',
    );
  });

  it('imports OpenAPI as an external REST source with OpenAPI metadata', () => {
    const result = importOpenApiDocument({
      id: 'pet-store',
      document: document(),
      documentUrl: 'https://api.example.com/openapi.json',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({ kind: 'api', origin: 'external', protocol: 'rest' });
      expect(result.data.openApi?.version).toBe('2026-08-06');
      expect(result.data.endpoints.pets?.operations.listpets?.intent).toBe('read');
      expect(result.data.endpoints.pets?.operations.createpet?.intent).toBe('create');
    }
  });

  it('uses an explicit base URL and reports ambiguous servers', () => {
    const result = importOpenApiDocument({
      id: 'pet-store',
      document: {
        ...document(),
        servers: [{ url: 'https://one.example.com' }, { url: 'https://two.example.com' }],
      },
      baseUrl: 'https://override.example.com',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.baseUrl).toBe('https://override.example.com');
  });

  it('requires a resolvable base URL and paths', () => {
    expect(
      importOpenApiDocument({
        id: 'no-server',
        document: { openapi: '3.1.0', paths: { '/x': { get: {} } } },
      }).ok,
    ).toBe(false);
    expect(
      importOpenApiDocument({
        id: 'no-paths',
        baseUrl: 'https://example.com',
        document: { openapi: '3.1.0' },
      }).ok,
    ).toBe(false);
  });
});
