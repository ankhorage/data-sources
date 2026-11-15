import type {
  ApiDefinition,
  DataContractValue,
  DataOperationConfig,
  DataSchema,
  DataSourceDiagnosticResult,
} from '@ankhorage/contracts/data';
import { isDataSchema } from '@ankhorage/contracts/data';

import { matchesFlowSchema } from './matchesFlowSchema.js';
import type {
  FlowApiOperationBindings,
  FlowApiOperationDescriptor,
  ResolvedFlowApiOperation,
} from './types.js';

interface OwnerEntry {
  readonly api: ApiDefinition;
  readonly operation: DataOperationConfig;
  readonly fieldNames: ReadonlyMap<string, string>;
  readonly descriptor: FlowApiOperationDescriptor;
}

/** Resolves handles only within the private owner registry and never echoes rejected identities. */
export function resolveFlowApiOperation(
  entries: ReadonlyMap<string, OwnerEntry>,
  descriptor: FlowApiOperationDescriptor,
  bindings: FlowApiOperationBindings,
): DataSourceDiagnosticResult<ResolvedFlowApiOperation> {
  const entry = entries.get(descriptor.source.handle);
  if (
    entry === undefined ||
    descriptor.id !== descriptor.source.handle ||
    JSON.stringify(descriptor) !== JSON.stringify(entry.descriptor)
  )
    return notFound('operation');
  const parameters = resolveFlowParameters(bindings, entry);
  const { body } = bindings;
  const resolvedBody = resolveFlowBody(body, entry);
  if (parameters === undefined || resolvedBody === undefined) return notFound('input');
  return {
    ok: true,
    data: {
      api: entry.api,
      operation: entry.operation,
      parameters,
      ...(resolvedBody.value === undefined ? {} : { body: resolvedBody.value }),
    },
  };
}

/** Resolves complete parameter bindings only when their handles and values match the public schema. */
function resolveFlowParameters(
  bindings: FlowApiOperationBindings,
  entry: OwnerEntry,
): readonly { readonly name: string; readonly value: DataContractValue }[] | undefined {
  const values = bindings.parameters ?? {};
  const {
    input: { parameters },
  } = entry.descriptor;
  const parameterByHandle = new Map(parameters.map((parameter) => [parameter.handle, parameter]));
  if (
    Object.keys(values).some((handle) => !parameterByHandle.has(handle)) ||
    parameters.some((parameter) => parameter.required && values[parameter.handle] === undefined)
  )
    return undefined;
  const resolved = Object.entries(values).flatMap(([handle, value]) => {
    const parameter = parameterByHandle.get(handle);
    const name = entry.fieldNames.get(handle);
    if (parameter === undefined || name === undefined) return [];
    const resolvedValue =
      parameter.schema === undefined
        ? value
        : resolveFlowValue(value, parameter.schema, entry.fieldNames);
    return resolvedValue === undefined ? [] : [{ name, value: resolvedValue }];
  });
  return resolved.length === Object.keys(values).length ? resolved : undefined;
}

/** Resolves a body only through the registered public schema; no raw client keys can pass through. */
function resolveFlowBody(
  body: DataContractValue | undefined,
  entry: OwnerEntry,
): { readonly value: DataContractValue | undefined } | undefined {
  if (body === undefined) return { value: undefined };
  const schema = entry.descriptor.input.body?.schema;
  if (schema === undefined) return undefined;
  const value = resolveFlowValue(body, schema, entry.fieldNames);
  return value === undefined ? undefined : { value };
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
  schema: DataSchema,
  names: ReadonlyMap<string, string>,
): DataContractValue | undefined {
  if (!matchesFlowSchema(value, schema)) return undefined;
  if (isDataContractList(value)) {
    const { items } = schema;
    if (items === undefined) return undefined;
    const children = value.map((child) => resolveFlowValue(child, items, names));
    const resolvedChildren = children.flatMap((child) => (child === undefined ? [] : [child]));
    return resolvedChildren.length === children.length ? resolvedChildren : undefined;
  }
  if (!isDataContractRecord(value)) return value;
  const properties = schema.properties ?? {};
  const entries = Object.entries(value).flatMap(([handle, child]) => {
    const name = names.get(handle);
    const childSchema = findFlowProperty(properties, handle);
    if (name === undefined || childSchema === undefined) return [];
    const resolved = resolveFlowValue(child, childSchema, names);
    return resolved === undefined ? [] : [[name, resolved] as const];
  });
  return entries.length === Object.keys(value).length ? Object.fromEntries(entries) : undefined;
}

/** Looks up one projected property without trusting a client-controlled key lookup. */
function findFlowProperty(
  properties: Readonly<Record<string, DataSchema>>,
  handle: string,
): DataSchema | undefined {
  const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
    properties,
    handle,
  );
  const value: unknown = descriptor?.value;
  return isDataSchema(value) ? value : undefined;
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
