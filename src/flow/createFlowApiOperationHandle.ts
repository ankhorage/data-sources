import { createHash } from 'node:crypto';

import type { ApiDefinition, DataOperationConfig } from '@ankhorage/contracts/data';

/*** Creates stable, opaque handles for one server-resolved API operation revision. */
export function createFlowApiOperationHandle(
  api: ApiDefinition,
  endpointId: string,
  operationId: string,
  operation: DataOperationConfig | undefined,
): { readonly operation: string; readonly field: (name: string) => string } {
  const operationHandle = `flow:v1:operation:${hashFlowHandlePart(
    JSON.stringify({
      apiId: api.id,
      api: projectApiRevision(api),
      endpointId,
      endpoint: projectEndpointRevision(api, endpointId),
      operationId,
      operation: projectOperationRevision(operation),
    }),
  )}`;
  return {
    operation: operationHandle,
    field: (name) => `flow:v1:field:${hashFlowHandlePart(`${operationHandle}\u0000${name}`)}`,
  };
}

/*** Selects endpoint fields that alter the operation's server-side meaning without credentials. */
function projectEndpointRevision(
  api: ApiDefinition,
  endpointId: string,
): Record<string, unknown> | undefined {
  const endpoint = Object.values(api.endpoints).find((candidate) => candidate.id === endpointId);
  return endpoint === undefined
    ? undefined
    : { id: endpoint.id, path: endpoint.path, credentialKind: endpoint.credential?.kind };
}

/*** Derives a fixed-length opaque identifier without persisting its source material. */
function hashFlowHandlePart(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

/*** Selects API transport fields that can change the resolved execution target without credentials. */
function projectApiRevision(api: ApiDefinition): Record<string, unknown> {
  if (api.protocol === 'graphql') {
    return {
      origin: api.origin,
      endpointUrl: api.endpointUrl,
      introspection: api.introspection,
      credentialKind: api.credential?.kind,
    };
  }
  if (api.origin === 'internal') return { origin: api.origin, basePath: api.basePath };
  return {
    origin: api.origin,
    baseUrl: api.baseUrl,
    openApi: api.openApi,
    credentialKind: api.credential?.kind,
  };
}

/*** Selects operation fields that invalidate a persisted binding when their source revision changes. */
function projectOperationRevision(
  operation: DataOperationConfig | undefined,
): Record<string, unknown> | undefined {
  if (operation === undefined) return undefined;
  return {
    id: operation.id,
    protocol: operation.protocol,
    intent: operation.intent,
    method: operation.method,
    path: operation.path,
    request: operation.request,
    response: operation.response,
    pagination: operation.pagination,
    credentialKind: operation.credential?.kind,
  };
}
