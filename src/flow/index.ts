import type {
  ApiDefinition,
  CredentialRef,
  DataOperationConfig,
  DataOperationParameter,
  DataSourceDiagnostic,
  DataSourceDiagnosticResult,
} from '@ankhorage/contracts/data';

import { projectFlowDataSchema } from './schema';
import type {
  FlowApiOperationAuthRequirement,
  FlowApiOperationDescriptor,
  FlowApiOperationInput,
  FlowApiOperationParameter,
  FlowApiOperationResult,
} from './types';

export type * from './types';

const SENSITIVE_NAME = /(?:api[_-]?key|authorization|credential|cookie|password|secret|token)/iu;
const FLOW_PROVIDER_ID = '@ankhorage/data-sources';

/*** Projects one server-resolved API operation into a credential-free Flow capability descriptor.
 *
 * @security The projection is an allowlist: it never copies metadata, URLs, credentials, defaults,
 * headers, cookies, executable values, or unknown fields into graph-persistable data.
 */
export function projectFlowApiOperation(
  api: ApiDefinition,
  endpointId: string,
  operationId: string,
): DataSourceDiagnosticResult<FlowApiOperationDescriptor> {
  const { endpoint, operation } = selectOperation(api, endpointId, operationId);
  const diagnostics = validateProjection(api, endpointId, operationId, endpoint, operation);
  if (diagnostics.length > 0 || endpoint === undefined || operation === undefined) {
    return {
      ok: false,
      diagnostics: identifyDiagnostics(diagnostics, api.id, endpointId, operationId),
    };
  }

  const input = projectInput(operation, diagnostics);
  const auth = projectAuth(
    operation.credential ?? endpoint.credential ?? api.credential,
    diagnostics,
  );
  const result = projectResult(operation, diagnostics);
  if (diagnostics.length > 0 || input === undefined || auth === undefined || result === undefined) {
    return {
      ok: false,
      diagnostics: identifyDiagnostics(diagnostics, api.id, endpointId, operationId),
    };
  }

  const id = createFlowApiOperationDescriptorId(api.id, endpointId, operationId);
  return {
    ok: true,
    data: {
      id,
      capability: { providerId: FLOW_PROVIDER_ID, capabilityId: id },
      source: { apiId: api.id, endpointId, operationId },
      protocol: operation.protocol,
      intent: operation.intent,
      ...(operation.method === undefined ? {} : { method: operation.method }),
      endpoint: projectEndpoint(operation),
      ...(operation.name === undefined ? {} : { name: operation.name }),
      ...(operation.description === undefined ? {} : { description: operation.description }),
      input,
      result,
      errors: ['authentication', 'authorization', 'network', 'rate-limit', 'response-validation'],
      ...(operation.pagination === undefined ? {} : { pagination: projectPagination(operation) }),
      rateLimit: { kind: 'unknown' },
      auth,
    },
    diagnostics,
  };
}

/** Finds the requested source tuple without indexing untrusted object keys. */
function selectOperation(
  api: ApiDefinition,
  endpointId: string,
  operationId: string,
): {
  readonly endpoint: ApiDefinition['endpoints'][string] | undefined;
  readonly operation: DataOperationConfig | undefined;
} {
  const endpoint = Object.values(api.endpoints).find((candidate) => candidate.id === endpointId);
  const operation = Object.values(endpoint?.operations ?? {}).find(
    (candidate) => candidate.id === operationId,
  );
  return { endpoint, operation };
}

/*** Creates a stable Flow capability identifier from the complete server-side operation identity. */
export function createFlowApiOperationDescriptorId(
  apiId: string,
  endpointId: string,
  operationId: string,
): string {
  return `data-sources.api/${encodeURIComponent(apiId)}/${encodeURIComponent(endpointId)}/${encodeURIComponent(operationId)}`;
}

/** Validates that the requested source operation exists and uses a supported transport. */
function validateProjection(
  api: ApiDefinition,
  endpointId: string,
  operationId: string,
  endpoint: ApiDefinition['endpoints'][string] | undefined,
  operation: DataOperationConfig | undefined,
): DataSourceDiagnostic[] {
  if (endpoint === undefined) {
    return [projectionDiagnostic(api.id, endpointId, operationId, 'Endpoint was not found.')];
  }
  if (operation === undefined) {
    return [projectionDiagnostic(api.id, endpointId, operationId, 'Operation was not found.')];
  }
  if (operation.protocol !== 'http' && operation.protocol !== 'graphql') {
    return [
      projectionDiagnostic(
        api.id,
        endpointId,
        operationId,
        `Operation protocol '${operation.protocol}' cannot be safely projected for Flow.`,
      ),
    ];
  }
  return [];
}

/** Reduces the transport to metadata that cannot disclose a service URL or query values. */
function projectEndpoint(operation: DataOperationConfig): FlowApiOperationDescriptor['endpoint'] {
  return operation.protocol === 'http'
    ? { kind: 'http', ...(operation.path === undefined ? {} : { path: operation.path }) }
    : { kind: 'graphql' };
}

/** Projects request fields only after recursively validating their public schema. */
function projectInput(
  operation: DataOperationConfig,
  diagnostics: DataSourceDiagnostic[],
): FlowApiOperationInput | undefined {
  const parameters = operation.request?.parameters ?? [];
  const projectedParameters = parameters.map((parameter) =>
    projectParameter(parameter, diagnostics),
  );
  const publicParameters = projectedParameters.flatMap((parameter) =>
    parameter === undefined ? [] : [parameter],
  );
  const { request } = operation;
  const bodySchema =
    request?.schema === undefined
      ? undefined
      : projectFlowDataSchema(request.schema, diagnostics, 'request');
  if (
    publicParameters.length !== parameters.length ||
    (request?.schema !== undefined && bodySchema === undefined)
  ) {
    return undefined;
  }
  return {
    parameters: publicParameters,
    ...(request?.schema === undefined
      ? {}
      : {
          body: {
            ...(request.contentType === undefined ? {} : { contentType: request.contentType }),
            schema: bodySchema,
          },
        }),
  };
}

/** Rejects secret-prone parameter locations, names, and defaults before projection. */
function projectParameter(
  parameter: DataOperationParameter,
  diagnostics: DataSourceDiagnostic[],
): FlowApiOperationParameter | undefined {
  if (parameter.location === 'header' || parameter.location === 'cookie') {
    diagnostics.push(
      projectionDiagnostic(
        '',
        '',
        '',
        `Parameter '${parameter.name}' uses a secret-prone transport location.`,
      ),
    );
    return undefined;
  }
  if (SENSITIVE_NAME.test(parameter.name)) {
    diagnostics.push(
      projectionDiagnostic('', '', '', `Parameter '${parameter.name}' has an unsafe public name.`),
    );
    return undefined;
  }
  if (parameter.default !== undefined) {
    diagnostics.push(
      projectionDiagnostic('', '', '', `Parameter '${parameter.name}' has a default value.`),
    );
    return undefined;
  }
  const schema =
    parameter.schema === undefined
      ? undefined
      : projectFlowDataSchema(parameter.schema, diagnostics, parameter.name);
  if (parameter.schema !== undefined && schema === undefined) return undefined;
  return {
    name: parameter.name,
    location: parameter.location,
    ...(parameter.required === undefined ? {} : { required: parameter.required }),
    ...(parameter.description === undefined ? {} : { description: parameter.description }),
    ...(schema === undefined ? {} : { schema }),
  };
}

/** Projects a response and its artifact eligibility without copying arbitrary operation metadata. */
function projectResult(
  operation: DataOperationConfig,
  diagnostics: DataSourceDiagnostic[],
): FlowApiOperationResult | undefined {
  const { response } = operation;
  const schema =
    response?.schema === undefined
      ? undefined
      : projectFlowDataSchema(response.schema, diagnostics, 'response');
  if (response?.schema !== undefined && schema === undefined) return undefined;
  return {
    ...(response === undefined
      ? {}
      : {
          response: {
            ...(response.status === undefined ? {} : { status: response.status }),
            ...(response.contentType === undefined ? {} : { contentType: response.contentType }),
            ...(response.description === undefined ? {} : { description: response.description }),
            ...(schema === undefined ? {} : { schema }),
          },
        }),
    artifact: {
      kind: 'artifact',
      ...(response?.contentType === undefined ? {} : { mediaType: response.contentType }),
    },
  };
}

/** Copies pagination fields without interpreting provider-specific pagination execution. */
function projectPagination(
  operation: DataOperationConfig,
): NonNullable<FlowApiOperationDescriptor['pagination']> {
  const { pagination } = operation;
  return {
    kind: pagination?.kind ?? 'unknown',
    ...(pagination?.cursorPath === undefined ? {} : { cursorPath: pagination.cursorPath }),
    ...(pagination?.limitParameter === undefined
      ? {}
      : { limitParameter: pagination.limitParameter }),
    ...(pagination?.offsetParameter === undefined
      ? {}
      : { offsetParameter: pagination.offsetParameter }),
    ...(pagination?.pageParameter === undefined ? {} : { pageParameter: pagination.pageParameter }),
    ...(pagination?.pageSizeParameter === undefined
      ? {}
      : { pageSizeParameter: pagination.pageSizeParameter }),
  };
}

/** Emits only a credential kind after rejecting unclassified credential mechanisms. */
function projectAuth(
  credential: CredentialRef | undefined,
  diagnostics: DataSourceDiagnostic[],
): FlowApiOperationAuthRequirement | undefined {
  if (credential === undefined) return { required: false };
  if (!isFlowAuthKind(credential.kind)) {
    diagnostics.push(
      projectionDiagnostic(
        '',
        '',
        '',
        `Credential kind '${credential.kind}' is not safely describable.`,
      ),
    );
    return undefined;
  }
  return { required: true, kind: credential.kind };
}

/** Narrows credential kinds that describe requirements without provider configuration. */
function isFlowAuthKind(
  kind: CredentialRef['kind'],
): kind is NonNullable<FlowApiOperationAuthRequirement['kind']> {
  return kind === 'apiKey' || kind === 'basic' || kind === 'bearer' || kind === 'oauth2';
}

/** Creates a consistent error diagnostic without including any rejected source values. */
function projectionDiagnostic(
  apiId: string,
  endpointId: string,
  operationId: string,
  message: string,
): DataSourceDiagnostic {
  return {
    code: 'unsafe-flow-projection',
    message,
    severity: 'error',
    ...(apiId.length === 0 ? {} : { apiId }),
    ...(endpointId.length === 0 ? {} : { endpointId }),
    ...(operationId.length === 0 ? {} : { operationId }),
  };
}

/** Adds source identity to rejected projections without copying rejected values into diagnostics. */
function identifyDiagnostics(
  diagnostics: readonly DataSourceDiagnostic[],
  apiId: string,
  endpointId: string,
  operationId: string,
): readonly DataSourceDiagnostic[] {
  return diagnostics.map((diagnostic) => ({
    ...diagnostic,
    apiId: diagnostic.apiId ?? apiId,
    endpointId: diagnostic.endpointId ?? endpointId,
    operationId: diagnostic.operationId ?? operationId,
  }));
}
