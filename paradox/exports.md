# Public API

## createManualRestDataSource

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:166:1`

### Signatures

- `(definition: ManualRestDataSourceDefinition) => DataSourceDiagnosticResult<RestDataSourceConfig>`
  - definition: `ManualRestDataSourceDefinition`
  - returns: `DataSourceDiagnosticResult<RestDataSourceConfig>`

## DATA_SOURCES_PACKAGE_NAME

Kind: `value`
Module: `src/index.ts`
Source: `src/index.ts:5:14`

## DataSourcesPackageInfo

Kind: `type`
Module: `src/index.ts`
Source: `src/index.ts:15:1`

### Members

| Name           | Kind     | Type                                                                 | Required | Description |
| -------------- | -------- | -------------------------------------------------------------------- | -------- | ----------- |
| packageName    | property | `"@ankhorage/data-sources"`                                          | yes      |             |
| supportedKinds | property | `readonly ["database", "graphql", "managed-api", "openapi", "rest"]` | yes      |             |

## extractRestPathParams

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:68:1`

### Signatures

- `(path: string) => readonly string[]`
  - path: `string`
  - returns: `readonly string[]`

## getDataSourceKind

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:31:1`

### Signatures

- `(source: DataSourceConfig) => DataSourceKind`
  - source: `DataSourceConfig`
  - returns: `DataSourceKind`

## getDataSourcesPackageInfo

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:20:1`

### Signatures

- `() => DataSourcesPackageInfo`
  - returns: `DataSourcesPackageInfo`

## isManualRestMethod

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:60:1`

### Signatures

- `(method: string) => boolean`
  - method: `string`
  - returns: `boolean`

## isSupportedDataSourceKind

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:27:1`

### Signatures

- `(kind: string) => boolean`
  - kind: `string`
  - returns: `boolean`

## ManualRestDataSourceDefinition

Kind: `type`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:49:1`

### Members

| Name        | Kind     | Type                                                                                                                                                    | Required | Description |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| baseUrl     | property | `string`                                                                                                                                                | yes      |             |
| credential  | property | `CredentialRef \| undefined`                                                                                                                            | no       |             |
| description | property | `string \| undefined`                                                                                                                                   | no       |             |
| endpoints   | property | `readonly ManualRestEndpointDefinition[]`                                                                                                               | yes      |             |
| id          | property | `string`                                                                                                                                                | yes      |             |
| metadata    | property | `DataContractValue \| undefined`                                                                                                                        | no       |             |
| name        | property | `string \| undefined`                                                                                                                                   | no       |             |
| schemas     | property | `Readonly<Record<string, import("/Users/a_rtiphishl_e/git/data-sources/node_modules/@ankhorage/contracts/dist/data/schemas").DataSchema>> \| undefined` | no       |             |

## ManualRestEndpointDefinition

Kind: `type`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:39:1`

### Members

| Name        | Kind     | Type                                       | Required | Description |
| ----------- | -------- | ------------------------------------------ | -------- | ----------- |
| credential  | property | `CredentialRef \| undefined`               | no       |             |
| description | property | `string \| undefined`                      | no       |             |
| id          | property | `string`                                   | yes      |             |
| metadata    | property | `DataContractValue \| undefined`           | no       |             |
| name        | property | `string \| undefined`                      | no       |             |
| operations  | property | `readonly ManualRestOperationDefinition[]` | yes      |             |
| path        | property | `string`                                   | yes      |             |

## ManualRestMethod

Kind: `unknown`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:22:1`

## ManualRestOperationDefinition

Kind: `type`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:24:1`

### Members

| Name        | Kind     | Type                                             | Required | Description |
| ----------- | -------- | ------------------------------------------------ | -------- | ----------- |
| credential  | property | `CredentialRef \| undefined`                     | no       |             |
| description | property | `string \| undefined`                            | no       |             |
| id          | property | `string`                                         | yes      |             |
| intent      | property | `DataOperationIntent`                            | yes      |             |
| metadata    | property | `DataContractValue \| undefined`                 | no       |             |
| method      | property | `string`                                         | yes      |             |
| name        | property | `string \| undefined`                            | no       |             |
| pagination  | property | `DataOperationPagination \| undefined`           | no       |             |
| parameters  | property | `readonly DataOperationParameter[] \| undefined` | no       |             |
| path        | property | `string \| undefined`                            | no       |             |
| request     | property | `DataOperationRequest \| undefined`              | no       |             |
| response    | property | `DataOperationResponse \| undefined`             | no       |             |

## normalizeManualRestDataSource

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:183:1`

### Signatures

- `(definition: ManualRestDataSourceDefinition) => RestDataSourceConfig`
  - definition: `ManualRestDataSourceDefinition`
  - returns: `RestDataSourceConfig`

## normalizeManualRestMethod

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:64:1`

### Signatures

- `(method: string) => DataOperationMethod`
  - method: `string`
  - returns: `DataOperationMethod`

## SUPPORTED_DATA_SOURCE_KINDS

Kind: `value`
Module: `src/index.ts`
Source: `src/index.ts:7:14`

## validateManualRestDataSource

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:86:1`

### Signatures

- `(definition: ManualRestDataSourceDefinition) => readonly DataSourceDiagnostic[]`
  - definition: `ManualRestDataSourceDefinition`
  - returns: `readonly DataSourceDiagnostic[]`
