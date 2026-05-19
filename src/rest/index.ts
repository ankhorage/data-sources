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
  OperationId,
  RestDataSourceConfig,
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

export interface ManualRestDataSourceDefinition {
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
  const colonParamPattern = /(^|\/)\:([A-Za-z_][A-Za-z0-9_]*)/g;

  for (const match of path.matchAll(bracedParamPattern)) {
    const param = match[1];
    if (param !== undefined) params.add(param);
  }

  for (const match of path.matchAll(colonParamPattern)) {
    const param = match[2];
    if (param !== undefined) params.add(param);
  }

  return [...params];
}

export function validateManualRestDataSource(
  definition: ManualRestDataSourceDefinition,
): readonly DataSourceDiagnostic[] {
  const diagnostics: DataSourceDiagnostic[] = [];

  if (definition.baseUrl.trim().length === 0) {
    diagnostics.push({
      code: 'invalid-config',
      dataSourceId: definition.id,
      message: 'Manual REST data source requires a non-empty baseUrl.',
      path: 'baseUrl',
      severity: 'error',
    });
  }

  for (const endpoint of definition.endpoints) {
    if (!endpoint.path.startsWith('/')) {
      diagnostics.push({
        code: 'invalid-config',
        dataSourceId: definition.id,
        endpointId: endpoint.id,
        message: 'Manual REST endpoint paths must start with `/`.',
        path: `endpoints.${endpoint.id}.path`,
        severity: 'error',
      });
    }

    for (const operation of endpoint.operations) {
      const normalizedMethod = normalizeManualRestMethod(operation.method);
      const operationPath = operation.path ?? endpoint.path;
      const templateParams = extractRestPathParams(operationPath);
      const pathParameters =
        operation.parameters?.filter((parameter) => parameter.location === 'path') ?? [];
      const pathParameterNames = new Set(pathParameters.map((parameter) => parameter.name));

      if (!isManualRestMethod(normalizedMethod)) {
        diagnostics.push({
          code: 'invalid-config',
          dataSourceId: definition.id,
          endpointId: endpoint.id,
          operationId: operation.id,
          message: `Manual REST operation method must be one of ${REST_METHODS.join(', ')}.`,
          path: `endpoints.${endpoint.id}.operations.${operation.id}.method`,
          severity: 'error',
        });
      }

      for (const templateParam of templateParams) {
        if (!pathParameterNames.has(templateParam)) {
          diagnostics.push({
            code: 'invalid-config',
            dataSourceId: definition.id,
            endpointId: endpoint.id,
            operationId: operation.id,
            message: `Path template parameter '${templateParam}' must have a matching path parameter definition.`,
            path: `endpoints.${endpoint.id}.operations.${operation.id}.parameters`,
            severity: 'error',
          });
        }
      }

      for (const pathParameter of pathParameters) {
        if (!templateParams.includes(pathParameter.name)) {
          diagnostics.push({
            code: 'invalid-config',
            dataSourceId: definition.id,
            endpointId: endpoint.id,
            operationId: operation.id,
            message: `Path parameter '${pathParameter.name}' is not referenced by the operation path template.`,
            path: `endpoints.${endpoint.id}.operations.${operation.id}.parameters.${pathParameter.name}`,
            severity: 'error',
          });
        }
      }
    }
  }

  return diagnostics;
}

export function createManualRestDataSource(
  definition: ManualRestDataSourceDefinition,
): DataSourceDiagnosticResult<RestDataSourceConfig> {
  const diagnostics = validateManualRestDataSource(definition);
  const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');

  if (hasErrors) {
    return { ok: false, diagnostics };
  }

  return {
    ok: true,
    data: normalizeManualRestDataSource(definition),
    diagnostics,
  };
}

export function normalizeManualRestDataSource(
  definition: ManualRestDataSourceDefinition,
): RestDataSourceConfig {
  const endpoints: Record<EndpointId, DataEndpointConfig> = {};

  for (const endpoint of definition.endpoints) {
    const operations: Record<OperationId, DataOperationConfig> = {};

    for (const operation of endpoint.operations) {
      const operationPath = operation.path ?? endpoint.path;
      const { parameters } = operation;
      const request: DataOperationRequest | undefined =
        operation.request === undefined && parameters === undefined
          ? undefined
          : {
              ...operation.request,
              parameters,
            };

      operations[operation.id] = {
        id: operation.id,
        endpointId: endpoint.id,
        name: operation.name,
        description: operation.description,
        protocol: 'http',
        intent: operation.intent,
        method: normalizeManualRestMethod(operation.method),
        path: operationPath,
        request,
        response: operation.response,
        pagination: operation.pagination,
        credential: operation.credential,
        metadata: operation.metadata,
      };
    }

    endpoints[endpoint.id] = {
      id: endpoint.id,
      kind: 'http',
      name: endpoint.name,
      description: endpoint.description,
      baseUrl: definition.baseUrl,
      path: endpoint.path,
      credential: endpoint.credential,
      operations,
      metadata: endpoint.metadata,
    };
  }

  return {
    id: definition.id,
    kind: 'rest',
    name: definition.name,
    description: definition.description,
    baseUrl: definition.baseUrl,
    credential: definition.credential,
    endpoints,
    schemas: definition.schemas,
    metadata: definition.metadata,
  };
}
