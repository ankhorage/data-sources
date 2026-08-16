import type {
  DataOperationConfig,
  DataOperationIntent,
  DataOperationParameter,
  DataOperationParameterLocation,
  DataOperationRequest,
  DataOperationResponse,
  DataSourceDiagnostic,
  EndpointId,
  OperationId,
} from '@ankhorage/contracts/data';

import { normalizeOpenApiSchema } from './schema';
import type {
  OpenApiHttpMethod,
  OpenApiImportInput,
  OpenApiMediaTypeObject,
  OpenApiOperationObject,
  OpenApiParameterObject,
  OpenApiPathItemObject,
  OpenApiRequestBodyObject,
  OpenApiResponseObject,
  OpenApiSchemaObject,
} from './types';

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

export function normalizeOpenApiOperation(
  input: OpenApiImportInput,
  endpointId: EndpointId,
  path: string,
  method: OpenApiHttpMethod,
  operation: OpenApiOperationObject,
  pathItem: OpenApiPathItemObject,
  operationIds: Set<OperationId>,
  diagnostics: DataSourceDiagnostic[],
): DataOperationConfig {
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
  return {
    id: operationId,
    endpointId,
    name: operation.summary,
    description: operation.description,
    protocol: 'http',
    intent: mapOpenApiMethodToIntent(method),
    method: method.toUpperCase(),
    path,
    request: normalizeOpenApiRequest(operation.requestBody, parameters),
    response: normalizeOpenApiResponse(operation.responses),
    metadata: { deprecated: operation.deprecated ?? false, source: 'openapi' },
  };
}

function resolveUniqueOperationId(
  apiId: string,
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

  const uniqueId = findUniqueOperationId(normalized, operationIds);
  operationIds.add(uniqueId);
  diagnostics.push({
    code: 'duplicate-operation-id',
    apiId,
    endpointId,
    operationId: uniqueId,
    message: `OpenAPI operation id '${normalized}' is duplicated. Normalized to '${uniqueId}'.`,
    path: `paths.${path}.${method}.operationId`,
    severity: 'warning',
  });
  return uniqueId;
}

function findUniqueOperationId(normalized: OperationId, operationIds: Set<OperationId>): OperationId {
  let suffix = 2;
  let candidate: OperationId = `${normalized}-${suffix}`;
  while (operationIds.has(candidate)) {
    suffix += 1;
    candidate = `${normalized}-${suffix}`;
  }
  return candidate;
}

function normalizeOpenApiParameters(
  parameters: readonly OpenApiParameterObject[],
  apiId: string,
  endpointId: EndpointId,
  operationId: OperationId,
  diagnostics: DataSourceDiagnostic[],
): readonly DataOperationParameter[] | undefined {
  if (parameters.length === 0) return undefined;
  return parameters.flatMap((parameter) =>
    normalizeOpenApiParameter(parameter, apiId, endpointId, operationId, diagnostics),
  );
}

function normalizeOpenApiParameter(
  parameter: OpenApiParameterObject,
  apiId: string,
  endpointId: EndpointId,
  operationId: OperationId,
  diagnostics: DataSourceDiagnostic[],
): readonly DataOperationParameter[] {
  const location = normalizeParameterLocation(parameter.in);
  if (location !== undefined) {
    return [
      {
        name: parameter.name,
        location,
        required: parameter.required,
        description: parameter.description,
        schema: parameter.schema === undefined ? undefined : normalizeOpenApiSchema(parameter.schema),
      },
    ];
  }
  diagnostics.push({
    code: 'invalid-config',
    apiId,
    endpointId,
    operationId,
    message: `OpenAPI parameter '${parameter.name}' uses unsupported location '${parameter.in}'.`,
    path: `paths.${endpointId}.parameters.${parameter.name}`,
    severity: 'warning',
  });
  return [];
}

function normalizeParameterLocation(location: string): DataOperationParameterLocation | undefined {
  if (
    location === 'cookie' ||
    location === 'header' ||
    location === 'path' ||
    location === 'query'
  ) {
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
  responses: Readonly<Record<string, OpenApiResponseObject>> | undefined,
): DataOperationResponse | undefined {
  const selected = chooseResponseEntry(responses);
  if (selected === undefined) return undefined;
  const [status, response] = selected;
  const content = firstContentEntry(response.content);
  return {
    status,
    contentType: content?.contentType,
    description: response.description,
    schema: content?.schema === undefined ? undefined : normalizeOpenApiSchema(content.schema),
  };
}

function chooseResponseEntry(
  responses: Readonly<Record<string, OpenApiResponseObject>> | undefined,
): readonly [string, OpenApiResponseObject] | undefined {
  if (responses === undefined) return undefined;
  const entries = Object.entries(responses);
  return entries.find(([status]) => status.startsWith('2')) ?? entries[0];
}

function firstContentEntry(
  content: Readonly<Record<string, OpenApiMediaTypeObject>> | undefined,
): { readonly contentType: string; readonly schema?: OpenApiSchemaObject } | undefined {
  const entry = content === undefined ? undefined : Object.entries(content)[0];
  if (entry === undefined) return undefined;
  const [contentType, media] = entry;
  return { contentType, schema: media.schema };
}

function mapOpenApiMethodToIntent(method: OpenApiHttpMethod): DataOperationIntent {
  if (method === 'get' || method === 'head') return 'read';
  if (method === 'post') return 'create';
  if (method === 'delete') return 'delete';
  if (method === 'patch' || method === 'put') return 'update';
  return 'action';
}
