import type { ExternalRestApiDataSourceConfig } from '@ankhorage/contracts/data';
import { describe, expect, it } from 'bun:test';

import {
  DATA_SOURCES_PACKAGE_NAME,
  getDataSourceKind,
  getDataSourcesPackageInfo,
  isSupportedApiOrigin,
  isSupportedApiProtocol,
  isSupportedDataSourceKind,
} from './index';

describe('data-sources package model', () => {
  it('exports orthogonal package capabilities', () => {
    expect(getDataSourcesPackageInfo()).toEqual({
      packageName: DATA_SOURCES_PACKAGE_NAME,
      supportedKinds: ['api', 'database'],
      supportedApiOrigins: ['external', 'generated'],
      supportedApiProtocols: ['graphql', 'rest'],
    });
  });

  it('recognizes only canonical source dimensions', () => {
    expect(isSupportedDataSourceKind('api')).toBe(true);
    expect(isSupportedDataSourceKind('database')).toBe(true);
    expect(isSupportedDataSourceKind('managed-api')).toBe(false);
    expect(isSupportedDataSourceKind('openapi')).toBe(false);
    expect(isSupportedApiOrigin('external')).toBe(true);
    expect(isSupportedApiOrigin('generated')).toBe(true);
    expect(isSupportedApiProtocol('rest')).toBe(true);
    expect(isSupportedApiProtocol('graphql')).toBe(true);
  });

  it('consumes canonical contracts from @ankhorage/contracts', () => {
    const source: ExternalRestApiDataSourceConfig = {
      id: 'cms',
      kind: 'api',
      origin: 'external',
      protocol: 'rest',
      baseUrl: 'https://cms.example.com',
      endpoints: {},
    };

    expect(getDataSourceKind(source)).toBe('api');
  });
});
