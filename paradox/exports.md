# Public API

## buildEndpointTestRequest

Kind: `function`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:140:1`

### Signatures

- `(input: EndpointTestInput) => Promise<EndpointTestResult>`
  - input: `EndpointTestInput`
  - returns: `Promise<EndpointTestResult>`

## createGeneratedApiDataSource

Kind: `function`
Module: `src/generated-api/index.ts`
Source: `src/generated-api/index.ts:24:1`

### Signatures

- `(definition: GeneratedApiDefinition) => DataSourceDiagnosticResult<GeneratedRestApiDataSourceConfig>`
  - definition: `GeneratedApiDefinition`
  - returns: `DataSourceDiagnosticResult<GeneratedRestApiDataSourceConfig>`

## createGeneratedApiEndpoint

Kind: `function`
Module: `src/generated-api/index.ts`
Source: `src/generated-api/index.ts:98:1`

### Signatures

- `(definition: GeneratedApiDefinition, resource: GeneratedApiResourceDefinition) => DataEndpointConfig`
  - definition: `GeneratedApiDefinition`
  - resource: `GeneratedApiResourceDefinition`
  - returns: `DataEndpointConfig`

## createGeneratedApiOperation

Kind: `function`
Module: `src/generated-api/index.ts`
Source: `src/generated-api/index.ts:120:1`

### Signatures

- `(definition: GeneratedApiDefinition, resource: GeneratedApiResourceDefinition, operation: "list" | "read" | "create" | "update" | "delete") => DataOperationConfig`
  - definition: `GeneratedApiDefinition`
  - operation: `"list" | "read" | "create" | "update" | "delete"`
  - resource: `GeneratedApiResourceDefinition`
  - returns: `DataOperationConfig`

## createGeneratedApiOperationId

Kind: `function`
Module: `src/generated-api/index.ts`
Source: `src/generated-api/index.ts:147:1`

### Signatures

- `(resourceId: string, operation: "list" | "read" | "create" | "update" | "delete") => string`
  - operation: `"list" | "read" | "create" | "update" | "delete"`
  - resourceId: `string`
  - returns: `string`

## createGeneratedApiResourceSchema

Kind: `function`
Module: `src/generated-api/index.ts`
Source: `src/generated-api/index.ts:154:1`

### Signatures

- `(collection: DbCollectionDefinition) => DataSchema`
  - collection: `DbCollectionDefinition`
  - returns: `DataSchema`

## createGraphQlDataSource

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:142:1`

### Signatures

- `(definition: GraphQlDataSourceDefinition) => DataSourceDiagnosticResult<ExternalGraphQlApiDataSourceConfig>`
  - definition: `GraphQlDataSourceDefinition`
  - returns: `DataSourceDiagnosticResult<ExternalGraphQlApiDataSourceConfig>`

## createGraphQlIntrospectionRequest

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:127:1`

### Signatures

- `() => GraphQlIntrospectionRequest`
  - returns: `GraphQlIntrospectionRequest`

## createManualRestDataSource

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:121:1`

### Signatures

- `(definition: ManualRestDataSourceDefinition) => DataSourceDiagnosticResult<ExternalRestApiDataSourceConfig>`
  - definition: `ManualRestDataSourceDefinition`
  - returns: `DataSourceDiagnosticResult<ExternalRestApiDataSourceConfig>`

## createOpenApiDiscoveryCandidates

Kind: `function`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:103:1`

### Signatures

- `(rawUrl: string, conventionalPaths?: readonly string[]) => readonly string[]`
  - conventionalPaths: `readonly string[]` (optional)
  - rawUrl: `string`
  - returns: `readonly string[]`

## DATA_SOURCES_PACKAGE_NAME

Kind: `value`
Module: `src/index.ts`
Source: `src/index.ts:15:14`

## DataSourcesPackageInfo

Kind: `type`
Module: `src/index.ts`
Source: `src/index.ts:29:1`

### Members

| Name                  | Kind     | Type                                 | Required | Description |
| --------------------- | -------- | ------------------------------------ | -------- | ----------- |
| packageName           | property | `"@ankhorage/data-sources"`          | yes      |             |
| supportedApiOrigins   | property | `readonly ["external", "generated"]` | yes      |             |
| supportedApiProtocols | property | `readonly ["graphql", "rest"]`       | yes      |             |
| supportedKinds        | property | `readonly ["api", "database"]`       | yes      |             |

## DEFAULT_OPENAPI_DISCOVERY_PATHS

Kind: `value`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:16:14`

## discoverOpenApiDataSource

Kind: `function`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:124:1`

### Signatures

- `(input: DiscoverOpenApiDataSourceInput) => Promise<DiscoverOpenApiDataSourceResult>`
  - input: `DiscoverOpenApiDataSourceInput`
  - returns: `Promise<DiscoverOpenApiDataSourceResult>`

## DiscoverOpenApiDataSourceInput

Kind: `type`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:53:1`

### Members

| Name              | Kind     | Type                             | Required | Description |
| ----------------- | -------- | -------------------------------- | -------- | ----------- |
| baseUrl           | property | `string \| undefined`            | no       |             |
| conventionalPaths | property | `readonly string[] \| undefined` | no       |             |
| credential        | property | `CredentialRef \| undefined`     | no       |             |
| description       | property | `string \| undefined`            | no       |             |
| fetch             | property | `ExternalApiFetch`               | yes      |             |
| id                | property | `string`                         | yes      |             |
| metadata          | property | `DataContractValue \| undefined` | no       |             |
| name              | property | `string \| undefined`            | no       |             |
| url               | property | `string`                         | yes      |             |

## DiscoverOpenApiDataSourceResult

Kind: `unknown`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:65:1`

## EndpointTestCredential

Kind: `type`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:16:1`

### Members

| Name    | Kind     | Type                                                       | Required | Description |
| ------- | -------- | ---------------------------------------------------------- | -------- | ----------- |
| headers | property | `Readonly<Record<string, string>> \| undefined`            | no       |             |
| query   | property | `Readonly<Record<string, DataContractValue>> \| undefined` | no       |             |

## EndpointTestCredentialResolver

Kind: `unknown`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:21:1`

## EndpointTestFetch

Kind: `unknown`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:37:1`

## EndpointTestFetchInit

Kind: `type`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:25:1`

### Members

| Name    | Kind     | Type                               | Required | Description |
| ------- | -------- | ---------------------------------- | -------- | ----------- |
| body    | property | `string \| undefined`              | no       |             |
| headers | property | `Readonly<Record<string, string>>` | yes      |             |
| method  | property | `string`                           | yes      |             |

## EndpointTestFetchResponse

Kind: `type`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:31:1`

### Members

| Name    | Kind     | Type                                            | Required | Description |
| ------- | -------- | ----------------------------------------------- | -------- | ----------- |
| headers | property | `Readonly<Record<string, string>> \| undefined` | no       |             |
| status  | property | `number`                                        | yes      |             |
| text    | method   | `() => Promise<string>`                         | yes      |             |

## EndpointTestHeaders

Kind: `unknown`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:14:1`

## EndpointTestInput

Kind: `type`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:42:1`

### Members

| Name               | Kind     | Type                                                       | Required | Description |
| ------------------ | -------- | ---------------------------------------------------------- | -------- | ----------- |
| credentialResolver | property | `EndpointTestCredentialResolver \| undefined`              | no       |             |
| dataSource         | property | `DataSourceConfig`                                         | yes      |             |
| dryRun             | property | `boolean \| undefined`                                     | no       |             |
| endpointId         | property | `string`                                                   | yes      |             |
| fetch              | property | `EndpointTestFetch \| undefined`                           | no       |             |
| operationId        | property | `string`                                                   | yes      |             |
| values             | property | `Readonly<Record<string, DataContractValue>> \| undefined` | no       |             |

## EndpointTestInputValues

Kind: `unknown`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:13:1`

## EndpointTestRequestDiagnostic

Kind: `type`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:52:1`

### Members

| Name         | Kind     | Type                               | Required | Description |
| ------------ | -------- | ---------------------------------- | -------- | ----------- |
| body         | property | `string \| undefined`              | no       |             |
| dataSourceId | property | `string`                           | yes      |             |
| dryRun       | property | `boolean`                          | yes      |             |
| endpointId   | property | `string`                           | yes      |             |
| headers      | property | `Readonly<Record<string, string>>` | yes      |             |
| method       | property | `string`                           | yes      |             |
| operationId  | property | `string`                           | yes      |             |
| url          | property | `string`                           | yes      |             |

## EndpointTestResponseDiagnostic

Kind: `type`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:63:1`

### Members

| Name       | Kind     | Type                                            | Required | Description |
| ---------- | -------- | ----------------------------------------------- | -------- | ----------- |
| bodyText   | property | `string \| undefined`                           | no       |             |
| headers    | property | `Readonly<Record<string, string>> \| undefined` | no       |             |
| ok         | property | `boolean`                                       | yes      |             |
| parsedBody | property | `DataContractValue \| undefined`                | no       |             |
| status     | property | `number`                                        | yes      |             |

## EndpointTestResult

Kind: `unknown`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:71:1`

## ExternalApiFetch

Kind: `unknown`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:34:1`

## ExternalApiFetchInit

Kind: `type`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:23:1`

### Members

| Name    | Kind     | Type                               | Required | Description |
| ------- | -------- | ---------------------------------- | -------- | ----------- |
| body    | property | `string \| undefined`              | no       |             |
| headers | property | `Readonly<Record<string, string>>` | yes      |             |
| method  | property | `"GET" \| "POST"`                  | yes      |             |

## ExternalApiFetchResponse

Kind: `type`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:29:1`

### Members

| Name   | Kind     | Type                    | Required | Description |
| ------ | -------- | ----------------------- | -------- | ----------- |
| status | property | `number`                | yes      |             |
| text   | method   | `() => Promise<string>` | yes      |             |

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
Source: `src/index.ts:57:1`

### Signatures

- `(source: DataSourceConfig) => DataSourceKind`
  - source: `DataSourceConfig`
  - returns: `DataSourceKind`

## getDataSourcesPackageInfo

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:36:1`

### Signatures

- `() => DataSourcesPackageInfo`
  - returns: `DataSourcesPackageInfo`

## GRAPHQL_INTROSPECTION_QUERY

Kind: `value`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:16:14`

## GraphQlDataSourceDefinition

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:109:1`

### Members

| Name                 | Kind     | Type                                                 | Required | Description |
| -------------------- | -------- | ---------------------------------------------------- | -------- | ----------- |
| credential           | property | `CredentialRef \| undefined`                         | no       |             |
| description          | property | `string \| undefined`                                | no       |             |
| endpointUrl          | property | `string`                                             | yes      |             |
| id                   | property | `string`                                             | yes      |             |
| introspection        | property | `GraphQlIntrospectionResult \| undefined`            | no       |             |
| introspectionEnabled | property | `boolean \| undefined`                               | no       |             |
| metadata             | property | `DataContractValue \| undefined`                     | no       |             |
| name                 | property | `string \| undefined`                                | no       |             |
| operations           | property | `readonly GraphQlOperationDefinition[] \| undefined` | no       |             |
| schemaVersion        | property | `string \| undefined`                                | no       |             |

## GraphQlIntrospectionEnumValue

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:71:1`

### Members

| Name        | Kind     | Type                          | Required | Description |
| ----------- | -------- | ----------------------------- | -------- | ----------- |
| description | property | `string \| null \| undefined` | no       |             |
| name        | property | `string`                      | yes      |             |

## GraphQlIntrospectionField

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:64:1`

### Members

| Name        | Kind     | Type                                                             | Required | Description |
| ----------- | -------- | ---------------------------------------------------------------- | -------- | ----------- |
| args        | property | `readonly GraphQlIntrospectionInputValue[] \| null \| undefined` | no       |             |
| description | property | `string \| null \| undefined`                                    | no       |             |
| name        | property | `string`                                                         | yes      |             |
| type        | property | `GraphQlIntrospectionTypeRef`                                    | yes      |             |

## GraphQlIntrospectionInputValue

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:57:1`

### Members

| Name         | Kind     | Type                          | Required | Description |
| ------------ | -------- | ----------------------------- | -------- | ----------- |
| defaultValue | property | `string \| null \| undefined` | no       |             |
| description  | property | `string \| null \| undefined` | no       |             |
| name         | property | `string`                      | yes      |             |
| type         | property | `GraphQlIntrospectionTypeRef` | yes      |             |

## GraphQlIntrospectionRequest

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:122:1`

### Members

| Name          | Kind     | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Required | Description |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| operationName | property | `"AnkhorageGraphQlIntrospection"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | yes      |             |
| query         | property | `"query AnkhorageGraphQlIntrospection {\n  __schema {\n    queryType { name }\n    mutationType { name }\n    subscriptionType { name }\n    types {\n      kind\n      name\n      description\n      fields {\n        name\n        description\n        args {\n          name\n          description\n          type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }\n          defaultValue\n        }\n        type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }\n      }\n      inputFields {\n        name\n        description\n        type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }\n        defaultValue\n      }\n      enumValues { name description }\n      possibleTypes { kind name }\n    }\n  }\n}"` | yes      |             |

## GraphQlIntrospectionResult

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:93:1`

### Members

| Name       | Kind     | Type                                      | Required | Description |
| ---------- | -------- | ----------------------------------------- | -------- | ----------- |
| \_\_schema | property | `GraphQlIntrospectionSchema \| undefined` | no       |             |

## GraphQlIntrospectionSchema

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:86:1`

### Members

| Name             | Kind     | Type                                                       | Required | Description |
| ---------------- | -------- | ---------------------------------------------------------- | -------- | ----------- |
| mutationType     | property | `{ readonly name?: string \| null; } \| null \| undefined` | no       |             |
| queryType        | property | `{ readonly name?: string \| null; } \| null \| undefined` | no       |             |
| subscriptionType | property | `{ readonly name?: string \| null; } \| null \| undefined` | no       |             |
| types            | property | `readonly GraphQlIntrospectionType[] \| null \| undefined` | no       |             |

## GraphQlIntrospectionType

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:76:1`

### Members

| Name          | Kind     | Type                                                             | Required | Description |
| ------------- | -------- | ---------------------------------------------------------------- | -------- | ----------- |
| description   | property | `string \| null \| undefined`                                    | no       |             |
| enumValues    | property | `readonly GraphQlIntrospectionEnumValue[] \| null \| undefined`  | no       |             |
| fields        | property | `readonly GraphQlIntrospectionField[] \| null \| undefined`      | no       |             |
| inputFields   | property | `readonly GraphQlIntrospectionInputValue[] \| null \| undefined` | no       |             |
| kind          | property | `string`                                                         | yes      |             |
| name          | property | `string \| null \| undefined`                                    | no       |             |
| possibleTypes | property | `readonly GraphQlIntrospectionTypeRef[] \| null \| undefined`    | no       |             |

## GraphQlIntrospectionTypeRef

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:51:1`

### Members

| Name   | Kind     | Type                                               | Required | Description |
| ------ | -------- | -------------------------------------------------- | -------- | ----------- |
| kind   | property | `string`                                           | yes      |             |
| name   | property | `string \| null \| undefined`                      | no       |             |
| ofType | property | `GraphQlIntrospectionTypeRef \| null \| undefined` | no       |             |

## GraphQlOperationDefinition

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:97:1`

### Members

| Name          | Kind     | Type                             | Required | Description |
| ------------- | -------- | -------------------------------- | -------- | ----------- |
| description   | property | `string \| undefined`            | no       |             |
| document      | property | `string \| undefined`            | no       |             |
| id            | property | `string`                         | yes      |             |
| kind          | property | `GraphQlOperationKind`           | yes      |             |
| metadata      | property | `DataContractValue \| undefined` | no       |             |
| name          | property | `string \| undefined`            | no       |             |
| response      | property | `DataSchema \| undefined`        | no       |             |
| selectionPath | property | `string \| undefined`            | no       |             |
| variables     | property | `DataSchema \| undefined`        | no       |             |

## GraphQlOperationKind

Kind: `unknown`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:48:1`

## importOpenApiDocument

Kind: `function`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:126:1`

### Signatures

- `(input: OpenApiImportInput) => OpenApiImportResult`
  - input: `OpenApiImportInput`
  - returns: `OpenApiImportResult`

## introspectGraphQlDataSource

Kind: `function`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:155:1`

### Signatures

- `(input: IntrospectGraphQlDataSourceInput) => Promise<IntrospectGraphQlDataSourceResult>`
  - input: `IntrospectGraphQlDataSourceInput`
  - returns: `Promise<IntrospectGraphQlDataSourceResult>`

## IntrospectGraphQlDataSourceInput

Kind: `type`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:79:1`

### Members

| Name          | Kind     | Type                                            | Required | Description |
| ------------- | -------- | ----------------------------------------------- | -------- | ----------- |
| credential    | property | `CredentialRef \| undefined`                    | no       |             |
| description   | property | `string \| undefined`                           | no       |             |
| endpointUrl   | property | `string`                                        | yes      |             |
| fetch         | property | `ExternalApiFetch`                              | yes      |             |
| headers       | property | `Readonly<Record<string, string>> \| undefined` | no       |             |
| id            | property | `string`                                        | yes      |             |
| metadata      | property | `DataContractValue \| undefined`                | no       |             |
| name          | property | `string \| undefined`                           | no       |             |
| schemaVersion | property | `string \| undefined`                           | no       |             |

## IntrospectGraphQlDataSourceResult

Kind: `unknown`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:91:1`

## isManualRestMethod

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:60:1`

### Signatures

- `(method: string) => boolean`
  - method: `string`
  - returns: `boolean`

## isSupportedApiOrigin

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:49:1`

### Signatures

- `(origin: string) => boolean`
  - origin: `string`
  - returns: `boolean`

## isSupportedApiProtocol

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:53:1`

### Signatures

- `(protocol: string) => boolean`
  - protocol: `string`
  - returns: `boolean`

## isSupportedDataSourceKind

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:45:1`

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

## normalizeGeneratedApiDataSource

Kind: `function`
Module: `src/generated-api/index.ts`
Source: `src/generated-api/index.ts:72:1`

### Signatures

- `(definition: GeneratedApiDefinition) => GeneratedRestApiDataSourceConfig`
  - definition: `GeneratedApiDefinition`
  - returns: `GeneratedRestApiDataSourceConfig`

## normalizeGraphQlDataSource

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:196:1`

### Signatures

- `(definition: GraphQlDataSourceDefinition) => ExternalGraphQlApiDataSourceConfig`
  - definition: `GraphQlDataSourceDefinition`
  - returns: `ExternalGraphQlApiDataSourceConfig`

## normalizeGraphQlIntrospectionOperations

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:249:1`

### Signatures

- `(introspection: GraphQlIntrospectionResult | undefined) => readonly GraphQlOperationDefinition[]`
  - introspection: `GraphQlIntrospectionResult | undefined`
  - returns: `readonly GraphQlOperationDefinition[]`

## normalizeGraphQlIntrospectionSchemas

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:235:1`

### Signatures

- `(introspection: GraphQlIntrospectionResult | undefined) => Readonly<Record<string, DataSchema>> | undefined`
  - introspection: `GraphQlIntrospectionResult | undefined`
  - returns: `Readonly<Record<string, DataSchema>> | undefined`

## normalizeGraphQlOperationId

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:134:1`

### Signatures

- `(kind: GraphQlOperationKind, name: string) => string`
  - kind: `GraphQlOperationKind`
  - name: `string`
  - returns: `string`

## normalizeManualRestDataSource

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:136:1`

### Signatures

- `(definition: ManualRestDataSourceDefinition) => ExternalRestApiDataSourceConfig`
  - definition: `ManualRestDataSourceDefinition`
  - returns: `ExternalRestApiDataSourceConfig`

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
Source: `src/openapi/index.ts:164:1`

### Signatures

- `(method: "delete" | "get" | "head" | "options" | "patch" | "post" | "put", path: string, operationId?: string | undefined) => string`
  - method: `"delete" | "get" | "head" | "options" | "patch" | "post" | "put"`
  - operationId: `string | undefined` (optional)
  - path: `string`
  - returns: `string`

## normalizeOpenApiSchema

Kind: `function`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:187:1`

### Signatures

- `(schema: OpenApiSchemaObject) => DataSchema`
  - schema: `OpenApiSchemaObject`
  - returns: `DataSchema`

## OpenApiComponentsObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:95:1`

### Members

| Name            | Kind     | Type                                                         | Required | Description |
| --------------- | -------- | ------------------------------------------------------------ | -------- | ----------- |
| schemas         | property | `Readonly<Record<string, OpenApiSchemaObject>> \| undefined` | no       |             |
| securitySchemes | property | `Readonly<Record<string, DataContractValue>> \| undefined`   | no       |             |

## OpenApiDiscoveryAttempt

Kind: `type`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:47:1`

### Members

| Name    | Kind     | Type                             | Required | Description |
| ------- | -------- | -------------------------------- | -------- | ----------- |
| outcome | property | `OpenApiDiscoveryAttemptOutcome` | yes      |             |
| status  | property | `number \| undefined`            | no       |             |
| url     | property | `string`                         | yes      |             |

## OpenApiDiscoveryAttemptOutcome

Kind: `unknown`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:39:1`

## OpenApiDocumentObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:100:1`

### Members

| Name       | Kind     | Type                                                                                                  | Required | Description |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------- | -------- | ----------- |
| components | property | `OpenApiComponentsObject \| undefined`                                                                | no       |             |
| info       | property | `{ readonly title?: string; readonly version?: string; readonly description?: string; } \| undefined` | no       |             |
| openapi    | property | `string \| undefined`                                                                                 | no       |             |
| paths      | property | `Readonly<Record<string, OpenApiPathItemObject>> \| undefined`                                        | no       |             |
| servers    | property | `readonly OpenApiServerObject[] \| undefined`                                                         | no       |             |

## OpenApiHttpMethod

Kind: `unknown`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:32:1`

## OpenApiImportInput

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:112:1`

### Members

| Name        | Kind     | Type                             | Required | Description |
| ----------- | -------- | -------------------------------- | -------- | ----------- |
| baseUrl     | property | `string \| undefined`            | no       |             |
| credential  | property | `CredentialRef \| undefined`     | no       |             |
| description | property | `string \| undefined`            | no       |             |
| document    | property | `OpenApiDocumentObject`          | yes      |             |
| documentId  | property | `string \| undefined`            | no       |             |
| documentUrl | property | `string \| undefined`            | no       |             |
| id          | property | `string`                         | yes      |             |
| metadata    | property | `DataContractValue \| undefined` | no       |             |
| name        | property | `string \| undefined`            | no       |             |

## OpenApiImportResult

Kind: `unknown`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:124:1`

## OpenApiMediaTypeObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:58:1`

### Members

| Name   | Kind     | Type                               | Required | Description |
| ------ | -------- | ---------------------------------- | -------- | ----------- |
| schema | property | `OpenApiSchemaObject \| undefined` | no       |             |

## OpenApiOperationObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:81:1`

### Members

| Name        | Kind     | Type                                                           | Required | Description |
| ----------- | -------- | -------------------------------------------------------------- | -------- | ----------- |
| deprecated  | property | `boolean \| undefined`                                         | no       |             |
| description | property | `string \| undefined`                                          | no       |             |
| operationId | property | `string \| undefined`                                          | no       |             |
| parameters  | property | `readonly OpenApiParameterObject[] \| undefined`               | no       |             |
| requestBody | property | `OpenApiRequestBodyObject \| undefined`                        | no       |             |
| responses   | property | `Readonly<Record<string, OpenApiResponseObject>> \| undefined` | no       |             |
| summary     | property | `string \| undefined`                                          | no       |             |

## OpenApiParameterObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:73:1`

### Members

| Name        | Kind     | Type                               | Required | Description |
| ----------- | -------- | ---------------------------------- | -------- | ----------- |
| description | property | `string \| undefined`              | no       |             |
| in          | property | `string`                           | yes      |             |
| name        | property | `string`                           | yes      |             |
| required    | property | `boolean \| undefined`             | no       |             |
| schema      | property | `OpenApiSchemaObject \| undefined` | no       |             |

## OpenApiPathItemObject

Kind: `unknown`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:91:1`

## OpenApiRequestBodyObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:62:1`

### Members

| Name        | Kind     | Type                                                            | Required | Description |
| ----------- | -------- | --------------------------------------------------------------- | -------- | ----------- |
| content     | property | `Readonly<Record<string, OpenApiMediaTypeObject>> \| undefined` | no       |             |
| description | property | `string \| undefined`                                           | no       |             |
| required    | property | `boolean \| undefined`                                          | no       |             |

## OpenApiResponseObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:68:1`

### Members

| Name        | Kind     | Type                                                            | Required | Description |
| ----------- | -------- | --------------------------------------------------------------- | -------- | ----------- |
| content     | property | `Readonly<Record<string, OpenApiMediaTypeObject>> \| undefined` | no       |             |
| description | property | `string \| undefined`                                           | no       |             |

## OpenApiSchemaObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:39:1`

### Members

| Name                 | Kind     | Type                                                         | Required | Description |
| -------------------- | -------- | ------------------------------------------------------------ | -------- | ----------- |
| $ref                 | property | `string \| undefined`                                        | no       |             |
| additionalProperties | property | `boolean \| OpenApiSchemaObject \| undefined`                | no       |             |
| allOf                | property | `readonly OpenApiSchemaObject[] \| undefined`                | no       |             |
| anyOf                | property | `readonly OpenApiSchemaObject[] \| undefined`                | no       |             |
| const                | property | `DataContractValue \| undefined`                             | no       |             |
| default              | property | `DataContractValue \| undefined`                             | no       |             |
| description          | property | `string \| undefined`                                        | no       |             |
| enum                 | property | `readonly DataContractValue[] \| undefined`                  | no       |             |
| format               | property | `string \| undefined`                                        | no       |             |
| items                | property | `OpenApiSchemaObject \| undefined`                           | no       |             |
| nullable             | property | `boolean \| undefined`                                       | no       |             |
| oneOf                | property | `readonly OpenApiSchemaObject[] \| undefined`                | no       |             |
| properties           | property | `Readonly<Record<string, OpenApiSchemaObject>> \| undefined` | no       |             |
| required             | property | `readonly string[] \| undefined`                             | no       |             |
| title                | property | `string \| undefined`                                        | no       |             |
| type                 | property | `string \| readonly string[] \| undefined`                   | no       |             |

## OpenApiServerObject

Kind: `type`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:34:1`

### Members

| Name        | Kind     | Type                  | Required | Description |
| ----------- | -------- | --------------------- | -------- | ----------- |
| description | property | `string \| undefined` | no       |             |
| url         | property | `string`              | yes      |             |

## SUPPORTED_API_ORIGINS

Kind: `value`
Module: `src/index.ts`
Source: `src/index.ts:20:14`

## SUPPORTED_API_PROTOCOLS

Kind: `value`
Module: `src/index.ts`
Source: `src/index.ts:24:14`

## SUPPORTED_DATA_SOURCE_KINDS

Kind: `value`
Module: `src/index.ts`
Source: `src/index.ts:16:14`

## testEndpoint

Kind: `function`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:91:1`

### Signatures

- `(input: EndpointTestInput) => Promise<EndpointTestResult>`
  - input: `EndpointTestInput`
  - returns: `Promise<EndpointTestResult>`

## validateGeneratedApiDefinition

Kind: `function`
Module: `src/generated-api/index.ts`
Source: `src/generated-api/index.ts:39:1`

### Signatures

- `(definition: GeneratedApiDefinition) => readonly DataSourceDiagnostic[]`
  - definition: `GeneratedApiDefinition`
  - returns: `readonly DataSourceDiagnostic[]`

## validateGraphQlDataSource

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:157:1`

### Signatures

- `(definition: GraphQlDataSourceDefinition) => readonly DataSourceDiagnostic[]`
  - definition: `GraphQlDataSourceDefinition`
  - returns: `readonly DataSourceDiagnostic[]`

## validateManualRestDataSource

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:86:1`

### Signatures

- `(definition: ManualRestDataSourceDefinition) => readonly DataSourceDiagnostic[]`
  - definition: `ManualRestDataSourceDefinition`
  - returns: `readonly DataSourceDiagnostic[]`
