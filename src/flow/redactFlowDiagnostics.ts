import type { DataSourceDiagnostic } from '@ankhorage/contracts/data';

/** Removes all unclassified source identity values from Flow projection failures. */
export function redactFlowDiagnostics(
  diagnostics: readonly DataSourceDiagnostic[],
): readonly DataSourceDiagnostic[] {
  return diagnostics.map(
    ({
      apiId: _apiId,
      endpointId: _endpointId,
      operationId: _operationId,
      path: _path,
      ...diagnostic
    }) => diagnostic,
  );
}
