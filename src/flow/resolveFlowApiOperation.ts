import type {
  ApiDefinition,
  DataContractValue,
  DataOperationConfig,
  DataSchema,
  DataSchemaPrimitiveType,
  DataSourceDiagnosticResult,
} from '@ankhorage/contracts/data';
import { isDataSchema } from '@ankhorage/contracts/data';

import type {
  FlowApiOperationBindings,
  FlowApiOperationDescriptor,
  ResolvedFlowApiOperation,
} from './types';

interface OwnerEntry {
  readonly api: ApiDefinition;
  readonly operation: DataOperationConfig;
  readonly parameterNames: ReadonlyMap<string, string>;
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
    const name = entry.parameterNames.get(handle);
    if (parameter === undefined || name === undefined) return [];
    const resolvedValue =
      parameter.schema === undefined
        ? value
        : resolveFlowValue(value, parameter.schema, entry.parameterNames);
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
  const value = resolveFlowValue(body, schema, entry.parameterNames);
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
    if (items === undefined) return value;
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

/** Validates a binding value against the projected schema before it reaches provider-owned data. */
function matchesFlowSchema(value: DataContractValue, schema: DataSchema | undefined): boolean {
  if (schema === undefined) return true;
  if (value === null) return acceptsNull(schema);
  return (
    matchesFlowTypes(value, schema) &&
    matchesFlowCompositions(value, schema) &&
    matchesFlowObject(value, schema)
  );
}

/** Matches an explicit nullable declaration without treating absent schemas as nullable. */
function acceptsNull(schema: DataSchema): boolean {
  return schema.nullable === true || flowSchemaTypes(schema).includes('null');
}

/** Narrows one schema's declared primitive alternatives into a uniform list. */
function flowSchemaTypes(schema: DataSchema): readonly DataSchemaPrimitiveType[] {
  if (schema.type === undefined) return [];
  return isFlowSchemaTypeList(schema.type) ? schema.type : [schema.type];
}

/** Narrows a schema's readonly primitive alternatives without widening them to unknown values. */
function isFlowSchemaTypeList(
  type: DataSchema['type'],
): type is readonly DataSchemaPrimitiveType[] {
  return Array.isArray(type);
}

/** Matches explicit primitive alternatives when a schema declares them. */
function matchesFlowTypes(value: DataContractValue, schema: DataSchema): boolean {
  const types = flowSchemaTypes(schema);
  return types.length === 0 || types.some((type) => matchesFlowType(value, type));
}

/** Enforces each public schema composition without permitting an undeclared alternative. */
function matchesFlowCompositions(value: DataContractValue, schema: DataSchema): boolean {
  return (
    !schema.allOf?.some((part) => !matchesFlowSchema(value, part)) &&
    (schema.anyOf === undefined || schema.anyOf.some((part) => matchesFlowSchema(value, part))) &&
    (schema.oneOf === undefined ||
      schema.oneOf.filter((part) => matchesFlowSchema(value, part)).length === 1)
  );
}

/** Allows object fields only when they have a projected opaque handle and required handle. */
function matchesFlowObject(value: DataContractValue, schema: DataSchema): boolean {
  if (!isDataContractRecord(value)) return true;
  const properties = schema.properties ?? {};
  return (
    Object.keys(value).every((handle) => Object.hasOwn(properties, handle)) &&
    (schema.required ?? []).every((handle) => Object.hasOwn(value, handle))
  );
}

/** Matches one serializable value against one closed public primitive type. */
function matchesFlowType(value: DataContractValue, type: DataSchemaPrimitiveType): boolean {
  if (type === 'array') return isDataContractList(value);
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'integer') return typeof value === 'number' && Number.isInteger(value);
  if (type === 'null') return value === null;
  if (type === 'number') return typeof value === 'number';
  if (type === 'object') return isDataContractRecord(value);
  return typeof value === 'string';
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
