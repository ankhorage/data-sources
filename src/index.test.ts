import type {
  DatabaseDataSourceConfig,
  ExternalRestApiDefinition,
} from '@ankhorage/contracts/data';
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
  it('exports canonical API and database capabilities separately', () => {
    expect(getDataSourcesPackageInfo()).toEqual({
      packageName: DATA_SOURCES_PACKAGE_NAME,
      supportedKinds: ['database'],
      supportedApiOrigins: ['external'],
      supportedApiProtocols: ['graphql', 'rest'],
    });
  });

  it('recognizes only currently executable API origins', () => {
    expect(isSupportedDataSourceKind('database')).toBe(true);
    expect(isSupportedDataSourceKind('api')).toBe(false);
    expect(isSupportedApiOrigin('external')).toBe(true);
    expect(isSupportedApiOrigin('internal')).toBe(false);
    expect(isSupportedApiOrigin('generated')).toBe(false);
    expect(isSupportedApiProtocol('rest')).toBe(true);
    expect(isSupportedApiProtocol('graphql')).toBe(true);
  });

  it('consumes canonical API contracts from @ankhorage/contracts', () => {
    const api: ExternalRestApiDefinition = {
      id: 'cms',
      origin: 'external',
      protocol: 'rest',
      baseUrl: 'https://cms.example.com',
      endpoints: {},
    };
    const source: DatabaseDataSourceConfig = {
      id: 'primary-db',
      kind: 'database',
      adapter: { id: 'database-adapter', kind: 'database' },
      endpoints: {},
    };

    expect(api.origin).toBe('external');
    expect(getDataSourceKind(source)).toBe('database');
  });
});
