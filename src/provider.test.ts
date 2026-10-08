import { describe, expect, test } from 'bun:test';

import provider from './ankh.provider';
import { CAPABILITIES } from './capabilities';

describe('provider', () => {
  test('lists data-source commands', () => {
    expect(provider.category).toBe('data-sources');
    expect(provider.commands.map((command) => command.path.join(' '))).toEqual([
      'kind list',
      'config validate',
      'endpoint test',
      'config normalize',
    ]);
  });

  test('uses the canonical capability catalog for provider and command metadata', () => {
    expect(provider.capabilities).toBe(CAPABILITIES);
    expect(provider.commands.map((command) => command.capability)).toEqual(
      CAPABILITIES.map((capability) => capability.id),
    );
  });
});
