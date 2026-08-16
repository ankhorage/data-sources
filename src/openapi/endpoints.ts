import type {
  DataEndpointConfig,
  DataSourceDiagnostic,
  EndpointId,
  OperationId,
} from '@ankhorage/contracts/data';

import { normalizeOpenApiOperation, normalizeOpenApiOperationId } from './operation';
import type {
  OpenApiHttpMethod,
  OpenApiImportInput,
  OpenApiOperationObject,
  OpenApiPathItemObject,
} from './types';

const OPENAPI_HTTP_METHODS = new Set<OpenApiHttpMethod>([
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
]);

export { normalizeOpenApiOperationId };

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
  return Object.entries(pathItem).flatMap(([key, value]) =>
    isOpenApiHttpMethod(key) && value !== undefined ? [[key, value]] : [],
  );
}

function isOpenApiHttpMethod(value: string): value is OpenApiHttpMethod {
  return OPENAPI_HTTP_METHODS.has(value as OpenApiHttpMethod);
}
