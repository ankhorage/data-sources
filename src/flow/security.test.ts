import type { ApiDefinition } from '@ankhorage/contracts/data';
import { expect, it } from 'bun:test';

import { createManualRestApi } from '../rest';
import { createFlowApiOperationOwner } from './index';

const firstHandleKey = new TextEncoder().encode('01234567890123456789012345678901');
const rotatedHandleKey = new TextEncoder().encode('abcdefghijklmnopqrstuvwxyz012345');

function securityApi(): ApiDefinition {
  const result = createManualRestApi({
    id: 'security-api',
    baseUrl: 'https://api.example.test?token=do-not-persist',
    endpoints: [
      {
        id: 'items',
        path: '/items',
        operations: [{ id: 'items.list', intent: 'read', method: 'GET' }],
      },
    ],
  });
  if (!result.ok) throw new Error('security fixture must be valid');
  return result.data;
}

function projectSecurityOperation(handleKey: Uint8Array) {
  return createFlowApiOperationOwner({ handleKey }).project(securityApi(), 'items', 'items.list');
}

it('derives opaque handles from server-owned HMAC key material', () => {
  const keyed = projectSecurityOperation(firstHandleKey);
  const rotated = projectSecurityOperation(rotatedHandleKey);

  expect(keyed.ok).toBe(true);
  expect(rotated.ok).toBe(true);
  if (!keyed.ok || !rotated.ok) return;
  expect(keyed.data.id).toStartWith('flow:v2:operation:');
  expect(rotated.data.id).not.toBe(keyed.data.id);
  expect(JSON.stringify(keyed.data)).not.toContain('do-not-persist');
});

it('does not treat a copied handle as authorization outside its registered owner', () => {
  const descriptor = projectSecurityOperation(firstHandleKey);
  expect(descriptor.ok).toBe(true);
  if (!descriptor.ok) return;

  const unregisteredOwner = createFlowApiOperationOwner({ handleKey: firstHandleKey });
  expect(unregisteredOwner.resolve(descriptor.data, {})).toMatchObject({
    ok: false,
    diagnostics: [{ code: 'unsafe-flow-projection' }],
  });
});

it('rejects insufficient owner key material', () => {
  expect(() => createFlowApiOperationOwner({ handleKey: new Uint8Array(31) })).toThrow(
    'at least 32 bytes',
  );
});
