import type {
  DataContractValue,
  DataSchema,
  DataSchemaPrimitiveType,
} from '@ankhorage/contracts/data';

/*** Validates a serializable Flow value against its declared projected schema. */
export function matchesFlowSchema(
  value: DataContractValue,
  schema: DataSchema | undefined,
): boolean {
  if (schema === undefined) return !isDataContractList(value) && !isDataContractRecord(value);
  if (value === null) return acceptsNull(schema);
  return (
    matchesFlowTypes(value, schema) &&
    matchesFlowCompositions(value, schema) &&
    matchesFlowObject(value, schema) &&
    matchesFlowArray(value, schema)
  );
}

/*** Matches an explicit nullable declaration without treating absent schemas as nullable. */
function acceptsNull(schema: DataSchema): boolean {
  return schema.nullable === true || flowSchemaTypes(schema).includes('null');
}

/*** Narrows one schema's declared primitive alternatives into a uniform list. */
function flowSchemaTypes(schema: DataSchema): readonly DataSchemaPrimitiveType[] {
  if (schema.type === undefined) return [];
  return isFlowSchemaTypeList(schema.type) ? schema.type : [schema.type];
}

/*** Narrows a schema's readonly primitive alternatives without widening them to unknown values. */
function isFlowSchemaTypeList(
  type: DataSchema['type'],
): type is readonly DataSchemaPrimitiveType[] {
  return Array.isArray(type);
}

/*** Matches explicit primitive alternatives when a schema declares them. */
function matchesFlowTypes(value: DataContractValue, schema: DataSchema): boolean {
  const types = flowSchemaTypes(schema);
  return types.length === 0 || types.some((type) => matchesFlowType(value, type));
}

/*** Enforces each public schema composition without permitting an undeclared alternative. */
function matchesFlowCompositions(value: DataContractValue, schema: DataSchema): boolean {
  return (
    !schema.allOf?.some((part) => !matchesFlowSchema(value, part)) &&
    (schema.anyOf === undefined || schema.anyOf.some((part) => matchesFlowSchema(value, part))) &&
    (schema.oneOf === undefined ||
      schema.oneOf.filter((part) => matchesFlowSchema(value, part)).length === 1)
  );
}

/*** Allows object fields only when they have a projected opaque handle and required handle. */
function matchesFlowObject(value: DataContractValue, schema: DataSchema): boolean {
  if (!isDataContractRecord(value)) return true;
  const properties = schema.properties ?? {};
  return (
    Object.keys(value).every((handle) => Object.hasOwn(properties, handle)) &&
    (schema.required ?? []).every((handle) => Object.hasOwn(value, handle))
  );
}

/*** Requires an item schema before a list can cross the owner boundary. */
function matchesFlowArray(value: DataContractValue, schema: DataSchema): boolean {
  return !isDataContractList(value) || schema.items !== undefined;
}

/*** Matches one serializable value against one closed public primitive type. */
function matchesFlowType(value: DataContractValue, type: DataSchemaPrimitiveType): boolean {
  if (type === 'array') return isDataContractList(value);
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'integer') return typeof value === 'number' && Number.isInteger(value);
  if (type === 'null') return value === null;
  if (type === 'number') return typeof value === 'number';
  if (type === 'object') return isDataContractRecord(value);
  return typeof value === 'string';
}

/*** Narrows serializable values to records before validating their declared properties. */
function isDataContractRecord(
  value: DataContractValue,
): value is Readonly<Record<string, DataContractValue>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/*** Narrows serializable values to lists before validating their declared items. */
function isDataContractList(value: DataContractValue): value is readonly DataContractValue[] {
  return Array.isArray(value);
}
