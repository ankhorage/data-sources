import type { DataSourceDiagnostic } from '@ankhorage/contracts/data';

import type { OpenApiDocumentObject } from '../openapi';

/*** Filters an origin-root OpenAPI document to the requested service path without rewriting paths. */
export function scopeOpenApiDocument(
  document: OpenApiDocumentObject,
  apiId: string,
  requestedScope: string,
  documentUrl: string,
): ScopeOpenApiDocumentResult {
  const paths = Object.fromEntries(
    Object.entries(document.paths ?? {}).filter(
      ([path]) => path === requestedScope || path.startsWith(`${requestedScope}/`),
    ),
  );
  if (Object.keys(paths).length > 0) return { ok: true, document: { ...document, paths } };

  return {
    ok: false,
    diagnostic: {
      code: 'missing-schema',
      apiId,
      message:
        `OpenAPI document '${redactDiagnosticUrl(documentUrl)}' contains no paths ` +
        `within requested service scope '${requestedScope}'.`,
      path: 'paths',
      severity: 'error',
    },
  };
}

type ScopeOpenApiDocumentResult =
  | { readonly ok: true; readonly document: OpenApiDocumentObject }
  | { readonly ok: false; readonly diagnostic: DataSourceDiagnostic };

/*** Removes credentials, query parameters, and fragments from a URL included in diagnostics. */
function redactDiagnosticUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.username = '';
  url.password = '';
  url.search = '';
  url.hash = '';
  return url.toString();
}
