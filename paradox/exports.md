# Public API

## buildEndpointTestRequest

Kind: `function`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:65:1`

### Signatures

- `(input: EndpointTestInput) => Promise<EndpointTestResult>`
  - input: `EndpointTestInput`
  - returns: `Promise<EndpointTestResult>`

## createGraphQlApi

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:66:1`

### Signatures

- `(definition: GraphQlApiDefinition) => DataSourceDiagnosticResult<ExternalGraphQlApiDefinition>`
  - definition: `GraphQlApiDefinition`
  - returns: `DataSourceDiagnosticResult<ExternalGraphQlApiDefinition>`

## createGraphQlIntrospectionRequest

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:59:1`

### Signatures

- `() => GraphQlIntrospectionRequest`
  - returns: `GraphQlIntrospectionRequest`

## createManualRestApi

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:121:1`

### Signatures

- `(definition: ManualRestApiDefinition) => DataSourceDiagnosticResult<ExternalRestApiDefinition>`
  - definition: `ManualRestApiDefinition`
  - returns: `DataSourceDiagnosticResult<ExternalRestApiDefinition>`

## createOpenApiDiscoveryCandidates

Kind: `function`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:110:1`

### Signatures

- `(rawUrl: string, conventionalPaths?: readonly string[]) => readonly string[]`
  - conventionalPaths: `readonly string[]` (optional)
  - rawUrl: `string`
  - returns: `readonly string[]`

## DATA_SOURCES_PACKAGE_NAME

Kind: `value`
Module: `src/packageInfo.ts`
Source: `src/packageInfo.ts:8:14`

## DataSourcesPackageInfo

Kind: `type`
Module: `src/packageInfo.ts`
Source: `src/packageInfo.ts:20:1`

### Members

| Name                  | Kind     | Type                           | Required | Description |
| --------------------- | -------- | ------------------------------ | -------- | ----------- |
| packageName           | property | `"@ankhorage/data-sources"`    | yes      |             |
| supportedApiOrigins   | property | `readonly ["external"]`        | yes      |             |
| supportedApiProtocols | property | `readonly ["graphql", "rest"]` | yes      |             |
| supportedKinds        | property | `readonly ["database"]`        | yes      |             |

## DEFAULT_OPENAPI_DISCOVERY_PATHS

Kind: `value`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:23:14`

## discoverOpenApi

Kind: `function`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:131:1`

### Signatures

- `(input: DiscoverOpenApiInput) => Promise<DiscoverOpenApiResult>`
  - input: `DiscoverOpenApiInput`
  - returns: `Promise<DiscoverOpenApiResult>`

## DiscoverOpenApiInput

Kind: `type`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:60:1`

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

## DiscoverOpenApiResult

Kind: `unknown`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:72:1`

## EndpointTestCredential

Kind: `type`
Module: `src/test-runner/types.ts`
Source: `src/test-runner/types.ts:13:1`

### Members

| Name    | Kind     | Type                                                       | Required | Description |
| ------- | -------- | ---------------------------------------------------------- | -------- | ----------- |
| headers | property | `Readonly<Record<string, string>> \| undefined`            | no       |             |
| query   | property | `Readonly<Record<string, DataContractValue>> \| undefined` | no       |             |

## EndpointTestCredentialResolver

Kind: `unknown`
Module: `src/test-runner/types.ts`
Source: `src/test-runner/types.ts:18:1`

## EndpointTestFetch

Kind: `unknown`
Module: `src/test-runner/types.ts`
Source: `src/test-runner/types.ts:34:1`

## EndpointTestFetchInit

Kind: `type`
Module: `src/test-runner/types.ts`
Source: `src/test-runner/types.ts:22:1`

### Members

| Name    | Kind     | Type                               | Required | Description |
| ------- | -------- | ---------------------------------- | -------- | ----------- |
| body    | property | `string \| undefined`              | no       |             |
| headers | property | `Readonly<Record<string, string>>` | yes      |             |
| method  | property | `string`                           | yes      |             |

## EndpointTestFetchResponse

Kind: `type`
Module: `src/test-runner/types.ts`
Source: `src/test-runner/types.ts:28:1`

### Members

| Name    | Kind     | Type                                            | Required | Description |
| ------- | -------- | ----------------------------------------------- | -------- | ----------- |
| headers | property | `Readonly<Record<string, string>> \| undefined` | no       |             |
| status  | property | `number`                                        | yes      |             |
| text    | method   | `() => Promise<string>`                         | yes      |             |

## EndpointTestHeaders

Kind: `unknown`
Module: `src/test-runner/types.ts`
Source: `src/test-runner/types.ts:11:1`

## EndpointTestInput

Kind: `type`
Module: `src/test-runner/types.ts`
Source: `src/test-runner/types.ts:39:1`

### Members

| Name               | Kind     | Type                                                       | Required | Description |
| ------------------ | -------- | ---------------------------------------------------------- | -------- | ----------- |
| api                | property | `ApiDefinition`                                            | yes      |             |
| credentialResolver | property | `EndpointTestCredentialResolver \| undefined`              | no       |             |
| dryRun             | property | `boolean \| undefined`                                     | no       |             |
| endpointId         | property | `string`                                                   | yes      |             |
| fetch              | property | `EndpointTestFetch \| undefined`                           | no       |             |
| operationId        | property | `string`                                                   | yes      |             |
| values             | property | `Readonly<Record<string, DataContractValue>> \| undefined` | no       |             |

## EndpointTestInputValues

Kind: `unknown`
Module: `src/test-runner/types.ts`
Source: `src/test-runner/types.ts:10:1`

## EndpointTestRequestDiagnostic

Kind: `type`
Module: `src/test-runner/types.ts`
Source: `src/test-runner/types.ts:49:1`

### Members

| Name        | Kind     | Type                               | Required | Description |
| ----------- | -------- | ---------------------------------- | -------- | ----------- |
| apiId       | property | `string`                           | yes      |             |
| body        | property | `string \| undefined`              | no       |             |
| dryRun      | property | `boolean`                          | yes      |             |
| endpointId  | property | `string`                           | yes      |             |
| headers     | property | `Readonly<Record<string, string>>` | yes      |             |
| method      | property | `string`                           | yes      |             |
| operationId | property | `string`                           | yes      |             |
| url         | property | `string`                           | yes      |             |

## EndpointTestResponseDiagnostic

Kind: `type`
Module: `src/test-runner/types.ts`
Source: `src/test-runner/types.ts:60:1`

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
Module: `src/test-runner/types.ts`
Source: `src/test-runner/types.ts:68:1`

## ExternalApiFetch

Kind: `unknown`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:41:1`

## ExternalApiFetchInit

Kind: `type`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:30:1`

### Members

| Name    | Kind     | Type                               | Required | Description |
| ------- | -------- | ---------------------------------- | -------- | ----------- |
| body    | property | `string \| undefined`              | no       |             |
| headers | property | `Readonly<Record<string, string>>` | yes      |             |
| method  | property | `"GET" \| "POST"`                  | yes      |             |

## ExternalApiFetchResponse

Kind: `type`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:36:1`

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
Module: `src/packageInfo.ts`
Source: `src/packageInfo.ts:48:1`

### Signatures

- `(source: import("@ankhorage/contracts/dist/data/sources").DatabaseDataSourceConfig) => "database"`
  - source: `import("@ankhorage/contracts/dist/data/sources").DatabaseDataSourceConfig`
  - returns: `"database"`

## getDataSourcesPackageInfo

Kind: `function`
Module: `src/packageInfo.ts`
Source: `src/packageInfo.ts:27:1`

### Signatures

- `() => DataSourcesPackageInfo`
  - returns: `DataSourcesPackageInfo`

## GRAPHQL_INTROSPECTION_QUERY

Kind: `value`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:22:14`

## GraphQlApiDefinition

Kind: `type`
Module: `src/graphql/types.ts`
Source: `src/graphql/types.ts:68:1`

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
Module: `src/graphql/types.ts`
Source: `src/graphql/types.ts:30:1`

### Members

| Name        | Kind     | Type                          | Required | Description |
| ----------- | -------- | ----------------------------- | -------- | ----------- |
| description | property | `string \| null \| undefined` | no       |             |
| name        | property | `string`                      | yes      |             |

## GraphQlIntrospectionField

Kind: `type`
Module: `src/graphql/types.ts`
Source: `src/graphql/types.ts:23:1`

### Members

| Name        | Kind     | Type                                                             | Required | Description |
| ----------- | -------- | ---------------------------------------------------------------- | -------- | ----------- |
| args        | property | `readonly GraphQlIntrospectionInputValue[] \| null \| undefined` | no       |             |
| description | property | `string \| null \| undefined`                                    | no       |             |
| name        | property | `string`                                                         | yes      |             |
| type        | property | `GraphQlIntrospectionTypeRef`                                    | yes      |             |

## GraphQlIntrospectionInputValue

Kind: `type`
Module: `src/graphql/types.ts`
Source: `src/graphql/types.ts:16:1`

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
Source: `src/graphql/index.ts:54:1`

### Members

| Name          | Kind     | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Required | Description |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| operationName | property | `"AnkhorageGraphQlIntrospection"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | yes      |             |
| query         | property | `"query AnkhorageGraphQlIntrospection {\n  __schema {\n    queryType { name }\n    mutationType { name }\n    subscriptionType { name }\n    types {\n      kind\n      name\n      description\n      fields {\n        name\n        description\n        args {\n          name\n          description\n          type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }\n          defaultValue\n        }\n        type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }\n      }\n      inputFields {\n        name\n        description\n        type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }\n        defaultValue\n      }\n      enumValues { name description }\n      possibleTypes { kind name }\n    }\n  }\n}"` | yes      |             |

## GraphQlIntrospectionResult

Kind: `type`
Module: `src/graphql/types.ts`
Source: `src/graphql/types.ts:52:1`

### Members

| Name       | Kind     | Type                                      | Required | Description |
| ---------- | -------- | ----------------------------------------- | -------- | ----------- |
| \_\_schema | property | `GraphQlIntrospectionSchema \| undefined` | no       |             |

## GraphQlIntrospectionSchema

Kind: `type`
Module: `src/graphql/types.ts`
Source: `src/graphql/types.ts:45:1`

### Members

| Name             | Kind     | Type                                                       | Required | Description |
| ---------------- | -------- | ---------------------------------------------------------- | -------- | ----------- |
| mutationType     | property | `{ readonly name?: string \| null; } \| null \| undefined` | no       |             |
| queryType        | property | `{ readonly name?: string \| null; } \| null \| undefined` | no       |             |
| subscriptionType | property | `{ readonly name?: string \| null; } \| null \| undefined` | no       |             |
| types            | property | `readonly GraphQlIntrospectionType[] \| null \| undefined` | no       |             |

## GraphQlIntrospectionType

Kind: `type`
Module: `src/graphql/types.ts`
Source: `src/graphql/types.ts:35:1`

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
Module: `src/graphql/types.ts`
Source: `src/graphql/types.ts:10:1`

### Members

| Name   | Kind     | Type                                               | Required | Description |
| ------ | -------- | -------------------------------------------------- | -------- | ----------- |
| kind   | property | `string`                                           | yes      |             |
| name   | property | `string \| null \| undefined`                      | no       |             |
| ofType | property | `GraphQlIntrospectionTypeRef \| null \| undefined` | no       |             |

## GraphQlOperationDefinition

Kind: `type`
Module: `src/graphql/types.ts`
Source: `src/graphql/types.ts:56:1`

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
Module: `src/graphql/types.ts`
Source: `src/graphql/types.ts:8:1`

## importOpenApiDocument

Kind: `function`
Module: `src/openapi/index.ts`
Source: `src/openapi/index.ts:18:1`

### Signatures

- `(input: OpenApiImportInput) => OpenApiImportResult`
  - input: `OpenApiImportInput`
  - returns: `OpenApiImportResult`

## introspectGraphQlApi

Kind: `function`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:160:1`

### Signatures

- `(input: IntrospectGraphQlApiInput) => Promise<IntrospectGraphQlApiResult>`
  - input: `IntrospectGraphQlApiInput`
  - returns: `Promise<IntrospectGraphQlApiResult>`

## IntrospectGraphQlApiInput

Kind: `type`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:86:1`

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

## IntrospectGraphQlApiResult

Kind: `unknown`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:98:1`

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
Module: `src/packageInfo.ts`
Source: `src/packageInfo.ts:40:1`

### Signatures

- `(origin: string) => boolean`
  - origin: `string`
  - returns: `boolean`

## isSupportedApiProtocol

Kind: `function`
Module: `src/packageInfo.ts`
Source: `src/packageInfo.ts:44:1`

### Signatures

- `(protocol: string) => boolean`
  - protocol: `string`
  - returns: `boolean`

## isSupportedDataSourceKind

Kind: `function`
Module: `src/packageInfo.ts`
Source: `src/packageInfo.ts:36:1`

### Signatures

- `(kind: string) => boolean`
  - kind: `string`
  - returns: `boolean`

## ManualRestApiDefinition

Kind: `type`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:49:1`

### Members

| Name        | Kind     | Type                                                                                                 | Required | Description |
| ----------- | -------- | ---------------------------------------------------------------------------------------------------- | -------- | ----------- |
| baseUrl     | property | `string`                                                                                             | yes      |             |
| credential  | property | `CredentialRef \| undefined`                                                                         | no       |             |
| description | property | `string \| undefined`                                                                                | no       |             |
| endpoints   | property | `readonly ManualRestEndpointDefinition[]`                                                            | yes      |             |
| id          | property | `string`                                                                                             | yes      |             |
| metadata    | property | `DataContractValue \| undefined`                                                                     | no       |             |
| name        | property | `string \| undefined`                                                                                | no       |             |
| schemas     | property | `Readonly<Record<string, import("@ankhorage/contracts/dist/data/schemas").DataSchema>> \| undefined` | no       |             |

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

## normalizeGraphQlApi

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:112:1`

### Signatures

- `(definition: GraphQlApiDefinition) => ExternalGraphQlApiDefinition`
  - definition: `GraphQlApiDefinition`
  - returns: `ExternalGraphQlApiDefinition`

## normalizeGraphQlIntrospectionOperations

Kind: `function`
Module: `src/graphql/introspection.ts`
Source: `src/graphql/introspection.ts:27:1`

### Signatures

- `(introspection: GraphQlIntrospectionResult | undefined) => readonly GraphQlOperationDefinition[]`
  - introspection: `GraphQlIntrospectionResult | undefined`
  - returns: `readonly GraphQlOperationDefinition[]`

## normalizeGraphQlIntrospectionSchemas

Kind: `function`
Module: `src/graphql/introspection.ts`
Source: `src/graphql/introspection.ts:15:1`

### Signatures

- `(introspection: GraphQlIntrospectionResult | undefined) => Readonly<Record<string, DataSchema>> | undefined`
  - introspection: `GraphQlIntrospectionResult | undefined`
  - returns: `Readonly<Record<string, DataSchema>> | undefined`

## normalizeGraphQlOperationId

Kind: `function`
Module: `src/graphql/operation.ts`
Source: `src/graphql/operation.ts:13:1`

### Signatures

- `(kind: GraphQlOperationKind, name: string) => string`
  - kind: `GraphQlOperationKind`
  - name: `string`
  - returns: `string`

## normalizeManualRestApi

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:136:1`

### Signatures

- `(definition: ManualRestApiDefinition) => ExternalRestApiDefinition`
  - definition: `ManualRestApiDefinition`
  - returns: `ExternalRestApiDefinition`

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
Module: `src/openapi/endpoints.ts`
Source: `src/openapi/endpoints.ts:26:1`

### Signatures

- `(path: string) => string`
  - path: `string`
  - returns: `string`

## normalizeOpenApiOperationId

Kind: `function`
Module: `src/openapi/operation.ts`
Source: `src/openapi/operation.ts:26:1`

### Signatures

- `(method: OpenApiHttpMethod, path: string, operationId?: string | undefined) => string`
  - method: `OpenApiHttpMethod`
  - operationId: `string | undefined` (optional)
  - path: `string`
  - returns: `string`

## normalizeOpenApiSchema

Kind: `function`
Module: `src/openapi/schema.ts`
Source: `src/openapi/schema.ts:20:1`

### Signatures

- `(schema: OpenApiSchemaObject) => DataSchema`
  - schema: `OpenApiSchemaObject`
  - returns: `DataSchema`

## OpenApiComponentsObject

Kind: `type`
Module: `src/openapi/types.ts`
Source: `src/openapi/types.ts:66:1`

### Members

| Name            | Kind     | Type                                                         | Required | Description |
| --------------- | -------- | ------------------------------------------------------------ | -------- | ----------- |
| schemas         | property | `Readonly<Record<string, OpenApiSchemaObject>> \| undefined` | no       |             |
| securitySchemes | property | `Readonly<Record<string, DataContractValue>> \| undefined`   | no       |             |

## OpenApiDiscoveryAttempt

Kind: `type`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:54:1`

### Members

| Name    | Kind     | Type                             | Required | Description |
| ------- | -------- | -------------------------------- | -------- | ----------- |
| outcome | property | `OpenApiDiscoveryAttemptOutcome` | yes      |             |
| status  | property | `number \| undefined`            | no       |             |
| url     | property | `string`                         | yes      |             |

## OpenApiDiscoveryAttemptOutcome

Kind: `unknown`
Module: `src/discovery/index.ts`
Source: `src/discovery/index.ts:46:1`

## OpenApiDocumentObject

Kind: `type`
Module: `src/openapi/types.ts`
Source: `src/openapi/types.ts:71:1`

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
Module: `src/openapi/types.ts`
Source: `src/openapi/types.ts:3:1`

## OpenApiImportInput

Kind: `type`
Module: `src/openapi/types.ts`
Source: `src/openapi/types.ts:83:1`

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
Source: `src/openapi/index.ts:16:1`

## OpenApiMediaTypeObject

Kind: `type`
Module: `src/openapi/types.ts`
Source: `src/openapi/types.ts:29:1`

### Members

| Name   | Kind     | Type                               | Required | Description |
| ------ | -------- | ---------------------------------- | -------- | ----------- |
| schema | property | `OpenApiSchemaObject \| undefined` | no       |             |

## OpenApiOperationObject

Kind: `type`
Module: `src/openapi/types.ts`
Source: `src/openapi/types.ts:52:1`

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
Module: `src/openapi/types.ts`
Source: `src/openapi/types.ts:44:1`

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
Module: `src/openapi/types.ts`
Source: `src/openapi/types.ts:62:1`

## OpenApiRequestBodyObject

Kind: `type`
Module: `src/openapi/types.ts`
Source: `src/openapi/types.ts:33:1`

### Members

| Name        | Kind     | Type                                                            | Required | Description |
| ----------- | -------- | --------------------------------------------------------------- | -------- | ----------- |
| content     | property | `Readonly<Record<string, OpenApiMediaTypeObject>> \| undefined` | no       |             |
| description | property | `string \| undefined`                                           | no       |             |
| required    | property | `boolean \| undefined`                                          | no       |             |

## OpenApiResponseObject

Kind: `type`
Module: `src/openapi/types.ts`
Source: `src/openapi/types.ts:39:1`

### Members

| Name        | Kind     | Type                                                            | Required | Description |
| ----------- | -------- | --------------------------------------------------------------- | -------- | ----------- |
| content     | property | `Readonly<Record<string, OpenApiMediaTypeObject>> \| undefined` | no       |             |
| description | property | `string \| undefined`                                           | no       |             |

## OpenApiSchemaObject

Kind: `type`
Module: `src/openapi/types.ts`
Source: `src/openapi/types.ts:10:1`

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
Module: `src/openapi/types.ts`
Source: `src/openapi/types.ts:5:1`

### Members

| Name        | Kind     | Type                  | Required | Description |
| ----------- | -------- | --------------------- | -------- | ----------- |
| description | property | `string \| undefined` | no       |             |
| url         | property | `string`              | yes      |             |

## SUPPORTED_API_ORIGINS

Kind: `value`
Module: `src/packageInfo.ts`
Source: `src/packageInfo.ts:12:14`

## SUPPORTED_API_PROTOCOLS

Kind: `value`
Module: `src/packageInfo.ts`
Source: `src/packageInfo.ts:13:14`

## SUPPORTED_DATA_SOURCE_KINDS

Kind: `value`
Module: `src/packageInfo.ts`
Source: `src/packageInfo.ts:9:14`

## SupportedApiOrigin

Kind: `unknown`
Module: `src/packageInfo.ts`
Source: `src/packageInfo.ts:18:1`

## testEndpoint

Kind: `function`
Module: `src/test-runner/index.ts`
Source: `src/test-runner/index.ts:35:1`

### Signatures

- `(input: EndpointTestInput) => Promise<EndpointTestResult>`
  - input: `EndpointTestInput`
  - returns: `Promise<EndpointTestResult>`

## validateGraphQlApi

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:76:1`

### Signatures

- `(definition: GraphQlApiDefinition) => readonly DataSourceDiagnostic[]`
  - definition: `GraphQlApiDefinition`
  - returns: `readonly DataSourceDiagnostic[]`

## validateManualRestApi

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:86:1`

### Signatures

- `(definition: ManualRestApiDefinition) => readonly DataSourceDiagnostic[]`
  - definition: `ManualRestApiDefinition`
  - returns: `readonly DataSourceDiagnostic[]`
