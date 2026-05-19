# Public API

## createGraphQlDataSource

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:144:1`

### Signatures

- `(definition: GraphQlDataSourceDefinition) => DataSourceDiagnosticResult<GraphQlDataSourceConfig>`
  - definition: `GraphQlDataSourceDefinition`
  - returns: `DataSourceDiagnosticResult<GraphQlDataSourceConfig>`

## createGraphQlIntrospectionRequest

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:128:1`

### Signatures

- `() => GraphQlIntrospectionRequest`
  - returns: `GraphQlIntrospectionRequest`

## createManagedApiDataSource

Kind: `function`
Module: `src/managed-api/index.ts`
Source: `src/managed-api/index.ts:45:1`

### Signatures

- `(definition: ManagedApiGenerationDefinition) => DataSourceDiagnosticResult<ManagedApiDataSourceConfig>`
  - definition: `ManagedApiGenerationDefinition`
  - returns: `DataSourceDiagnosticResult<ManagedApiDataSourceConfig>`

## createManagedApiEndpoint

Kind: `function`
Module: `src/managed-api/index.ts`
Source: `src/managed-api/index.ts:151:1`

### Signatures

- `(definition: ManagedApiGenerationDefinition, resource: ManagedApiGenerationResourceDefinition, operations?: readonly ("list" | "read" | "create" | "update" | "delete")[]) => DataEndpointConfig`
  - definition: `ManagedApiGenerationDefinition`
  - operations: `readonly ("list" | "read" | "create" | "update" | "delete")[]` (optional)
  - resource: `ManagedApiGenerationResourceDefinition`
  - returns: `DataEndpointConfig`

## createManagedApiOperation

Kind: `function`
Module: `src/managed-api/index.ts`
Source: `src/managed-api/index.ts:176:1`

### Signatures

- `(definition: ManagedApiGenerationDefinition, resource: ManagedApiGenerationResourceDefinition, operation: "list" | "read" | "create" | "update" | "delete") => DataOperationConfig`
  - definition: `ManagedApiGenerationDefinition`
  - operation: `"list" | "read" | "create" | "update" | "delete"`
  - resource: `ManagedApiGenerationResourceDefinition`
  - returns: `DataOperationConfig`

## createManagedApiOperationId

Kind: `function`
Module: `src/managed-api/index.ts`
Source: `src/managed-api/index.ts:210:1`

### Signatures

- `(resourceName: string, operation: "list" | "read" | "create" | "update" | "delete") => string`
  - operation: `"list" | "read" | "create" | "update" | "delete"`
  - resourceName: `string`
  - returns: `string`

## createManagedApiResourceSchema

Kind: `function`
Module: `src/managed-api/index.ts`
Source: `src/managed-api/index.ts:217:1`

### Signatures

- `(collection: DbCollectionDefinition) => DataSchema`
  - collection: `DbCollectionDefinition`
  - returns: `DataSchema`

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
Source: `src/index.ts:8:14`

## DataSourcesPackageInfo

Kind: `type`
Module: `src/index.ts`
Source: `src/index.ts:18:1`

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
Source: `src/index.ts:34:1`

### Signatures

- `(source: DataSourceConfig) => DataSourceKind`
  - source: `DataSourceConfig`
  - returns: `DataSourceKind`

## getDataSourcesPackageInfo

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:23:1`

### Signatures

- `() => DataSourcesPackageInfo`
  - returns: `DataSourcesPackageInfo`

## getManagedApiOperations

Kind: `function`
Module: `src/managed-api/index.ts`
Source: `src/managed-api/index.ts:204:1`

### Signatures

- `(resource: ManagedApiGenerationResourceDefinition) => readonly ("list" | "read" | "create" | "update" | "delete")[]`
  - resource: `ManagedApiGenerationResourceDefinition`
  - returns: `readonly ("list" | "read" | "create" | "update" | "delete")[]`

## GRAPHQL_INTROSPECTION_QUERY

Kind: `value`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:16:14`

## GraphQlDataSourceDefinition

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:110:1`

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
Source: `src/graphql/index.ts:72:1`

### Members

| Name        | Kind     | Type                          | Required | Description |
| ----------- | -------- | ----------------------------- | -------- | ----------- |
| description | property | `string \| null \| undefined` | no       |             |
| name        | property | `string`                      | yes      |             |

## GraphQlIntrospectionField

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:65:1`

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
Source: `src/graphql/index.ts:58:1`

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
Source: `src/graphql/index.ts:123:1`

### Members

| Name          | Kind     | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Required | Description |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| operationName | property | `"AnkhorageGraphQlIntrospection"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | yes      |             |
| query         | property | `"query AnkhorageGraphQlIntrospection {\n  __schema {\n    queryType { name }\n    mutationType { name }\n    subscriptionType { name }\n    types {\n      kind\n      name\n      description\n      fields {\n        name\n        description\n        args {\n          name\n          description\n          type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }\n          defaultValue\n        }\n        type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }\n      }\n      inputFields {\n        name\n        description\n        type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }\n        defaultValue\n      }\n      enumValues { name description }\n      possibleTypes { kind name }\n    }\n  }\n}"` | yes      |             |

## GraphQlIntrospectionResult

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:94:1`

### Members

| Name       | Kind     | Type                                      | Required | Description |
| ---------- | -------- | ----------------------------------------- | -------- | ----------- |
| \_\_schema | property | `GraphQlIntrospectionSchema \| undefined` | no       |             |

## GraphQlIntrospectionSchema

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:87:1`

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
Source: `src/graphql/index.ts:77:1`

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
Source: `src/graphql/index.ts:52:1`

### Members

| Name   | Kind     | Type                                               | Required | Description |
| ------ | -------- | -------------------------------------------------- | -------- | ----------- |
| kind   | property | `string`                                           | yes      |             |
| name   | property | `string \| null \| undefined`                      | no       |             |
| ofType | property | `GraphQlIntrospectionTypeRef \| null \| undefined` | no       |             |

## GraphQlOperationDefinition

Kind: `type`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:98:1`

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
Source: `src/index.ts:30:1`

### Signatures

- `(kind: string) => boolean`
  - kind: `string`
  - returns: `boolean`

## MANAGED_API_CRUD_OPERATIONS

Kind: `value`
Module: `src/managed-api/index.ts`
Source: `src/managed-api/index.ts:21:14`

## ManagedApiCrudOperation

Kind: `unknown`
Module: `src/managed-api/index.ts`
Source: `src/managed-api/index.ts:23:1`

## ManagedApiGenerationDefinition

Kind: `type`
Module: `src/managed-api/index.ts`
Source: `src/managed-api/index.ts:37:1`

### Members

| Name        | Kind     | Type                                                | Required | Description |
| ----------- | -------- | --------------------------------------------------- | -------- | ----------- |
| adapter     | property | `AdapterRef`                                        | yes      |             |
| description | property | `string \| undefined`                               | no       |             |
| id          | property | `string`                                            | yes      |             |
| name        | property | `string \| undefined`                               | no       |             |
| resources   | property | `readonly ManagedApiGenerationResourceDefinition[]` | yes      |             |

## ManagedApiGenerationResourceDefinition

Kind: `type`
Module: `src/managed-api/index.ts`
Source: `src/managed-api/index.ts:30:1`

### Members

| Name       | Kind     | Type                                                                             | Required | Description |
| ---------- | -------- | -------------------------------------------------------------------------------- | -------- | ----------- |
| collection | property | `DbCollectionDefinition`                                                         | yes      |             |
| name       | property | `string`                                                                         | yes      |             |
| operations | property | `readonly ("list" \| "read" \| "create" \| "update" \| "delete")[] \| undefined` | no       |             |
| policies   | property | `readonly ManagedApiOperationPolicyRef[] \| undefined`                           | no       |             |

## ManagedApiOperationPolicyRef

Kind: `type`
Module: `src/managed-api/index.ts`
Source: `src/managed-api/index.ts:25:1`

### Members

| Name      | Kind     | Type                  | Required | Description |
| --------- | -------- | --------------------- | -------- | ----------- |
| id        | property | `string`              | yes      |             |
| operation | property | `string \| undefined` | no       |             |

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

## normalizeGraphQlDataSource

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:198:1`

### Signatures

- `(definition: GraphQlDataSourceDefinition) => GraphQlDataSourceConfig`
  - definition: `GraphQlDataSourceDefinition`
  - returns: `GraphQlDataSourceConfig`

## normalizeGraphQlIntrospectionOperations

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:256:1`

### Signatures

- `(introspection: GraphQlIntrospectionResult | undefined) => readonly GraphQlOperationDefinition[]`
  - introspection: `GraphQlIntrospectionResult | undefined`
  - returns: `readonly GraphQlOperationDefinition[]`

## normalizeGraphQlIntrospectionSchemas

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:240:1`

### Signatures

- `(introspection: GraphQlIntrospectionResult | undefined) => Readonly<Record<string, DataSchema>> | undefined`
  - introspection: `GraphQlIntrospectionResult | undefined`
  - returns: `Readonly<Record<string, DataSchema>> | undefined`

## normalizeGraphQlOperationId

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:135:1`

### Signatures

- `(kind: GraphQlOperationKind, name: string) => string`
  - kind: `GraphQlOperationKind`
  - name: `string`
  - returns: `string`

## normalizeManagedApiDataSource

Kind: `function`
Module: `src/managed-api/index.ts`
Source: `src/managed-api/index.ts:118:1`

### Signatures

- `(definition: ManagedApiGenerationDefinition) => ManagedApiDataSourceConfig`
  - definition: `ManagedApiGenerationDefinition`
  - returns: `ManagedApiDataSourceConfig`

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

| Name            | Kind     | Type                                                         | Required | Description |
| --------------- | -------- | ------------------------------------------------------------ | -------- | ----------- |
| schemas         | property | `Readonly<Record<string, OpenApiSchemaObject>> \| undefined` | no       |             |
| securitySchemes | property | `Readonly<Record<string, DataContractValue>> \| undefined`   | no       |             |

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

## SUPPORTED_DATA_SOURCE_KINDS

Kind: `value`
Module: `src/index.ts`
Source: `src/index.ts:10:14`

## validateGraphQlDataSource

Kind: `function`
Module: `src/graphql/index.ts`
Source: `src/graphql/index.ts:159:1`

### Signatures

- `(definition: GraphQlDataSourceDefinition) => readonly DataSourceDiagnostic[]`
  - definition: `GraphQlDataSourceDefinition`
  - returns: `readonly DataSourceDiagnostic[]`

## validateManagedApiDefinition

Kind: `function`
Module: `src/managed-api/index.ts`
Source: `src/managed-api/index.ts:60:1`

### Signatures

- `(definition: ManagedApiGenerationDefinition) => readonly DataSourceDiagnostic[]`
  - definition: `ManagedApiGenerationDefinition`
  - returns: `readonly DataSourceDiagnostic[]`

## validateManualRestDataSource

Kind: `function`
Module: `src/rest/index.ts`
Source: `src/rest/index.ts:86:1`

### Signatures

- `(definition: ManualRestDataSourceDefinition) => readonly DataSourceDiagnostic[]`
  - definition: `ManualRestDataSourceDefinition`
  - returns: `readonly DataSourceDiagnostic[]`
