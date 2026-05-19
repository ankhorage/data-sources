# Public API

## DATA_SOURCES_PACKAGE_NAME

Kind: `value`
Module: `src/index.ts`
Source: `src/index.ts:3:14`

## DataSourcesPackageInfo

Kind: `type`
Module: `src/index.ts`
Source: `src/index.ts:13:1`

### Members

| Name           | Kind     | Type                                                                 | Required | Description |
| -------------- | -------- | -------------------------------------------------------------------- | -------- | ----------- |
| packageName    | property | `"@ankhorage/data-sources"`                                          | yes      |             |
| supportedKinds | property | `readonly ["database", "graphql", "managed-api", "openapi", "rest"]` | yes      |             |

## getDataSourceKind

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:29:1`

### Signatures

- `(source: DataSourceConfig) => DataSourceKind`
  - source: `DataSourceConfig`
  - returns: `DataSourceKind`

## getDataSourcesPackageInfo

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:18:1`

### Signatures

- `() => DataSourcesPackageInfo`
  - returns: `DataSourcesPackageInfo`

## isSupportedDataSourceKind

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:25:1`

### Signatures

- `(kind: string) => boolean`
  - kind: `string`
  - returns: `boolean`

## SUPPORTED_DATA_SOURCE_KINDS

Kind: `value`
Module: `src/index.ts`
Source: `src/index.ts:5:14`
