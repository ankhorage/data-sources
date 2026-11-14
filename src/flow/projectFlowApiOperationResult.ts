import type {
  DataContractValue,
  DataOperationConfig,
  DataSchema,
  DataSourceDiagnosticResult,
} from '@ankhorage/contracts/data';
import { isDataSchema } from '@ankhorage/contracts/data';

import type { FlowApiOperationDescriptor } from './types';

interface FlowResultOwnerEntry {
  readonly operation: DataOperationConfig;
  readonly fieldNames: ReadonlyMap<string, string>;
  readonly descriptor: FlowApiOperationDescriptor;
}

/*** Converts a provider response into the registered opaque Flow result field handles. */
export function projectFlowApiOperationResult(
  entries: ReadonlyMap<string, FlowResultOwnerEntry>,
  descriptor: FlowApiOperationDescriptor,
  value: DataContractValue,
): DataSourceDiagnosticResult<DataContractValue> {
  const entry = entries.get(descriptor.source.handle);
  if (
    entry === undefined ||
    descriptor.id !== descriptor.source.handle ||
    JSON.stringify(descriptor) !== JSON.stringify(entry.descriptor)
  )
    return resultNotFound();
  const sourceSchema = entry.operation.response?.schema;
  const projectedSchema = entry.descriptor.result.response?.schema;
  if (sourceSchema === undefined || projectedSchema === undefined) return resultNotFound();
  const projected = projectFlowResultValue(value, sourceSchema, projectedSchema, entry.fieldNames);
  return projected === undefined
    ? resultNotFound()
    : {
        ok: true,
        data: projected,
      };
}

/*** Replaces provider-owned object keys only through the owner-side registered field mapping. */
function projectFlowResultValue(
  value: DataContractValue,
  sourceSchema: DataSchema,
  projectedSchema: DataSchema,
  fieldNames: ReadonlyMap<string, string>,
): DataContractValue | undefined {
  if (isDataContractList(value)) {
    if (sourceSchema.items === undefined || projectedSchema.items === undefined) return undefined;
    const sourceItems = sourceSchema.items;
    const projectedItems = projectedSchema.items;
    const children = value.map((child) =>
      projectFlowResultValue(child, sourceItems, projectedItems, fieldNames),
    );
    const projectedChildren = children.flatMap((child) => (child === undefined ? [] : [child]));
    return projectedChildren.length === children.length ? projectedChildren : undefined;
  }
  if (!isDataContractRecord(value)) return value;
  const sourceProperties = sourceSchema.properties ?? {};
  const projectedProperties = projectedSchema.properties ?? {};
  if ((sourceSchema.required ?? []).some((name) => !Object.hasOwn(value, name))) return undefined;
  const entries = Object.entries(value).flatMap(([name, child]) => {
    const sourceChild = findSchemaProperty(sourceProperties, name);
    const handle = findHandle(fieldNames, projectedProperties, name);
    const projectedChild =
      handle === undefined ? undefined : findSchemaProperty(projectedProperties, handle);
    if (sourceChild === undefined || projectedChild === undefined || handle === undefined)
      return [];
    const projected = projectFlowResultValue(child, sourceChild, projectedChild, fieldNames);
    return projected === undefined ? [] : [[handle, projected] as const];
  });
  return entries.length === Object.keys(value).length ? Object.fromEntries(entries) : undefined;
}

/*** Finds a schema property without trusting inherited source object keys. */
function findSchemaProperty(
  properties: Readonly<Record<string, DataSchema>>,
  name: string,
): DataSchema | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(properties, name);
  return isDataSchema(descriptor?.value) ? descriptor.value : undefined;
}

/*** Finds a registered raw name only within the projected schema's current structural position. */
function findHandle(
  fieldNames: ReadonlyMap<string, string>,
  projectedProperties: Readonly<Record<string, DataSchema>>,
  name: string,
): string | undefined {
  return [...fieldNames].find(
    ([handle, candidate]) => candidate === name && Object.hasOwn(projectedProperties, handle),
  )?.[0];
}

/*** Creates a redacted failure when a provider response cannot cross the owner boundary. */
function resultNotFound(): DataSourceDiagnosticResult<never> {
  return {
    ok: false,
    diagnostics: [
      {
        code: 'unsafe-flow-projection',
        message: 'Flow result handle was not found.',
        severity: 'error',
      },
    ],
  };
}

/*** Narrows serializable values to records before replacing their provider-owned field identities. */
function isDataContractRecord(
  value: DataContractValue,
): value is Readonly<Record<string, DataContractValue>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/*** Narrows serializable values to lists before projecting each declared result item. */
function isDataContractList(value: DataContractValue): value is readonly DataContractValue[] {
  return Array.isArray(value);
}
