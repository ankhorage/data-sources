import type { RestDataSourceConfig } from '@ankhorage/contracts/data';
import { describe, expect, it } from 'bun:test';

import {
  DATA_SOURCES_PACKAGE_NAME,
  getDataSourceKind,
  getDataSourcesPackageInfo,
  isSupportedDataSourceKind,
  SUPPORTED_DATA_SOURCE_KINDS,
} from './index';

describe('data-sources package baseline', () => {
  it('exports package metadata', () => {
    const info = getDataSourcesPackageInfo();

    expect(info.packageName).toBe(DATA_SOURCES_PACKAGE_NAME);
    expect(info.supportedKinds).toEqual(SUPPORTED_DATA_SOURCE_KINDS);
  });

  it('recognizes supported shared contract data-source kinds', () => {
    expect(isSupportedDataSourceKind('rest')).toBe(true);
    expect(isSupportedDataSourceKind('openapi')).toBe(true);
    expect(isSupportedDataSourceKind('graphql')).toBe(true);
    expect(isSupportedDataSourceKind('managed-api')).toBe(true);
    expect(isSupportedDataSourceKind('database')).toBe(true);
    expect(isSupportedDataSourceKind('studio')).toBe(false);
  });

  it('consumes data-source contracts from @ankhorage/contracts', () => {
    const source: RestDataSourceConfig = {
      id: 'cms',
      kind: 'rest',
      baseUrl: 'https://cms.example.com',
      endpoints: {},
    };

    expect(getDataSourceKind(source)).toBe('rest');
  });
});
