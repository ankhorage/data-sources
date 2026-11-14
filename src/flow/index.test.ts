import type { ApiDefinition } from '@ankhorage/contracts/data';
import { expect, it } from 'bun:test';

import { createGraphQlApi } from '../graphql';
import { importOpenApiDocument } from '../openapi';
import { createManualRestApi, type ManualRestOperationDefinition } from '../rest';
import { createFlowApiOperationDescriptorId, projectFlowApiOperation } from './index';

const secret = 'do-not-persist';

function restApi(operation: Partial<ManualRestOperationDefinition> = {}): ApiDefinition {
  const result = createManualRestApi({
    id: 'commerce/api',
    baseUrl: `https://api.example.test?token=${secret}`,
    credential: { id: 'credential-secret', kind: 'oauth2', label: secret, scope: secret },
    endpoints: [
      {
        id: 'orders',
        path: '/orders/{orderId}',
        operations: [
          {
            id: 'orders.get',
            intent: 'read',
            method: 'GET',
            parameters: [
              {
                name: 'orderId',
                location: 'path',
                required: true,
                schema: { type: 'string' },
              },
              { name: 'page', location: 'query', schema: { type: 'integer' } },
            ],
            request: { schema: { type: 'object', properties: { filter: { type: 'string' } } } },
            response: {
              status: 200,
              contentType: 'application/json',
              schema: { type: 'array', items: { type: 'object' } },
            },
            pagination: { kind: 'page', pageParameter: 'page', pageSizeParameter: 'limit' },
            ...operation,
          },
        ],
      },
    ],
  });
  if (!result.ok) throw new Error('test fixture must be valid');
  return result.data;
}

it('projects REST operations as stable, typed, secret-free Flow descriptors', () => {
  const result = projectFlowApiOperation(restApi(), 'orders', 'orders.get');

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.data).toMatchObject({
    id: 'data-sources.api/commerce%2Fapi/orders/orders.get',
    capability: {
      providerId: '@ankhorage/data-sources',
      capabilityId: 'data-sources.api/commerce%2Fapi/orders/orders.get',
    },
    source: { apiId: 'commerce/api', endpointId: 'orders', operationId: 'orders.get' },
    endpoint: { kind: 'http', path: '/orders/{orderId}' },
    input: {
      parameters: [
        { name: 'orderId', location: 'path', schema: { type: 'string' } },
        { name: 'page', location: 'query', schema: { type: 'integer' } },
      ],
    },
    result: { artifact: { kind: 'artifact', mediaType: 'application/json' } },
    pagination: { kind: 'page', pageParameter: 'page', pageSizeParameter: 'limit' },
    rateLimit: { kind: 'unknown' },
    auth: { required: true, kind: 'oauth2' },
  });
  expect(JSON.stringify(result.data)).not.toContain(secret);
  expect(JSON.stringify(result.data)).not.toContain('credential-secret');
});

it('projects GraphQL and OpenAPI discoveries without exposing documents or server URLs', () => {
  const graphql = createGraphQlApi({
    id: 'content',
    endpointUrl: 'https://api.example.test/graphql?token=hidden',
    introspectionEnabled: false,
    operations: [
      {
        id: 'query.post',
        kind: 'query',
        document: `query Post { post(token: "${secret}") { id } }`,
        variables: { type: 'object', properties: { slug: { type: 'string' } } },
        response: { type: 'object', properties: { id: { type: 'string' } } },
      },
    ],
  });
  const openApi = importOpenApiDocument({
    id: 'pets',
    document: {
      openapi: '3.1.0',
      servers: [{ url: 'https://api.example.test?api_key=hidden' }],
      paths: {
        '/pets': {
          get: { operationId: 'listPets', responses: { '200': { description: 'ok' } } },
        },
      },
    },
  });

  expect(graphql.ok).toBe(true);
  expect(openApi.ok).toBe(true);
  if (!graphql.ok || !openApi.ok) return;
  const graphDescriptor = projectFlowApiOperation(graphql.data, 'graphql', 'query.post');
  const openApiDescriptor = projectFlowApiOperation(openApi.data, 'pets', 'listpets');

  expect(graphDescriptor.ok).toBe(true);
  expect(openApiDescriptor.ok).toBe(true);
  if (!graphDescriptor.ok || !openApiDescriptor.ok) return;
  expect(graphDescriptor.data.endpoint).toEqual({ kind: 'graphql' });
  expect(JSON.stringify(graphDescriptor.data)).not.toContain(secret);
  expect(JSON.stringify(openApiDescriptor.data)).not.toContain('api_key=hidden');
});

it('fails closed for missing operations and secret-prone parameters or nested schemas', () => {
  const missing = projectFlowApiOperation(restApi(), 'orders', 'missing');
  const header = projectFlowApiOperation(
    restApi({
      parameters: [
        { name: 'orderId', location: 'path' },
        { name: 'x-api-key', location: 'header' },
      ],
    }),
    'orders',
    'orders.get',
  );
  const query = projectFlowApiOperation(
    restApi({
      parameters: [
        { name: 'orderId', location: 'path' },
        { name: 'access_token', location: 'query' },
      ],
    }),
    'orders',
    'orders.get',
  );
  const nested = projectFlowApiOperation(
    restApi({
      request: { schema: { type: 'object', properties: { password: { type: 'string' } } } },
    }),
    'orders',
    'orders.get',
  );
  const defaultValue = projectFlowApiOperation(
    restApi({
      request: { schema: { type: 'object', properties: { value: { default: secret } } } },
    }),
    'orders',
    'orders.get',
  );

  for (const result of [missing, header, query, nested, defaultValue]) {
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics[0]?.code).toBe('unsafe-flow-projection');
      expect(result.diagnostics[0]?.apiId).toBe('commerce/api');
    }
  }
});

it('is reproducibly serializable and ignores unknown runtime fields instead of copying them', () => {
  const api = restApi() as ApiDefinition & { metadata: { unsafe: () => string } };
  const first = projectFlowApiOperation(api, 'orders', 'orders.get');
  const second = projectFlowApiOperation(api, 'orders', 'orders.get');

  expect(first.ok).toBe(true);
  expect(second.ok).toBe(true);
  if (!first.ok || !second.ok) return;
  expect(JSON.stringify(first.data)).toBe(JSON.stringify(second.data));
  expect(JSON.stringify(first.data)).not.toContain('unsafe');
  expect(createFlowApiOperationDescriptorId('commerce/api', 'orders', 'orders.get')).toBe(
    first.data.id,
  );
});
