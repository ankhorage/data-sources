import type { ApiDefinition } from '@ankhorage/contracts/data';
import { expect, it } from 'bun:test';

import { createManualRestApi } from '../rest';
import { createFlowApiOperationOwner } from './index';
import type { FlowApiOperationDescriptor } from './types';

function deserializeFlowDescriptor(value: FlowApiOperationDescriptor): FlowApiOperationDescriptor {
  const persisted: unknown = JSON.parse(JSON.stringify(value));
  if (!isFlowDescriptorHandle(persisted))
    throw new Error('serialized descriptor must retain its handle');
  return persisted;
}

function isFlowDescriptorHandle(value: unknown): value is FlowApiOperationDescriptor {
  if (typeof value !== 'object' || value === null || !('id' in value) || !('source' in value))
    return false;
  const { id, source } = value;
  return (
    typeof id === 'string' &&
    typeof source === 'object' &&
    source !== null &&
    'handle' in source &&
    typeof source.handle === 'string'
  );
}

function twoOperationApi(revision = 'v1'): ApiDefinition {
  const result = createManualRestApi({
    id: 'commerce/api',
    baseUrl: 'https://api.example.test',
    endpoints: [
      {
        id: 'orders',
        path: '/orders',
        operations: [
          {
            id: 'orders.list',
            intent: 'read',
            method: 'GET',
            request: { schema: { type: 'object', properties: { [revision]: { type: 'string' } } } },
          },
          {
            id: 'orders.create',
            intent: 'create',
            method: 'POST',
            request: { schema: { type: 'object', properties: { [revision]: { type: 'string' } } } },
          },
        ],
      },
    ],
  });
  if (!result.ok) throw new Error('test fixture must be valid');
  return result.data;
}

it('resolves a persisted descriptor after owner restart and reordered discovery', () => {
  const api = twoOperationApi();
  const firstOwner = createFlowApiOperationOwner();
  const persisted = firstOwner.project(api, 'orders', 'orders.list');
  const other = firstOwner.project(api, 'orders', 'orders.create');
  expect(persisted.ok).toBe(true);
  expect(other.ok).toBe(true);
  if (!persisted.ok || !other.ok) return;

  const serialized = deserializeFlowDescriptor(persisted.data);
  expect(serialized).toEqual(persisted.data);
  const restartedOwner = createFlowApiOperationOwner();
  const reconstructedOther = restartedOwner.project(api, 'orders', 'orders.create');
  const reconstructedPersisted = restartedOwner.project(api, 'orders', 'orders.list');
  expect(reconstructedOther).toMatchObject({ ok: true, data: { id: other.data.id } });
  expect(reconstructedPersisted).toMatchObject({ ok: true, data: { id: persisted.data.id } });
  expect(restartedOwner.resolve(serialized, {})).toMatchObject({
    ok: true,
    data: { operation: { id: 'orders.list' } },
  });
  expect(JSON.stringify(persisted.data)).not.toContain('orders.list');
});

it('rejects persisted handles when their registered operation revision changed', () => {
  const originalOwner = createFlowApiOperationOwner();
  const persisted = originalOwner.project(twoOperationApi('v1'), 'orders', 'orders.list');
  expect(persisted.ok).toBe(true);
  if (!persisted.ok) return;

  const restartedOwner = createFlowApiOperationOwner();
  const revised = restartedOwner.project(twoOperationApi('v2'), 'orders', 'orders.list');
  expect(revised.ok).toBe(true);
  if (!revised.ok) return;
  expect(revised.data.id).not.toBe(persisted.data.id);
  expect(restartedOwner.resolve(persisted.data, {})).toMatchObject({
    ok: false,
    diagnostics: [{ code: 'unsafe-flow-projection' }],
  });
});
