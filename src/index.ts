import type { DataSourceConfig, DataSourceKind } from '@ankhorage/contracts/data';

export * from './graphql';
export * from './openapi';
export * from './rest';

export const DATA_SOURCES_PACKAGE_NAME = '@ankhorage/data-sources' as const;

export const SUPPORTED_DATA_SOURCE_KINDS = [
  'database',
  'graphql',
  'managed-api',
  'openapi',
  'rest',
] as const satisfies readonly DataSourceKind[];

export interface DataSourcesPackageInfo {
  readonly packageName: typeof DATA_SOURCES_PACKAGE_NAME;
  readonly supportedKinds: typeof SUPPORTED_DATA_SOURCE_KINDS;
}

export function getDataSourcesPackageInfo(): DataSourcesPackageInfo {
  return {
    packageName: DATA_SOURCES_PACKAGE_NAME,
    supportedKinds: SUPPORTED_DATA_SOURCE_KINDS,
  };
}

export function isSupportedDataSourceKind(kind: string): kind is DataSourceKind {
  return SUPPORTED_DATA_SOURCE_KINDS.some((supportedKind) => supportedKind === kind);
}

export function getDataSourceKind(source: DataSourceConfig): DataSourceKind {
  return source.kind;
}
