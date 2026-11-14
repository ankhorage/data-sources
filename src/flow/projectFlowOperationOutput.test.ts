import type {
  DataContractValue,
  DataSchema,
  DataSourceDiagnosticResult,
} from '@ankhorage/contracts/data';
import { expect, it } from 'bun:test';

import { createGraphQlApi } from '../graphql';
import { createManualRestApi } from '../rest';
import { createFlowApiOperationOwner } from './index';
import type { FlowApiOperationDescriptor } from './types';

const flowHandleKey = new TextEncoder().encode('01234567890123456789012345678901');

function createOwner() {
  return createFlowApiOperationOwner({ handleKey: flowHandleKey });
}

function responseProperties(
  descriptor: FlowApiOperationDescriptor,
): readonly [string, DataSchema][] {
  const properties = descriptor.result.response?.schema?.properties;
  if (properties === undefined) throw new Error('fixture must expose a response schema');
  return Object.entries(properties);
}

function responseField(
  fields: readonly [string, DataSchema][],
  index: number,
  message: string,
): [string, DataSchema] {
  const field = fields.at(index);
  if (field === undefined) throw new Error(message);
  return field;
}

function resultRecord(
  result: DataSourceDiagnosticResult<DataContractValue>,
): Record<string, DataContractValue> {
  if (
    !result.ok ||
    typeof result.data !== 'object' ||
    result.data === null ||
    Array.isArray(result.data)
  )
    throw new Error('fixture response must project as an object');
  return result.data;
}

function restResponseSchema(): DataSchema {
  return {
    type: 'object',
    properties: {
      id: { type: 'string' },
      count: { type: 'integer' },
      detail: { type: 'object', properties: { id: { type: 'boolean' } } },
      items: {
        type: 'array',
        items: { type: 'object', properties: { price: { type: 'number' } } },
      },
    },
    required: ['id', 'count'],
  };
}

it('projects and owner-maps every opaque REST response field without source identities', () => {
  const api = createManualRestApi({
    id: 'commerce',
    baseUrl: 'https://api.example.test',
    endpoints: [
      {
        id: 'orders',
        path: '/orders',
        operations: [
          {
            id: 'orders.get',
            intent: 'read',
            method: 'GET',
            response: { schema: restResponseSchema() },
          },
        ],
      },
    ],
  });
  expect(api.ok).toBe(true);
  if (!api.ok) return;
  const owner = createOwner();
  const descriptor = owner.project(api.data, 'orders', 'orders.get');
  expect(descriptor.ok).toBe(true);
  if (!descriptor.ok) return;
  const fields = responseProperties(descriptor.data);
  const id = responseField(fields, 0, 'fixture must expose id');
  const count = responseField(fields, 1, 'fixture must expose count');
  const detail = responseField(fields, 2, 'fixture must expose detail');
  const items = responseField(fields, 3, 'fixture must expose items');
  expect(new Set([id[0], count[0], detail[0], items[0]]).size).toBe(4);
  expect(id[1]).toMatchObject({ type: 'string' });
  expect(count[1]).toMatchObject({ type: 'integer' });
  expect(Object.values(detail[1].properties ?? {})).toEqual([{ type: 'boolean' }]);
  expect(Object.values(items[1].items?.properties ?? {})).toEqual([{ type: 'number' }]);
  expect(descriptor.data.result.response?.schema?.required).toEqual([id[0], count[0]]);
  expect(Object.keys(descriptor.data.result.response?.schema?.properties ?? {})).not.toContain(
    'id',
  );
  expect(Object.keys(detail[1].properties ?? {})).not.toContain('id');
  const projected = resultRecord(owner.projectResult(descriptor.data, restResult()));
  expect(Object.keys(projected)).toEqual([id[0], count[0], detail[0], items[0]]);
  expect(Object.values(projected)).toContain('order-7');
  expect(Object.values(projected)).toContain(2);
  expect(JSON.stringify(projected)).not.toContain('"id"');
});

it('rejects invalid provider output values without leaking provider secrets', () => {
  const api = createManualRestApi({
    id: 'commerce',
    baseUrl: 'https://api.example.test',
    endpoints: [
      {
        id: 'orders',
        path: '/orders',
        operations: [
          {
            id: 'orders.get',
            intent: 'read',
            method: 'GET',
            response: { schema: restResponseSchema() },
          },
        ],
      },
    ],
  });
  expect(api.ok).toBe(true);
  if (!api.ok) return;
  const owner = createOwner();
  const descriptor = owner.project(api.data, 'orders', 'orders.get');
  expect(descriptor.ok).toBe(true);
  if (!descriptor.ok) return;
  const sentinel = 'provider-output-sentinel-secret';
  const invalidValues: readonly DataContractValue[] = [
    { id: 42, count: 2 },
    { id: sentinel, count: 'wrong-integer' },
    { id: { value: sentinel }, count: 2 },
    { id: sentinel, count: 2, detail: { id: 'wrong-boolean' } },
    { id: sentinel, count: 2, items: [{ price: 'wrong-number' }] },
    { count: 2 },
    { id: null, count: 2 },
  ];

  for (const value of invalidValues) {
    const result = owner.projectResult(descriptor.data, value);
    expect(result).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'unsafe-flow-projection' }],
    });
    expect(JSON.stringify(result)).not.toContain(sentinel);
  }
});

function restResult() {
  return { id: 'order-7', count: 2, detail: { id: true }, items: [{ price: 19.5 }] };
}

it('projects and owner-maps opaque GraphQL response fields with independent nested shapes', () => {
  const graph = createGraphQlApi({
    id: 'content',
    endpointUrl: 'https://api.example.test/graphql',
    introspectionEnabled: false,
    operations: [{ id: 'query.posts', kind: 'query', response: graphResponseSchema() }],
  });
  expect(graph.ok).toBe(true);
  if (!graph.ok) return;
  const owner = createOwner();
  const descriptor = owner.project(graph.data, 'graphql', 'query.posts');
  expect(descriptor.ok).toBe(true);
  if (!descriptor.ok) return;
  const fields = responseProperties(descriptor.data);
  const total = responseField(fields, 0, 'fixture must expose total');
  const featured = responseField(fields, 1, 'fixture must expose featured');
  const post = responseField(fields, 2, 'fixture must expose post');
  const scores = responseField(fields, 3, 'fixture must expose scores');
  expect(new Set([total[0], featured[0], post[0], scores[0]]).size).toBe(4);
  expect(total[1]).toMatchObject({ type: 'integer' });
  expect(featured[1]).toMatchObject({ type: 'boolean' });
  expect(Object.values(post[1].properties ?? {})).toEqual([{ type: 'string' }]);
  expect(scores[1].items).toMatchObject({ type: 'number' });
  expect(descriptor.data.result.response?.schema?.required).toEqual([total[0], post[0]]);
  expect(JSON.stringify(descriptor.data)).not.toContain('"total"');
  expect(JSON.stringify(descriptor.data.result.response?.schema)).not.toContain('title');
  const projected = resultRecord(owner.projectResult(descriptor.data, graphResult()));
  expect(Object.keys(projected)).toEqual([total[0], featured[0], post[0], scores[0]]);
  expect(Object.values(projected)).toContain(3);
  expect(Object.values(projected)).toContain(true);
  expect(JSON.stringify(projected)).not.toContain('title');
});

function graphResponseSchema(): DataSchema {
  return {
    type: 'object',
    properties: {
      total: { type: 'integer' },
      featured: { type: 'boolean' },
      post: { type: 'object', properties: { title: { type: 'string' } } },
      scores: { type: 'array', items: { type: 'number' } },
    },
    required: ['total', 'post'],
  };
}

function graphResult() {
  return { total: 3, featured: true, post: { title: 'First' }, scores: [1.5, 2.5] };
}
