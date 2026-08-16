import type {
  ApiOrigin,
  ApiProtocol,
  DataSourceConfig,
  DataSourceKind,
} from '@ankhorage/contracts/data';

export * from './discovery';
export * from './graphql';
export * from './openapi';
export * from './rest';
export * from './test-runner';

export const DATA_SOURCES_PACKAGE_NAME = '@ankhorage/data-sources' as const;
export const SUPPORTED_DATA_SOURCE_KINDS = ['database'] as const satisfies readonly DataSourceKind[];
export const SUPPORTED_API_ORIGINS = ['external'] as const satisfies readonly ApiOrigin[];
export const SUPPORTED_API_PROTOCOLS = ['graphql', 'rest'] as const satisfies readonly ApiProtocol[];

export type SupportedApiOrigin = (typeof SUPPORTED_API_ORIGINS)[number];

export interface DataSourcesPackageInfo {
  readonly packageName: typeof DATA_SOURCES_PACKAGE_NAME;
  readonly supportedKinds: typeof SUPPORTED_DATA_SOURCE_KINDS;
  readonly supportedApiOrigins: typeof SUPPORTED_API_ORIGINS;
  readonly supportedApiProtocols: typeof SUPPORTED_API_PROTOCOLS;
}

export function getDataSourcesPackageInfo(): DataSourcesPackageInfo {
  return {
    packageName: DATA_SOURCES_PACKAGE_NAME,
    supportedKinds: SUPPORTED_DATA_SOURCE_KINDS,
    supportedApiOrigins: SUPPORTED_API_ORIGINS,
    supportedApiProtocols: SUPPORTED_API_PROTOCOLS,
  };
}

export function isSupportedDataSourceKind(kind: string): kind is DataSourceKind {
  return SUPPORTED_DATA_SOURCE_KINDS.some((supported) => supported === kind);
}

export function isSupportedApiOrigin(origin: string): origin is SupportedApiOrigin {
  return SUPPORTED_API_ORIGINS.some((supported) => supported === origin);
}

export function isSupportedApiProtocol(protocol: string): protocol is ApiProtocol {
  return SUPPORTED_API_PROTOCOLS.some((supported) => supported === protocol);
}

export function getDataSourceKind(source: DataSourceConfig): DataSourceKind {
  return source.kind;
}
