import type {
  CredentialRef,
  DataContractValue,
  DataEndpointConfig,
  DataOperationConfig,
  DataOperationIntent,
  DataOperationMethod,
  DataOperationParameter,
  DataOperationParameterLocation,
  DataOperationRequest,
  DataOperationResponse,
  DataSchema,
  DataSchemaPrimitiveType,
  DataSchemaRegistry,
  DataSourceDiagnostic,
  DataSourceDiagnosticResult,
  EndpointId,
  OpenApiDataSourceConfig,
  OperationId,
} from '@ankhorage/contracts/data';

const OPENAPI_HTTP_METHODS = ['delete', 'get', 'head', 'options', 'patch', 'post', 'put'] as const;
const DATA_SCHEMA_PRIMITIVES = [
  'array',
  'boolean',
  'integer',
  'null',
  'number',
  'object',
  'string',
] as const satisfies readonly DataSchemaPrimitiveType[];

export type OpenApiHttpMethod = (typeof OPENAPI_HTTP_METHODS)[number];

export interface OpenApiServerObject {
  readonly url: string;
  readonly description?: string;
}

export interface OpenApiSchemaObject {
  readonly $ref?: string;
  readonly type?: string | readonly string[];
  readonly title?: string;
  readonly description?: string;
  readonly enum?: readonly DataContractValue[];
  readonly const?: DataContractValue;
  readonly default?: DataContractValue;
  readonly format?: string;
  readonly nullable?: boolean;
  readonly required?: readonly string[];
  readonly properties?: Readonly<Record<string, OpenApiSchemaObject>>;
  readonly additionalProperties?: boolean | OpenApiSchemaObject;
  readonly items?: OpenApiSchemaObject;
  readonly allOf?: readonly OpenApiSchemaObject[];
  readonly anyOf?: readonly OpenApiSchemaObject[];
  readonly oneOf?: readonly OpenApiSchemaObject[];
}

export interface OpenApiMediaTypeObject {
  readonly schema?: OpenApiSchemaObject;
}

export interface OpenApiRequestBodyObject {
  readonly description?: string;
  readonly required?: boolean;
  readonly content?: Readonly<Record<string, OpenApiMediaTypeObject>>;
}

export interface OpenApiResponseObject {
  readonly description?: string;
  readonly content?: Readonly<Record<string, OpenApiMediaTypeObject>>;
}

export interface OpenApiParameterObject {
  readonly name: string;
  readonly in: string;
  readonly required?: boolean;
  readonly description?: string;
  readonly schema?: OpenApiSchemaObject;
}

export interface OpenApiOperationObject {
  readonly operationId?: string;
  readonly summary?: string;
  readonly description?: string;
  readonly deprecated?: boolean;
  readonly parameters?: readonly OpenApiParameterObject[];
  readonly requestBody?: OpenApiRequestBodyObject;
  readonly responses?: Readonly<Record<string, OpenApiResponseObject>>;
}

export type OpenApiPathItemObject = Partial<Record<OpenApiHttpMethod, OpenApiOperationObject>> & {
  readonly parameters?: readonly OpenApiParameterObject[];
};

export interface OpenApiComponentsObject {
  readonly schemas?: Readonly<Record<string, OpenApiSchemaObject>>;
  readonly securitySchemes?: Readonly<Record<string, DataContractValue>>;
}

export interface OpenApiDocumentObject {
  readonly openapi?: string;
  readonly info?: {
    readonly title?: string;
    readonly version?: string;
    readonly description?: string;
  };
  readonly servers?: readonly OpenApiServerObject[];
  readonly paths?: Readonly<Record<string, OpenApiPathItemObject>>;
  readonly components?: OpenApiComponentsObject;
}

export interface OpenApiImportInput {
  readonly id: string;
  readonly document: OpenApiDocumentObject;
  readonly baseUrl?: string;
  readonly credential?: CredentialRef;
  readonly documentId?: string;
  readonly documentUrl?: string;
  readonly name?: string;
  readonly description?: string;
  readonly metadata?: DataContractValue;
}

export type OpenApiImportResult = DataSourceDiagnosticResult<OpenApiDataSourceConfig>;

export function importOpenApiDocument(input: OpenApiImportInput): OpenApiImportResult {
  const diagnostics: DataSourceDiagnostic[] = [];
  const baseUrl = resolveOpenApiBaseUrl(input, diagnostics);
  const schemas = normalizeOpenApiSchemas(input.document.components?.schemas, input.id, diagnostics);
  const endpoints = normalizeOpenApiEndpoints(input, baseUrl, diagnostics);
  const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');

  if (hasErrors) {
    return { ok: false, diagnostics };
  }

  return {
    ok: true,
    data: {
      id: input.id,
      kind: 'openapi',
      name: input.name ?? input.document.info?.title,
      description: input.description ?? input.document.info?.description,
      baseUrl,
      credential: input.credential,
      endpoints,
      schemas,
      import: {
        url: input.documentUrl,
        documentId: input.documentId,
        version: input.document.info?.version,
      },
      metadata: input.metadata,
    },
    diagnostics,
  };
}

export function normalizeOpenApiOperationId(
  method: OpenApiHttpMethod,
  path: string,
  operationId?: string,
): OperationId {
  const rawId = operationId ?? `${method}-${path}`;
  const normalized = rawId
    .replace(/\{([^}]+)\}/g, '$1')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return normalized.length > 0 ? normalized : `${method}-root`;
}

export function normalizeOpenApiEndpointId(path: string): EndpointId {
  const normalized = path
    .replace(/\{([^}]+)\}/g, '$1')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return normalized.length > 0 ? normalized : 'root';
}

export function normalizeOpenApiSchema(schema: OpenApiSchemaObject): DataSchema {
  const additionalProperties = normalizeAdditionalProperties(schema.additionalProperties);

  return {
    ref: normalizeOpenApiSchemaRef(schema.$ref),
    type: normalizeSchemaType(schema.type),
    title: schema.title,
    description: schema.description,
    enum: schema.enum,
    const: schema.const,
    default: schema.default,
    format: schema.format,
    nullable: schema.nullable,
    required: schema.required,
    properties: normalizeSchemaRecord(schema.properties),
    additionalProperties,
    items: schema.items === undefined ? undefined : normalizeOpenApiSchema(schema.items),
    allOf: normalizeSchemaList(schema.allOf),
    anyOf: normalizeSchemaList(schema.anyOf),
    oneOf: normalizeSchemaList(schema.oneOf),
  };
}

function resolveOpenApiBaseUrl(
  input: OpenApiImportInput,
  diagnostics: DataSourceDiagnostic[],
): string | undefined {
  if (input.baseUrl !== undefined) return input.baseUrl;

  const servers = input.document.servers ?? [];

  if (servers.length === 0) {
    diagnostics.push({
      code: 'ambiguous-server',
      dataSourceId: input.id,
      message: 'OpenAPI document does not define a server URL and no baseUrl override was provided.',
      path: 'servers',
      severity: 'warning',
    });
    return undefined;
  }

  if (servers.length > 1) {
    diagnostics.push({
      code: 'ambiguous-server',
      dataSourceId: input.id,
      message: 'OpenAPI document defines multiple servers. The first server URL was selected.',
      path: 'servers',
      severity: 'warning',
    });
  }

  return servers[0]?.url;
}

function normalizeOpenApiSchemas(
  schemas: Readonly<Record<string, OpenApiSchemaObject>> | undefined,
  dataSourceId: string,
  diagnostics: DataSourceDiagnostic[],
): DataSchemaRegistry | undefined {
  if (schemas === undefined) return undefined;

  const registry: Record<string, DataSchema> = {};

  for (const [schemaId, schema] of Object.entries(schemas)) {
    registry[schemaId] = normalizeOpenApiSchema(schema);
    collectUnsupportedSchemaDiagnostics(schema, dataSourceId, `components.schemas.${schemaId}`, diagnostics);
  }

  return registry;
}

function normalizeOpenApiEndpoints(
  input: OpenApiImportInput,
  baseUrl: string | undefined,
  diagnostics: DataSourceDiagnostic[],
): Record<EndpointId, DataEndpointConfig> {
  const paths = input.document.paths;

  if (paths === undefined || Object.keys(paths).length === 0) {
    diagnostics.push({
      code: 'invalid-config',
      dataSourceId: input.id,
      message: 'OpenAPI document must define at least one path.',
      path: 'paths',
      severity: 'error',
    });
    return {};
  }

  const endpoints: Record<EndpointId, DataEndpointConfig> = {};
  const operationIds = new Set<OperationId>();

  for (const [path, pathItem] of Object.entries(paths)) {
    const endpointId = normalizeOpenApiEndpointId(path);
    const operations: Record<OperationId, DataOperationConfig> = {};

    for (const method of OPENAPI_HTTP_METHODS) {
      const operation = pathItem[method];
      if (operation === undefined) continue;

      const operationId = resolveUniqueOperationId(
        input.id,
        endpointId,
        method,
        path,
        operation.operationId,
        operationIds,
        diagnostics,
      );
      const parameters = normalizeOpenApiParameters(
        [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])],
        input.id,
        endpointId,
        operationId,
        diagnostics,
      );
      const request = normalizeOpenApiRequest(operation.requestBody, parameters);
      const response = normalizeOpenApiResponse(operation.responses);

      operations[operationId] = {
        id: operationId,
        endpointId,
        name: operation.summary,
        description: operation.description,
        protocol: 'http',
        intent: mapOpenApiMethodToIntent(method),
        method: method.toUpperCase() as DataOperationMethod,
        path,
        request,
        response,
        metadata: {
          deprecated: operation.deprecated ?? false,
          source: 'openapi',
        },
      };
    }

    endpoints[endpointId] = {
      id: endpointId,
      kind: 'http',
      baseUrl,
      path,
      credential: input.credential,
      operations,
    };
  }

  return endpoints;
}

function resolveUniqueOperationId(
  dataSourceId: string,
  endpointId: EndpointId,
  method: OpenApiHttpMethod,
  path: string,
  operationId: string | undefined,
  operationIds: Set<OperationId>,
  diagnostics: DataSourceDiagnostic[],
): OperationId {
  const normalized = normalizeOpenApiOperationId(method, path, operationId);

  if (!operationIds.has(normalized)) {
    operationIds.add(normalized);
    return normalized;
  }

  let suffix = 2;
  let uniqueId: OperationId = `${normalized}-${suffix}`;

  while (operationIds.has(uniqueId)) {
    suffix += 1;
    uniqueId = `${normalized}-${suffix}`;
  }

  operationIds.add(uniqueId);
  diagnostics.push({
    code: 'duplicate-operation-id',
    dataSourceId,
    endpointId,
    operationId: uniqueId,
    message: `OpenAPI operation id '${normalized}' is duplicated. Normalized to '${uniqueId}'.`,
    path: `paths.${path}.${method}.operationId`,
    severity: 'warning',
  });

  return uniqueId;
}

function normalizeOpenApiParameters(
  parameters: readonly OpenApiParameterObject[],
  dataSourceId: string,
  endpointId: EndpointId,
  operationId: OperationId,
  diagnostics: DataSourceDiagnostic[],
): readonly DataOperationParameter[] | undefined {
  if (parameters.length === 0) return undefined;

  const normalized: DataOperationParameter[] = [];

  for (const parameter of parameters) {
    const location = normalizeParameterLocation(parameter.in);

    if (location === undefined) {
      diagnostics.push({
        code: 'invalid-config',
        dataSourceId,
        endpointId,
        operationId,
        message: `OpenAPI parameter '${parameter.name}' uses unsupported location '${parameter.in}'.`,
        path: `paths.${endpointId}.parameters.${parameter.name}`,
        severity: 'warning',
      });
      continue;
    }

    normalized.push({
      name: parameter.name,
      location,
      required: parameter.required,
      description: parameter.description,
      schema: parameter.schema === undefined ? undefined : normalizeOpenApiSchema(parameter.schema),
    });
  }

  return normalized;
}

function normalizeParameterLocation(location: string): DataOperationParameterLocation | undefined {
  if (location === 'cookie' || location === 'header' || location === 'path' || location === 'query') {
    return location;
  }

  return undefined;
}

function normalizeOpenApiRequest(
  requestBody: OpenApiRequestBodyObject | undefined,
  parameters: readonly DataOperationParameter[] | undefined,
): DataOperationRequest | undefined {
  const content = firstContentEntry(requestBody?.content);

  if (requestBody === undefined && parameters === undefined) return undefined;

  return {
    contentType: content?.contentType,
    parameters,
    schema: content?.schema === undefined ? undefined : normalizeOpenApiSchema(content.schema),
  };
}

function normalizeOpenApiResponse(
  responses: Readonly<Record<string, OpenApiResponseObject>> | undefined): DataOperationResponse | undefined {
  if (responses === undefined) return undefined;

  const status = chooseResponseStatus(Object.keys(responses));
  if (status === undefined) return undefined;

  const response = responses[status];
  const content = firstContentEntry(response?.content);

  return {
    status,
    contentType: content?.contentType,
    description: response?.description,
    schema: content?.schema === undefined ? undefined : normalizeOpenApiSchema(content.schema),
  };
}

function firstContentEntry(
  content: Readonly<Record<string, OpenApiMediaTypeObject>> | undefined,
): { readonly contentType: string; readonly schema?: OpenApiSchemaObject } | undefined {
  if (content === undefined) return undefined;

  const [entry] = Object.entries(content);
  if (entry === undefined) return undefined;

  const [contentType, media] = entry;
  return { contentType, schema: media.schema };
}

function chooseResponseStatus(statuses: readonly string[]): string | undefined {
  return statuses.find((status) => status.startsWith('2')) ?? statuses[0];
}

function mapOpenApiMethodToIntent(method: OpenApiHttpMethod): DataOperationIntent {
  if (method === 'get' || method === 'head') return 'read';
  if (method === 'post') return 'create';
  if (method === 'delete') return 'delete';
  if (method === 'patch' || method === 'put') return 'update';
  return 'action';
}

function normalizeOpenApiSchemaRef(ref: string | undefined): { readonly id: string } | undefined {
  if (ref === undefined) return undefined;

  const prefix = '#/components/schemas/';
  if (ref.startsWith(prefix)) return { id: ref.slice(prefix.length) };

  return { id: ref };
}

function normalizeSchemaRecord(
  record: Readonly<Record<string, OpenApiSchemaObject>> | undefined,
): Readonly<Record<string, DataSchema>> | undefined {
  if (record === undefined) return undefined;

  const normalized: Record<string, DataSchema> = {};

  for (const [key, schema] of Object.entries(record)) {
    normalized[key] = normalizeOpenApiSchema(schema);
  }

  return normalized;
}

function normalizeSchemaList(list: readonly OpenApiSchemaObject[] | undefined): readonly DataSchema[] | undefined {
  return list?.map((schema) => normalizeOpenApiSchema(schema));
}

function normalizeAdditionalProperties(
  additionalProperties: boolean | OpenApiSchemaObject | undefined,
): boolean | DataSchema | undefined {
  if (additionalProperties === undefined || typeof additionalProperties === 'boolean') {
    return additionalProperties;
  }

  return normalizeOpenApiSchema(additionalProperties);
}

function normalizeSchemaType(
  type: string | readonly string[] | undefined,
): DataSchemaPrimitiveType | readonly DataSchemaPrimitiveType[] | undefined {
  if (type === undefined) return undefined;

  if (typeof type === 'string') {
    return isDataSchemaPrimitive(type) ? type : undefined;
  }

  return type.filter(isDataSchemaPrimitive);
}

function isDataSchemaPrimitive(type: string): type is DataSchemaPrimitiveType {
  return DATA_SCHEMA_PRIMITIVES.some((primitive) => primitive === type);
}

function collectUnsupportedSchemaDiagnostics(
  schema: OpenApiSchemaObject,
  dataSourceId: string,
  path: string,
  diagnostics: DataSourceDiagnostic[],
): void {
  if (typeof schema.type === 'string' && !isDataSchemaPrimitive(schema.type)) {
    diagnostics.push({
      code: 'unsupported-schema',
      dataSourceId,
      message: `OpenAPI schema type '${schema.type}' is not supported by the normalized schema model.`,
      path: `${path}.type`,
      severity: 'warning',
    });
  }

  for (const [propertyName, propertySchema] of Object.entries(schema.properties ?? {})) {
    collectUnsupportedSchemaDiagnostics(
      propertySchema,
      dataSourceId,
      `${path}.properties.${propertyName}`,
      diagnostics,
    );
  }

  if (schema.items !== undefined) {
    collectUnsupportedSchemaDiagnostics(schema.items, dataSourceId, `${path}.items`, diagnostics);
  }
}
