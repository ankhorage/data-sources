import { expect, it } from 'bun:test';

import { createGraphQlApi } from '../graphql';
import { createFlowApiOperationOwner } from './index';
import type { FlowApiOperationDescriptor, FlowApiOperationOwner } from './types';

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
  const owner = createFlowApiOperationOwner();
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
