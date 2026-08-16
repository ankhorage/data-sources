import type {
  DataEndpointConfig,
  DataSourceDiagnostic,
  EndpointId,
  OperationId,
} from '@ankhorage/contracts/data';

import { normalizeOpenApiOperation } from './operation';
import type {
  OpenApiHttpMethod,
  OpenApiImportInput,
  OpenApiOperationObject,
  OpenApiPathItemObject,
} from './types';

const OPENAPI_HTTP_METHODS = [
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
] as const satisfies readonly OpenApiHttpMethod[];

export function normalizeOpenApiEndpointId(path: string): EndpointId {
  const normalized = path
    .replace(/\{([^}]+)\}/g, '$1')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return normalized.length > 0 ? normalized : 'root';
}

export function normalizeOpenApiEndpoints(
  input: OpenApiImportInput,
  diagnostics: DataSourceDiagnostic[],
): Record<EndpointId, DataEndpointConfig> {
  const { paths } = input.document;
  if (paths === undefined || Object.keys(paths).length === 0) {
    diagnostics.push({
      code: 'invalid-config',
      apiId: input.id,
      message: 'OpenAPI document must define at least one path.',
      path: 'paths',
      severity: 'error',
    });
    return {};
  }

  const operationIds = new Set<OperationId>();
  return Object.fromEntries(
    Object.entries(paths).map(([path, pathItem]) => {
      const endpointId = normalizeOpenApiEndpointId(path);
      return [
        endpointId,
        normalizeOpenApiEndpoint(input, path, pathItem, endpointId, operationIds, diagnostics),
      ];
    }),
  );
}

function normalizeOpenApiEndpoint(
  input: OpenApiImportInput,
  path: string,
  pathItem: OpenApiPathItemObject,
  endpointId: EndpointId,
  operationIds: Set<OperationId>,
  diagnostics: DataSourceDiagnostic[],
): DataEndpointConfig {
  const operations = Object.fromEntries(
    getOpenApiOperations(pathItem).map(([method, operation]) => {
      const normalized = normalizeOpenApiOperation(
        input,
        endpointId,
        path,
        method,
        operation,
        pathItem,
        operationIds,
        diagnostics,
      );
      return [normalized.id, normalized];
    }),
  );
  return {
    id: endpointId,
    kind: 'http',
    path,
    credential: input.credential,
    operations,
  };
}

function getOpenApiOperations(
  pathItem: OpenApiPathItemObject,
): readonly [OpenApiHttpMethod, OpenApiOperationObject][] {
  return OPENAPI_HTTP_METHODS.flatMap((method) => {
    const operation = getOpenApiOperation(pathItem, method);
    return operation === undefined ? [] : [[method, operation]];
  });
}

function getOpenApiOperation(
  pathItem: OpenApiPathItemObject,
  method: OpenApiHttpMethod,
): OpenApiOperationObject | undefined {
  switch (method) {
    case 'delete':
      return pathItem.delete;
    case 'get':
      return pathItem.get;
    case 'head':
      return pathItem.head;
    case 'options':
      return pathItem.options;
    case 'patch':
      return pathItem.patch;
    case 'post':
      return pathItem.post;
    case 'put':
      return pathItem.put;
  }
}
