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

  it('imports OpenAPI as a canonical external REST API', () => {
    const result = importOpenApiDocument({
      id: 'pet-store',
      document: document(),
      documentUrl: 'https://api.example.com/openapi.json',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({ origin: 'external', protocol: 'rest' });
      expect('kind' in result.data).toBe(false);
      expect(result.data.openApi?.version).toBe('2026-08-06');
      expect(result.data.endpoints.pets?.baseUrl).toBeUndefined();
      expect(result.data.endpoints.pets?.operations.listpets?.intent).toBe('read');
      expect(result.data.endpoints.pets?.operations.createpet?.intent).toBe('create');
    }
  });
});

describe('OpenAPI import diagnostics', () => {
  it('uses an explicit base URL with ambiguous servers', () => {
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
    const noServer = importOpenApiDocument({
      id: 'no-server',
      document: { openapi: '3.1.0', paths: { '/x': { get: {} } } },
    });
    const noPaths = importOpenApiDocument({
      id: 'no-paths',
      baseUrl: 'https://example.com',
      document: { openapi: '3.1.0' },
    });
    expect(noServer.ok).toBe(false);
    if (!noServer.ok) expect(noServer.diagnostics[0]?.apiId).toBe('no-server');
    expect(noPaths.ok).toBe(false);
    if (!noPaths.ok) expect(noPaths.diagnostics[0]?.apiId).toBe('no-paths');
  });
});
