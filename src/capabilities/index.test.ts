import { isCapability } from '@ankhorage/contracts/capabilities';
import { describe, expect, test } from 'bun:test';

import packageManifest from '../../package.json';
import { CAPABILITIES } from './index';

describe('CAPABILITIES', () => {
  test('publishes the current data-source provider capability surface', () => {
    expect(CAPABILITIES.map((capability) => capability.id)).toEqual([
      'data-sources.inspect',
      'data-sources.validate',
      'data-sources.test',
      'data-sources.normalize',
    ]);
    expect(CAPABILITIES.every(isCapability)).toBe(true);
  });

  test('matches published package discovery metadata', () => {
    expect(packageManifest.ankh.capabilities).toEqual(CAPABILITIES);
  });
});
