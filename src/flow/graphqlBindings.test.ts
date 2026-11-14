import type { DataContractValue } from '@ankhorage/contracts/data';
import { expect, it } from 'bun:test';

import { createGraphQlApi } from '../graphql';
import { createFlowApiOperationOwner } from './index';
import type { FlowApiOperationDescriptor, FlowApiOperationOwner } from './types';

const flowHandleKey = new TextEncoder().encode('01234567890123456789012345678901');

function createOwner(): FlowApiOperationOwner {
  return createFlowApiOperationOwner({ handleKey: flowHandleKey });
}

function expectRejectedNestedBindings(
  owner: FlowApiOperationOwner,
  descriptor: FlowApiOperationDescriptor,
  slug: string,
  filter: string,
): void {
  for (const body of [
    { [slug]: 'post', unknown: 'must-not-pass' },
    { [filter]: { unknown: 'must-not-pass' } },
    { [filter]: {} },
  ]) {
    const rejected = owner.resolve(descriptor, { body });
    expect(rejected).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'unsafe-flow-projection' }],
    });
    expect(JSON.stringify(rejected)).not.toContain('must-not-pass');
  }
}

function graphApi() {
  const graph = createGraphQlApi({
    id: 'content',
    endpointUrl: 'https://api.example.test/graphql',
    introspectionEnabled: false,
    operations: [
      {
        id: 'query.post',
        kind: 'query',
        variables: {
          type: 'object',
          properties: {
            slug: { type: 'string' },
            locale: { type: 'string' },
            filter: {
              type: 'object',
              properties: { category: { type: 'string' } },
              required: ['category'],
            },
          },
          required: ['slug'],
        },
      },
    ],
  });
  if (!graph.ok) throw new Error('GraphQL fixture must be valid');
  return graph.data;
}

it('resolves GraphQL object fields through opaque handles', () => {
  const owner = createOwner();
  const descriptor = owner.project(graphApi(), 'graphql', 'query.post');
  expect(descriptor.ok).toBe(true);
  if (!descriptor.ok) return;
  const properties = descriptor.data.input.body?.schema?.properties;
  if (properties === undefined) throw new Error('fixture must expose GraphQL variables');
  const [slug, locale, filter] = Object.entries(properties);
  if (slug === undefined || locale === undefined || filter === undefined)
    throw new Error('fixture must expose GraphQL variables');
  const category = filter[1].properties;
  const categoryHandle = category === undefined ? undefined : Object.keys(category)[0];
  if (categoryHandle === undefined) throw new Error('fixture must expose nested GraphQL variables');
  const resolved = owner.resolve(descriptor.data, {
    body: {
      [slug[0]]: 'post',
      [locale[0]]: 'de-CH',
      [filter[0]]: { [categoryHandle]: 'news' },
    },
  });
  expect(resolved).toMatchObject({
    ok: true,
    data: { body: { slug: 'post', locale: 'de-CH', filter: { category: 'news' } } },
  });
  expectRejectedNestedBindings(owner, descriptor.data, slug[0], filter[0]);
  expect(JSON.stringify(descriptor.data)).not.toContain('slug');
  expect(JSON.stringify(descriptor.data)).not.toContain('locale');
});

function arrayGraphApi() {
  const graph = createGraphQlApi({
    id: 'content',
    endpointUrl: 'https://api.example.test/graphql',
    introspectionEnabled: false,
    operations: [
      {
        id: 'query.list',
        kind: 'query',
        variables: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { type: 'object', properties: { label: { type: 'string' } } },
            },
            matrix: {
              type: 'array',
              items: {
                type: 'array',
                items: { type: 'object', properties: { label: { type: 'string' } } },
              },
            },
            untyped: { type: 'array' },
          },
        },
      },
    ],
  });
  if (!graph.ok) throw new Error('GraphQL array fixture must be valid');
  return graph.data;
}

function arrayHandles(descriptor: FlowApiOperationDescriptor) {
  const properties = descriptor.input.body?.schema?.properties;
  if (properties === undefined) throw new Error('fixture must expose GraphQL variables');
  const [items, matrix, untyped] = Object.entries(properties);
  const item = requireFixtureValue(items, 'array field');
  const nested = requireFixtureValue(matrix, 'nested array field');
  const unknown = requireFixtureValue(untyped, 'untyped array field');
  const itemLabel = requireFixtureValue(
    Object.keys(item[1].items?.properties ?? {})[0],
    'item label',
  );
  const matrixLabel = requireFixtureValue(
    Object.keys(nested[1].items?.items?.properties ?? {})[0],
    'nested item label',
  );
  return { items: item, matrix: nested, untyped: unknown, itemLabel, matrixLabel };
}

function requireFixtureValue<T>(value: T | undefined, name: string): T {
  if (value === undefined) throw new Error(`fixture must expose ${name}`);
  return value;
}

function expectRejectedArrayBindings(
  owner: FlowApiOperationOwner,
  descriptor: FlowApiOperationDescriptor,
  bodies: readonly Readonly<Record<string, DataContractValue>>[],
): void {
  for (const body of bodies) {
    const rejected = owner.resolve(descriptor, { body });
    expect(rejected).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'unsafe-flow-projection' }],
    });
    expect(JSON.stringify(rejected)).not.toContain('must-not-pass');
  }
}

it('fails closed for untyped arrays and rehydrates every typed nested object handle', () => {
  const owner = createOwner();
  const descriptor = owner.project(arrayGraphApi(), 'graphql', 'query.list');
  expect(descriptor.ok).toBe(true);
  if (!descriptor.ok) return;
  const { items, matrix, untyped, itemLabel, matrixLabel } = arrayHandles(descriptor.data);

  expect(
    owner.resolve(descriptor.data, {
      body: {
        [items[0]]: [{ [itemLabel]: 'first' }],
        [matrix[0]]: [[{ [matrixLabel]: 'second' }]],
      },
    }),
  ).toMatchObject({
    ok: true,
    data: { body: { items: [{ label: 'first' }], matrix: [[{ label: 'second' }]] } },
  });
  expectRejectedArrayBindings(owner, descriptor.data, [
    { [items[0]]: [{ raw: 'must-not-pass' }] },
    { [matrix[0]]: [[{ raw: 'must-not-pass' }]] },
    { [untyped[0]]: [{ raw: 'must-not-pass' }] },
  ]);
});
