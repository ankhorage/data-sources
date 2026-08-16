import type { DataSourceDiagnostic } from '@ankhorage/contracts/data';

import type {
  EndpointTestInput,
  EndpointTestRequestDiagnostic,
  EndpointTestResponseDiagnostic,
  EndpointTestResult,
} from './types';

export function createDiagnostic(
  input: EndpointTestInput,
  code: string,
  message: string,
): DataSourceDiagnostic {
  return {
    code,
    apiId: input.api.id,
    endpointId: input.endpointId,
    operationId: input.operationId,
    message,
    severity: code === 'missing-schema' ? 'info' : 'error',
  };
}

export function failure(
  request: EndpointTestRequestDiagnostic | undefined,
  diagnostics: readonly DataSourceDiagnostic[],
  response?: EndpointTestResponseDiagnostic,
): EndpointTestResult {
  return { ok: false, request, response, diagnostics };
}

export function createNetworkErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Endpoint test request failed.';
}
