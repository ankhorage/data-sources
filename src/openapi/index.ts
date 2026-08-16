import type {
  DataSourceDiagnostic,
  DataSourceDiagnosticResult,
  ExternalRestApiDefinition,
} from '@ankhorage/contracts/data';

import { normalizeOpenApiEndpoints } from './endpoints';
import { normalizeOpenApiSchemas } from './schema';
import type { OpenApiImportInput } from './types';

export { normalizeOpenApiEndpointId } from './endpoints';
export { normalizeOpenApiOperationId } from './operation';
export { normalizeOpenApiSchema } from './schema';
export type * from './types';

export type OpenApiImportResult = DataSourceDiagnosticResult<ExternalRestApiDefinition>;

export function importOpenApiDocument(input: OpenApiImportInput): OpenApiImportResult {
  const diagnostics: DataSourceDiagnostic[] = [];
  const baseUrl = resolveOpenApiBaseUrl(input, diagnostics);
  const schemas = normalizeOpenApiSchemas(
    input.document.components?.schemas,
    input.id,
    diagnostics,
  );
  const endpoints = normalizeOpenApiEndpoints(input, diagnostics);

  if (baseUrl === undefined || diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return { ok: false, diagnostics };
  }

  return {
    ok: true,
    data: {
      id: input.id,
      origin: 'external',
      protocol: 'rest',
      name: input.name ?? input.document.info?.title,
      description: input.description ?? input.document.info?.description,
      baseUrl,
      credential: input.credential,
      endpoints,
      schemas,
      openApi: {
        url: input.documentUrl,
        documentId: input.documentId,
        version: input.document.info?.version,
      },
      metadata: input.metadata,
    },
    diagnostics,
  };
}

function resolveOpenApiBaseUrl(
  input: OpenApiImportInput,
  diagnostics: DataSourceDiagnostic[],
): string | undefined {
  if (input.baseUrl !== undefined && input.baseUrl.trim().length > 0) return input.baseUrl;

  const servers = input.document.servers ?? [];
  if (servers.length === 0) {
    diagnostics.push({
      code: 'ambiguous-server',
      apiId: input.id,
      message: 'OpenAPI import requires a server URL or an explicit baseUrl override.',
      path: 'servers',
      severity: 'error',
    });
    return undefined;
  }

  if (servers.length > 1) {
    diagnostics.push({
      code: 'ambiguous-server',
      apiId: input.id,
      message: 'OpenAPI document defines multiple servers. The first server URL was selected.',
      path: 'servers',
      severity: 'warning',
    });
  }
  return servers[0]?.url;
}
