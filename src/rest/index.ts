import type {
  CredentialRef,
  DataContractValue,
  DataEndpointConfig,
  DataOperationConfig,
  DataOperationIntent,
  DataOperationMethod,
  DataOperationPagination,
  DataOperationParameter,
  DataOperationRequest,
  DataOperationResponse,
  DataSchemaRegistry,
  DataSourceDiagnostic,
  DataSourceDiagnosticResult,
  EndpointId,
  ExternalRestApiDefinition,
  OperationId,
} from '@ankhorage/contracts/data';

const REST_METHODS = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'] as const;

export type ManualRestMethod = (typeof REST_METHODS)[number];

export interface ManualRestOperationDefinition {
  readonly id: OperationId;
  readonly intent: DataOperationIntent;
  readonly method: string;
  readonly name?: string;
  readonly description?: string;
  readonly path?: string;
  readonly credential?: CredentialRef;
  readonly parameters?: readonly DataOperationParameter[];
  readonly request?: DataOperationRequest;
  readonly response?: DataOperationResponse;
  readonly pagination?: DataOperationPagination;
  readonly metadata?: DataContractValue;
}

export interface ManualRestEndpointDefinition {
  readonly id: EndpointId;
  readonly path: string;
  readonly name?: string;
  readonly description?: string;
  readonly credential?: CredentialRef;
  readonly operations: readonly ManualRestOperationDefinition[];
  readonly metadata?: DataContractValue;
}

export interface ManualRestApiDefinition {
  readonly id: string;
  readonly baseUrl: string;
  readonly name?: string;
  readonly description?: string;
  readonly credential?: CredentialRef;
  readonly endpoints: readonly ManualRestEndpointDefinition[];
  readonly schemas?: DataSchemaRegistry;
  readonly metadata?: DataContractValue;
}

export function isManualRestMethod(method: string): method is ManualRestMethod {
  return REST_METHODS.some((restMethod) => restMethod === method);
}

export function normalizeManualRestMethod(method: string): DataOperationMethod {
  return method.toUpperCase();
}

export function extractRestPathParams(path: string): readonly string[] {
  const params = new Set<string>();
  const bracedParamPattern = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
  const colonParamPattern = /(^|\/):([A-Za-z_][A-Za-z0-9_]*)/g;

  for (const match of path.matchAll(bracedParamPattern)) {
    const [, param] = match;
    if (param !== undefined) params.add(param);
  }

  for (const match of path.matchAll(colonParamPattern)) {
    const [, , param] = match;
    if (param !== undefined) params.add(param);
  }

  return [...params];
}

export function validateManualRestApi(
  definition: ManualRestApiDefinition,
): readonly DataSourceDiagnostic[] {
  const diagnostics: DataSourceDiagnostic[] = [];

  if (definition.baseUrl.trim().length === 0) {
    diagnostics.push({
      code: 'invalid-config',
      apiId: definition.id,
      message: 'Manual REST API requires a non-empty baseUrl.',
      path: 'baseUrl',
      severity: 'error',
    });
  }

  for (const endpoint of definition.endpoints) {
    if (!endpoint.path.startsWith('/')) {
      diagnostics.push({
        code: 'invalid-config',
        apiId: definition.id,
        endpointId: endpoint.id,
        message: 'Manual REST endpoint paths must start with `/`.',
        path: `endpoints.${endpoint.id}.path`,
        severity: 'error',
      });
    }

    for (const operation of endpoint.operations) {
      validateManualRestOperation(definition, endpoint, operation, diagnostics);
    }
  }

  return diagnostics;
}

export function createManualRestApi(
  definition: ManualRestApiDefinition,
): DataSourceDiagnosticResult<ExternalRestApiDefinition> {
  const diagnostics = validateManualRestApi(definition);
  if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return { ok: false, diagnostics };
  }

  return {
    ok: true,
    data: normalizeManualRestApi(definition),
    diagnostics,
  };
}

export function normalizeManualRestApi(
  definition: ManualRestApiDefinition,
): ExternalRestApiDefinition {
  const endpoints = Object.fromEntries(
    definition.endpoints.map((endpoint) => [endpoint.id, normalizeManualRestEndpoint(endpoint)]),
  );

  return {
    id: definition.id,
    origin: 'external',
    protocol: 'rest',
    name: definition.name,
    description: definition.description,
    baseUrl: definition.baseUrl,
    credential: definition.credential,
    endpoints,
    schemas: definition.schemas,
    metadata: definition.metadata,
  };
}

function normalizeManualRestEndpoint(endpoint: ManualRestEndpointDefinition): DataEndpointConfig {
  const operations = Object.fromEntries(
    endpoint.operations.map((operation) => [
      operation.id,
      normalizeManualRestOperation(endpoint, operation),
    ]),
  );
  return {
    id: endpoint.id,
    kind: 'http',
    name: endpoint.name,
    description: endpoint.description,
    path: endpoint.path,
    credential: endpoint.credential,
    operations,
    metadata: endpoint.metadata,
  };
}

function normalizeManualRestOperation(
  endpoint: ManualRestEndpointDefinition,
  operation: ManualRestOperationDefinition,
): DataOperationConfig {
  const { parameters } = operation;
  const request: DataOperationRequest | undefined =
    operation.request === undefined && parameters === undefined
      ? undefined
      : { ...operation.request, parameters };
  return {
    id: operation.id,
    endpointId: endpoint.id,
    name: operation.name,
    description: operation.description,
    protocol: 'http',
    intent: operation.intent,
    method: normalizeManualRestMethod(operation.method),
    path: operation.path ?? endpoint.path,
    request,
    response: operation.response,
    pagination: operation.pagination,
    credential: operation.credential,
    metadata: operation.metadata,
  };
}

function validateManualRestOperation(
  definition: ManualRestApiDefinition,
  endpoint: ManualRestEndpointDefinition,
  operation: ManualRestOperationDefinition,
  diagnostics: DataSourceDiagnostic[],
): void {
  const method = normalizeManualRestMethod(operation.method);
  const path = operation.path ?? endpoint.path;
  const templateParams = extractRestPathParams(path);
  const pathParameters =
    operation.parameters?.filter((parameter) => parameter.location === 'path') ?? [];
  const pathParameterNames = new Set(pathParameters.map((parameter) => parameter.name));

  if (!isManualRestMethod(method)) {
    diagnostics.push({
      code: 'invalid-config',
      apiId: definition.id,
      endpointId: endpoint.id,
      operationId: operation.id,
      message: `Manual REST operation method must be one of ${REST_METHODS.join(', ')}.`,
      path: `endpoints.${endpoint.id}.operations.${operation.id}.method`,
      severity: 'error',
    });
  }

  for (const templateParam of templateParams) {
    if (pathParameterNames.has(templateParam)) continue;
    diagnostics.push({
      code: 'invalid-config',
      apiId: definition.id,
      endpointId: endpoint.id,
      operationId: operation.id,
      message: `Path template parameter '${templateParam}' must have a matching path parameter definition.`,
      path: `endpoints.${endpoint.id}.operations.${operation.id}.parameters`,
      severity: 'error',
    });
  }

  for (const pathParameter of pathParameters) {
    if (templateParams.includes(pathParameter.name)) continue;
    diagnostics.push({
      code: 'invalid-config',
      apiId: definition.id,
      endpointId: endpoint.id,
      operationId: operation.id,
      message: `Path parameter '${pathParameter.name}' is not referenced by the operation path template.`,
      path: `endpoints.${endpoint.id}.operations.${operation.id}.parameters.${pathParameter.name}`,
      severity: 'error',
    });
  }
}
