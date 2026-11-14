import type {
  ApiDefinition,
  CredentialRef,
  DataOperationConfig,
  DataOperationPagination,
  DataOperationParameter,
  DataSourceDiagnostic,
  DataSourceDiagnosticResult,
} from '@ankhorage/contracts/data';

import { projectFlowTransport } from './projectFlowTransport';
import { redactFlowDiagnostics } from './redactFlowDiagnostics';
import { resolveFlowApiOperation } from './resolveFlowApiOperation';
import { projectFlowDataSchema } from './schema';
import type {
  FlowApiOperationAuthRequirement,
  FlowApiOperationDescriptor,
  FlowApiOperationInput,
  FlowApiOperationOwner,
  FlowApiOperationParameter,
  FlowApiOperationResult,
} from './types';

export type * from './types';

const FLOW_PROVIDER_ID = '@ankhorage/data-sources';

/*** Projects one server-resolved API operation into a credential-free Flow capability descriptor.
 *
 * @security The projection keeps only typed, public structural declarations. It never copies
 * unclassified metadata, URLs, credentials, defaults, headers, cookies, or executable values.
 */
export function createFlowApiOperationOwner(): FlowApiOperationOwner {
  const entries = new Map<
    string,
    {
      readonly api: ApiDefinition;
      readonly operation: DataOperationConfig;
      readonly parameterNames: ReadonlyMap<string, string>;
    }
  >();
  const descriptors = new WeakMap<ApiDefinition, Map<string, FlowApiOperationDescriptor>>();
  let nextHandle = 0;
  const createHandle = (kind: string): string => `flow-${kind}-${String(nextHandle++)}`;
  return {
    project: (api, endpointId, operationId) => {
      const sourceKey = `${endpointId}\u0000${operationId}`;
      const existing = descriptors.get(api)?.get(sourceKey);
      if (existing !== undefined) return { ok: true, data: existing };
      const operationHandle = createHandle('operation');
      const parameterNames = new Map<string, string>();
      const result = projectFlowApiOperation(
        api,
        endpointId,
        operationId,
        operationHandle,
        (name) => {
          const handle = createHandle('field');
          parameterNames.set(handle, name);
          return handle;
        },
      );
      if (result.ok) {
        const { operation } = selectOperation(api, endpointId, operationId);
        if (operation !== undefined) {
          entries.set(operationHandle, { api, operation, parameterNames });
          const descriptorsForApi =
            descriptors.get(api) ?? new Map<string, FlowApiOperationDescriptor>();
          descriptorsForApi.set(sourceKey, result.data);
          descriptors.set(api, descriptorsForApi);
        }
      }
      return result;
    },
    resolve: (descriptor, bindings) => resolveFlowApiOperation(entries, descriptor, bindings),
  };
}

/** Projects an owner-resolved operation using handles that reveal no source identities. */
function projectFlowApiOperation(
  api: ApiDefinition,
  endpointId: string,
  operationId: string,
  operationHandle: string,
  createFieldHandle: (name: string) => string,
): DataSourceDiagnosticResult<FlowApiOperationDescriptor> {
  const { endpoint, operation } = selectOperation(api, endpointId, operationId);
  const diagnostics = validateProjection(api, endpointId, operationId, endpoint, operation);
  if (diagnostics.length > 0 || endpoint === undefined || operation === undefined) {
    return {
      ok: false,
      diagnostics: redactFlowDiagnostics(diagnostics),
    };
  }

  const input = projectInput(operation, diagnostics, createFieldHandle);
  const auth = projectAuth(
    operation.credential ?? endpoint.credential ?? api.credential,
    diagnostics,
  );
  const result = projectResult(operation, diagnostics);
  if (diagnostics.length > 0 || input === undefined || auth === undefined || result === undefined) {
    return {
      ok: false,
      diagnostics: redactFlowDiagnostics(diagnostics),
    };
  }

  const id = operationHandle;
  return {
    ok: true,
    data: {
      id,
      capability: { providerId: FLOW_PROVIDER_ID, capabilityId: id },
      source: { handle: operationHandle },
      protocol: projectProtocol(operation),
      intent: operation.intent,
      ...projectFlowTransport(operation.method),
      endpoint: projectEndpoint(operation),
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

/** Reduces transport to its fixed protocol kind; paths are unclassified provider metadata. */
function projectEndpoint(operation: DataOperationConfig): FlowApiOperationDescriptor['endpoint'] {
  return operation.protocol === 'http' ? { kind: 'http' } : { kind: 'graphql' };
}

/** Converts the validated source protocol to Flow's closed transport vocabulary. */
function projectProtocol(operation: DataOperationConfig): FlowApiOperationDescriptor['protocol'] {
  return operation.protocol === 'http' ? 'http' : 'graphql';
}

/** Projects request fields only after recursively validating their public schema. */
function projectInput(
  operation: DataOperationConfig,
  diagnostics: DataSourceDiagnostic[],
  createFieldHandle: (name: string) => string,
): FlowApiOperationInput | undefined {
  const parameters = operation.request?.parameters ?? [];
  const projectedParameters = parameters.map((parameter) =>
    projectParameter(parameter, diagnostics, createFieldHandle),
  );
  const publicParameters = projectedParameters.flatMap((parameter) =>
    parameter === undefined ? [] : [parameter],
  );
  const { request } = operation;
  const bodySchema =
    request?.schema === undefined
      ? undefined
      : projectFlowDataSchema(request.schema, diagnostics, 'request', createFieldHandle);
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
            schema: bodySchema,
          },
        }),
  };
}

/** Preserves only parameter location and schema shape, never free-form parameter metadata. */
function projectParameter(
  parameter: DataOperationParameter,
  diagnostics: DataSourceDiagnostic[],
  createFieldHandle: (name: string) => string,
): FlowApiOperationParameter | undefined {
  if (parameter.location === 'header' || parameter.location === 'cookie') {
    diagnostics.push(
      projectionDiagnostic('', '', '', 'Parameter uses a secret-prone transport location.'),
    );
    return undefined;
  }
  if (parameter.default !== undefined) {
    diagnostics.push(projectionDiagnostic('', '', '', 'Parameter has a default value.'));
    return undefined;
  }
  const schema =
    parameter.schema === undefined
      ? undefined
      : projectFlowDataSchema(parameter.schema, diagnostics, 'parameter', createFieldHandle);
  if (parameter.schema !== undefined && schema === undefined) return undefined;
  return {
    handle: createFieldHandle(parameter.name),
    location: parameter.location,
    required: parameter.required ?? false,
    ...(schema === undefined ? {} : { schema }),
  };
}

/** Projects typed response shape without copying free-form response metadata. */
function projectResult(
  operation: DataOperationConfig,
  diagnostics: DataSourceDiagnostic[],
): FlowApiOperationResult | undefined {
  const { response } = operation;
  const schema =
    response?.schema === undefined
      ? undefined
      : projectFlowDataSchema(response.schema, diagnostics, 'response', () => 'result-field');
  if (response?.schema !== undefined && schema === undefined) return undefined;
  return {
    ...(response === undefined
      ? {}
      : {
          response: {
            ...(typeof response.status === 'number' ? { status: response.status } : {}),
            ...(schema === undefined ? {} : { schema }),
          },
        }),
    artifact: {
      kind: 'artifact',
    },
  };
}

/** Retains the fixed pagination category without unclassified field names. */
function projectPagination(
  operation: DataOperationConfig,
): NonNullable<FlowApiOperationDescriptor['pagination']> {
  const { pagination } = operation;
  return {
    kind: isFlowPaginationKind(pagination?.kind) ? pagination.kind : 'unknown',
  };
}

/** Narrows open provider pagination categories to Flow's public vocabulary. */
function isFlowPaginationKind(
  kind: DataOperationPagination['kind'] | undefined,
): kind is NonNullable<FlowApiOperationDescriptor['pagination']>['kind'] {
  return kind === 'cursor' || kind === 'limit-offset' || kind === 'page' || kind === 'unknown';
}

/** Emits only a credential kind after rejecting unclassified credential mechanisms. */
function projectAuth(
  credential: CredentialRef | undefined,
  diagnostics: DataSourceDiagnostic[],
): FlowApiOperationAuthRequirement | undefined {
  if (credential === undefined) return { required: false };
  if (!isFlowAuthKind(credential.kind)) {
    diagnostics.push(
      projectionDiagnostic('', '', '', 'Credential kind is not safely describable.'),
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
