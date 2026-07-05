import { describe, expect, test } from 'bun:test';

import provider from './ankh.provider';

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
});
