import { expect, it } from 'bun:test';

import { createGraphQlApi } from '../graphql';
import { createFlowApiOperationOwner } from './index';

it('resolves GraphQL object fields through opaque handles', () => {
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
          properties: { slug: { type: 'string' }, locale: { type: 'string' } },
          required: ['slug'],
        },
      },
    ],
  });
  if (!graph.ok) throw new Error('GraphQL fixture must be valid');
  const owner = createFlowApiOperationOwner();
  const descriptor = owner.project(graph.data, 'graphql', 'query.post');
  expect(descriptor.ok).toBe(true);
  if (!descriptor.ok) return;
  const properties = descriptor.data.input.body?.schema?.properties;
  if (properties === undefined) throw new Error('fixture must expose GraphQL variables');
  const resolved = owner.resolve(descriptor.data, {
    body: Object.fromEntries(
      Object.keys(properties).map((handle, index) => [handle, index === 0 ? 'post' : 'de-CH']),
    ),
  });
  expect(resolved).toMatchObject({ ok: true, data: { body: { slug: 'post', locale: 'de-CH' } } });
  expect(JSON.stringify(descriptor.data)).not.toContain('slug');
  expect(JSON.stringify(descriptor.data)).not.toContain('locale');
});
