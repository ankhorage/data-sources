import { describe, expect, it } from 'bun:test';

import {
  importOpenApiDocument,
  normalizeOpenApiEndpointId,
  normalizeOpenApiOperationId,
  normalizeOpenApiSchema,
  type OpenApiDocumentObject,
} from './index';

function assertSerializable<TValue>(value: TValue): void {
  expect(JSON.parse(JSON.stringify(value))).toEqual(value);
}

function createPetStoreDocument(): OpenApiDocumentObject {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Pet Store',
      version: '2026-05-19',
      description: 'Example API.',
    },
    servers: [
      {
        url: 'https://api.example.com',
      },
    ],
    components: {
      schemas: {
        Pet: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            age: { type: 'integer' },
          },
        },
      },
    },
    paths: {
      '/pets': {
        get: {
          operationId: 'listPets',
          summary: 'List pets',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 },
            },
          ],
          responses: {
            '200': {
              description: 'Pets',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Pet' },
                  },
                },
              },
            },
          },
        },
        post: {
          operationId: 'createPet',
          summary: 'Create pet',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Pet' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Created pet',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Pet' },
                },
              },
            },
          },
        },
      },
      '/pets/{petId}': {
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        get: {
          operationId: 'getPet',
          responses: {
            '200': {
              description: 'Pet',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Pet' },
                },
              },
            },
          },
        },
        patch: {
          operationId: 'updatePet',
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Pet' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Updated pet',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Pet' },
                },
              },
            },
          },
        },
        delete: {
          operationId: 'deletePet',
          responses: {
            '204': {
              description: 'Deleted pet',
            },
          },
        },
      },
    },
  };
}

describe('OpenAPI import normalization', () => {
  it('normalizes deterministic endpoint and operation ids', () => {
    expect(normalizeOpenApiEndpointId('/pets/{petId}')).toBe('pets-petid');
    expect(normalizeOpenApiOperationId('get', '/pets/{petId}')).toBe('get-pets-petid');
    expect(normalizeOpenApiOperationId('get', '/', '')).toBe('get-root');
  });

  it('normalizes OpenAPI schemas into data schemas', () => {
    const schema = normalizeOpenApiSchema({
      type: 'object',
      properties: {
        id: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['id'],
    });

    assertSerializable(schema);
    expect(schema.type).toBe('object');
    expect(schema.properties?.tags?.items?.type).toBe('string');
  });

  it('imports a minimal OpenAPI document into a normalized OpenAPI data source', () => {
    const result = importOpenApiDocument({
      id: 'pet-store',
      document: createPetStoreDocument(),
      documentUrl: 'https://api.example.com/openapi.json',
      credential: {
        id: 'pet-store-token',
        kind: 'bearer',
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      assertSerializable(result.data);
      expect(result.data.kind).toBe('openapi');
      expect(result.data.baseUrl).toBe('https://api.example.com');
      expect(result.data.import?.version).toBe('2026-05-19');
      expect(result.data.schemas?.Pet?.properties?.name?.type).toBe('string');
      expect(result.data.endpoints.pets?.operations.listpets?.intent).toBe('read');
      expect(result.data.endpoints.pets?.operations.createpet?.intent).toBe('create');
      expect(
        result.data.endpoints['pets-petid']?.operations.getpet?.request?.parameters?.[0]?.name,
      ).toBe('petId');
      expect(result.data.endpoints['pets-petid']?.operations.updatepet?.intent).toBe('update');
      expect(result.data.endpoints['pets-petid']?.operations.deletepet?.intent).toBe('delete');
    }
  });

  it('uses an explicit baseUrl override and reports ambiguous servers', () => {
    const document: OpenApiDocumentObject = {
      ...createPetStoreDocument(),
      servers: [{ url: 'https://first.example.com' }, { url: 'https://second.example.com' }],
    };
    const result = importOpenApiDocument({
      id: 'pet-store',
      document,
      baseUrl: 'https://override.example.com',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.baseUrl).toBe('https://override.example.com');
      expect(result.diagnostics).toEqual([]);
    }
  });

  it('reports ambiguous server diagnostics when no baseUrl override exists', () => {
    const document: OpenApiDocumentObject = {
      ...createPetStoreDocument(),
      servers: [{ url: 'https://first.example.com' }, { url: 'https://second.example.com' }],
    };
    const result = importOpenApiDocument({ id: 'pet-store', document });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.baseUrl).toBe('https://first.example.com');
      expect(result.diagnostics?.map((diagnostic) => diagnostic.code)).toContain(
        'ambiguous-server',
      );
    }
  });

  it('deduplicates duplicate operation IDs deterministically', () => {
    const document: OpenApiDocumentObject = {
      openapi: '3.1.0',
      paths: {
        '/one': {
          get: { operationId: 'duplicate', responses: { '200': { description: 'OK' } } },
        },
        '/two': {
          get: { operationId: 'duplicate', responses: { '200': { description: 'OK' } } },
        },
      },
    };
    const result = importOpenApiDocument({
      id: 'duplicates',
      document,
      baseUrl: 'https://api.example.com',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.endpoints.one?.operations.duplicate?.id).toBe('duplicate');
      expect(result.data.endpoints.two?.operations['duplicate-2']?.id).toBe('duplicate-2');
      expect(result.diagnostics?.map((diagnostic) => diagnostic.code)).toContain(
        'duplicate-operation-id',
      );
    }
  });

  it('returns an error diagnostic when paths are missing', () => {
    const result = importOpenApiDocument({
      id: 'empty',
      document: { openapi: '3.1.0' },
      baseUrl: 'https://api.example.com',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain('invalid-config');
    }
  });

  it('reports unsupported schema types as warnings', () => {
    const result = importOpenApiDocument({
      id: 'unsupported-schema',
      baseUrl: 'https://api.example.com',
      document: {
        openapi: '3.1.0',
        components: {
          schemas: {
            Weird: { type: 'file' },
          },
        },
        paths: {
          '/weird': {
            get: { responses: { '200': { description: 'OK' } } },
          },
        },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.diagnostics?.map((diagnostic) => diagnostic.code)).toContain(
        'unsupported-schema',
      );
    }
  });
});
