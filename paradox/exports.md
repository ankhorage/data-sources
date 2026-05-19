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
Source: `src/index.ts:6:14`

## DataSourcesPackageInfo

Kind: `type`
Module: `src/index.ts`
Source: `src/index.ts:16:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| packageName | property | `"@ankhorage/data-sources"` | yes |  |
| supportedKinds | property | `readonly ["database", "graphql", "managed-api", "openapi", "rest"]` | yes |  |

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
Source: `src/index.ts:32:1`

### Signatures

- `(source: DataSourceConfig) => DataSourceKind`
  - source: `DataSourceConfig`
  - returns: `DataSourceKind`

## getDataSourcesPackageInfo

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:21:1`

### Signatures

- `() => DataSourcesPackageInfo`
  - returns: `DataSourcesPackageInfo`

## importOpenApiDocument

Kind: `function`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:126:1`

### Signatures

- `(input: OpenApiImportInput) => OpenApiImportResult`
  - input: `OpenApiImportInput`
  - returns: `OpenApiImportResult`

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
Source: `src/index.ts:28:1`

### Signatures

- `(kind: string) => boolean`
  - kind: `string`
  - returns: `boolean`

## ManualRestDataSourceDefinition

Kind: `type`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:49:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| baseUrl | property | `string` | yes |  |
| credential | property | `CredentialRef \| undefined` | no |  |
| description | property | `string \| undefined` | no |  |
| endpoints | property | `readonly ManualRestEndpointDefinition[]` | yes |  |
| id | property | `string` | yes |  |
| metadata | property | `DataContractValue \| undefined` | no |  |
| name | property | `string \| undefined` | no |  |
| schemas | property | `Readonly<Record<string, import("/Users/a_rtiphishl_e/git/data-sources/node_modules/@ankhorage/contracts/dist/data/schemas").DataSchema>> \| undefined` | no |  |

## ManualRestEndpointDefinition

Kind: `type`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:39:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credential | property | `CredentialRef \| undefined` | no |  |
| description | property | `string \| undefined` | no |  |
| id | property | `string` | yes |  |
| metadata | property | `DataContractValue \| undefined` | no |  |
| name | property | `string \| undefined` | no |  |
| operations | property | `readonly ManualRestOperationDefinition[]` | yes |  |
| path | property | `string` | yes |  |

## ManualRestMethod

Kind: `unknown`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:22:1`

## ManualRestOperationDefinition

Kind: `type`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:24:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| credential | property | `CredentialRef \| undefined` | no |  |
| description | property | `string \| undefined` | no |  |
| id | property | `string` | yes |  |
| intent | property | `DataOperationIntent` | yes |  |
| metadata | property | `DataContractValue \| undefined` | no |  |
| method | property | `string` | yes |  |
| name | property | `string \| undefined` | no |  |
| pagination | property | `DataOperationPagination \| undefined` | no |  |
| parameters | property | `readonly DataOperationParameter[] \| undefined` | no |  |
| path | property | `string \| undefined` | no |  |
| request | property | `DataOperationRequest \| undefined` | no |  |
| response | property | `DataOperationResponse \| undefined` | no |  |

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

## normalizeOpenApiEndpointId

Kind: `function`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:178:1`

### Signatures

- `(path: string) => string`
  - path: `string`
  - returns: `string`

## normalizeOpenApiOperationId

Kind: `function`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:163:1`

### Signatures

- `(method: "delete" | "get" | "head" | "options" | "patch" | "post" | "put", path: string, operationId?: string | undefined) => string`
  - method: `"delete" | "get" | "head" | "options" | "patch" | "post" | "put"`
  - operationId: `string | undefined` (optional)
  - path: `string`
  - returns: `string`

## normalizeOpenApiSchema

Kind: `function`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:188:1`

### Signatures

- `(schema: OpenApiSchemaObject) => DataSchema`
  - schema: `OpenApiSchemaObject`
  - returns: `DataSchema`

## OpenApiComponentsObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:95:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| schemas | property | `Readonly<Record<string, OpenApiSchemaObject>> \| undefined` | no |  |
| securitySchemes | property | `Readonly<Record<string, DataContractValue>> \| undefined` | no |  |

## OpenApiDocumentObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:100:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| components | property | `OpenApiComponentsObject \| undefined` | no |  |
| info | property | `{ readonly title?: string; readonly version?: string; readonly description?: string; } \| undefined` | no |  |
| openapi | property | `string \| undefined` | no |  |
| paths | property | `Readonly<Record<string, OpenApiPathItemObject>> \| undefined` | no |  |
| servers | property | `readonly OpenApiServerObject[] \| undefined` | no |  |

## OpenApiHttpMethod

Kind: `unknown`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:32:1`

## OpenApiImportInput

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:112:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| baseUrl | property | `string \| undefined` | no |  |
| credential | property | `CredentialRef \| undefined` | no |  |
| description | property | `string \| undefined` | no |  |
| document | property | `OpenApiDocumentObject` | yes |  |
| documentId | property | `string \| undefined` | no |  |
| documentUrl | property | `string \| undefined` | no |  |
| id | property | `string` | yes |  |
| metadata | property | `DataContractValue \| undefined` | no |  |
| name | property | `string \| undefined` | no |  |

## OpenApiImportResult

Kind: `unknown`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:124:1`

## OpenApiMediaTypeObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:58:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| schema | property | `OpenApiSchemaObject \| undefined` | no |  |

## OpenApiOperationObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:81:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| deprecated | property | `boolean \| undefined` | no |  |
| description | property | `string \| undefined` | no |  |
| operationId | property | `string \| undefined` | no |  |
| parameters | property | `readonly OpenApiParameterObject[] \| undefined` | no |  |
| requestBody | property | `OpenApiRequestBodyObject \| undefined` | no |  |
| responses | property | `Readonly<Record<string, OpenApiResponseObject>> \| undefined` | no |  |
| summary | property | `string \| undefined` | no |  |

## OpenApiParameterObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:73:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| description | property | `string \| undefined` | no |  |
| in | property | `string` | yes |  |
| name | property | `string` | yes |  |
| required | property | `boolean \| undefined` | no |  |
| schema | property | `OpenApiSchemaObject \| undefined` | no |  |

## OpenApiPathItemObject

Kind: `unknown`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:91:1`

## OpenApiRequestBodyObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:62:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| content | property | `Readonly<Record<string, OpenApiMediaTypeObject>> \| undefined` | no |  |
| description | property | `string \| undefined` | no |  |
| required | property | `boolean \| undefined` | no |  |

## OpenApiResponseObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:68:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| content | property | `Readonly<Record<string, OpenApiMediaTypeObject>> \| undefined` | no |  |
| description | property | `string \| undefined` | no |  |

## OpenApiSchemaObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:39:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| $ref | property | `string \| undefined` | no |  |
| additionalProperties | property | `boolean \| OpenApiSchemaObject \| undefined` | no |  |
| allOf | property | `readonly OpenApiSchemaObject[] \| undefined` | no |  |
| anyOf | property | `readonly OpenApiSchemaObject[] \| undefined` | no |  |
| const | property | `DataContractValue \| undefined` | no |  |
| default | property | `DataContractValue \| undefined` | no |  |
| description | property | `string \| undefined` | no |  |
| enum | property | `readonly DataContractValue[] \| undefined` | no |  |
| format | property | `string \| undefined` | no |  |
| items | property | `OpenApiSchemaObject \| undefined` | no |  |
| nullable | property | `boolean \| undefined` | no |  |
| oneOf | property | `readonly OpenApiSchemaObject[] \| undefined` | no |  |
| properties | property | `Readonly<Record<string, OpenApiSchemaObject>> \| undefined` | no |  |
| required | property | `readonly string[] \| undefined` | no |  |
| title | property | `string \| undefined` | no |  |
| type | property | `string \| readonly string[] \| undefined` | no |  |

## OpenApiServerObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:34:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| description | property | `string \| undefined` | no |  |
| url | property | `string` | yes |  |

## SUPPORTED_DATA_SOURCE_KINDS

Kind: `value`
Module: `src/index.ts`
Source: `src/index.ts:8:14`

## validateManualRestDataSource

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:86:1`

### Signatures

- `(definition: ManualRestDataSourceDefinition) => readonly DataSourceDiagnostic[]`
  - definition: `ManualRestDataSourceDefinition`
  - returns: `readonly DataSourceDiagnostic[]`
