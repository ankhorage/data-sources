import type {
  ApiDefinition,
  DataContractValue,
  DataOperationConfig,
  DataSourceDiagnosticResult,
} from '@ankhorage/contracts/data';

import type {
  FlowApiOperationBindings,
  FlowApiOperationDescriptor,
  ResolvedFlowApiOperation,
} from './types';

interface OwnerEntry {
  readonly api: ApiDefinition;
  readonly operation: DataOperationConfig;
  readonly parameterNames: ReadonlyMap<string, string>;
}

/** Resolves handles only within the private owner registry and never echoes rejected identities. */
export function resolveFlowApiOperation(
  entries: ReadonlyMap<string, OwnerEntry>,
  descriptor: FlowApiOperationDescriptor,
  bindings: FlowApiOperationBindings,
): DataSourceDiagnosticResult<ResolvedFlowApiOperation> {
  const entry = entries.get(descriptor.source.handle);
  if (entry === undefined || descriptor.id !== descriptor.source.handle)
    return notFound('operation');
  const parameters = Object.entries(bindings.parameters ?? {}).flatMap(([handle, value]) => {
    const name = entry.parameterNames.get(handle);
    return name === undefined ? [] : [{ name, value }];
  });
  if (parameters.length !== Object.keys(bindings.parameters ?? {}).length) return notFound('input');
  return {
    ok: true,
    data: {
      api: entry.api,
      operation: entry.operation,
      parameters,
      ...(bindings.body === undefined
        ? {}
        : { body: resolveFlowValue(bindings.body, entry.parameterNames) }),
    },
  };
}

/** Creates a redacted owner-boundary failure. */
function notFound(kind: 'input' | 'operation'): DataSourceDiagnosticResult<never> {
  return {
    ok: false,
    diagnostics: [
      {
        code: 'unsafe-flow-projection',
        message: `Flow ${kind} handle was not found.`,
        severity: 'error',
      },
    ],
  };
}

/** Rehydrates nested object keys only at the owner boundary. */
function resolveFlowValue(
  value: DataContractValue,
  names: ReadonlyMap<string, string>,
): DataContractValue {
  if (isDataContractList(value)) return value.map((child) => resolveFlowValue(child, names));
  if (!isDataContractRecord(value)) return value;
  const entries: readonly [string, DataContractValue][] = Object.entries(value);
  return Object.fromEntries(
    entries.map(([handle, child]) => [names.get(handle) ?? handle, resolveFlowValue(child, names)]),
  );
}

/** Narrows serializable values to object records without exposing runtime objects. */
function isDataContractRecord(
  value: DataContractValue,
): value is Readonly<Record<string, DataContractValue>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Narrows serializable values to serializable lists before recursively resolving members. */
function isDataContractList(value: DataContractValue): value is readonly DataContractValue[] {
  return Array.isArray(value);
}
