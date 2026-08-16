import type { DataSchema, DataSchemaRegistry } from '@ankhorage/contracts/data';

import { normalizeGraphQlOperationId } from './operation';
import type {
  GraphQlIntrospectionInputValue,
  GraphQlIntrospectionResult,
  GraphQlIntrospectionType,
  GraphQlIntrospectionTypeRef,
  GraphQlOperationDefinition,
  GraphQlOperationKind,
} from './types';

const OBJECT_TYPE_KINDS = new Set(['OBJECT', 'INTERFACE', 'INPUT_OBJECT']);

export function normalizeGraphQlIntrospectionSchemas(
  introspection: GraphQlIntrospectionResult | undefined,
): DataSchemaRegistry | undefined {
  const types = introspection?.__schema?.types?.filter(isNamedGraphQlType) ?? [];
  const entries = types.flatMap((type) => {
    const { name } = type;
    if (name === undefined || name === null || name.startsWith('__')) return [];
    return [[name, normalizeGraphQlType(type)] as const];
  });
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

export function normalizeGraphQlIntrospectionOperations(
  introspection: GraphQlIntrospectionResult | undefined,
): readonly GraphQlOperationDefinition[] {
  const schema = introspection?.__schema;
  if (schema === undefined) return [];

  const types = schema.types?.filter(isNamedGraphQlType) ?? [];
  return [
    ...normalizeRootOperations('query', schema.queryType?.name, types),
    ...normalizeRootOperations('mutation', schema.mutationType?.name, types),
    ...normalizeRootOperations('subscription', schema.subscriptionType?.name, types),
  ];
}

function normalizeRootOperations(
  kind: GraphQlOperationKind,
  rootTypeName: string | null | undefined,
  types: readonly GraphQlIntrospectionType[],
): readonly GraphQlOperationDefinition[] {
  if (rootTypeName === undefined || rootTypeName === null) return [];
  const rootType = types.find((type) => type.name === rootTypeName);
  return (rootType?.fields ?? []).map((field) => ({
    id: normalizeGraphQlOperationId(kind, field.name),
    kind,
    name: field.name,
    description: field.description ?? undefined,
    variables: normalizeGraphQlVariablesSchema(field.args ?? []),
    response: normalizeGraphQlTypeRef(field.type),
    selectionPath: `$.data.${field.name}`,
    metadata: { rootType: rootTypeName, source: 'introspection' },
  }));
}

function normalizeGraphQlVariablesSchema(
  args: readonly GraphQlIntrospectionInputValue[],
): DataSchema {
  const properties = Object.fromEntries(
    args.map((arg) => [
      arg.name,
      {
        ...normalizeGraphQlTypeRef(arg.type),
        description: arg.description ?? undefined,
        default: arg.defaultValue ?? undefined,
      },
    ]),
  );
  const required = args.filter((arg) => isGraphQlNonNull(arg.type)).map((arg) => arg.name);
  return {
    type: 'object',
    required: required.length > 0 ? required : undefined,
    properties,
  };
}

function normalizeGraphQlType(type: GraphQlIntrospectionType): DataSchema {
  if (OBJECT_TYPE_KINDS.has(type.kind)) return normalizeGraphQlObjectType(type);
  if (type.kind === 'ENUM') return normalizeGraphQlEnumType(type);
  if (type.kind === 'SCALAR') return normalizeGraphQlScalarType(type);
  if (type.kind === 'UNION') return normalizeGraphQlUnionType(type);
  return { title: type.name ?? undefined, description: type.description ?? undefined };
}

function normalizeGraphQlEnumType(type: GraphQlIntrospectionType): DataSchema {
  return {
    type: 'string',
    title: type.name ?? undefined,
    description: type.description ?? undefined,
    enum: type.enumValues?.map((value) => value.name),
  };
}

function normalizeGraphQlScalarType(type: GraphQlIntrospectionType): DataSchema {
  return {
    ...normalizeGraphQlNamedScalar(type.name),
    title: type.name ?? undefined,
    description: type.description ?? undefined,
  };
}

function normalizeGraphQlUnionType(type: GraphQlIntrospectionType): DataSchema {
  return {
    title: type.name ?? undefined,
    description: type.description ?? undefined,
    anyOf: type.possibleTypes?.map(normalizeGraphQlTypeRef),
  };
}

function normalizeGraphQlObjectType(type: GraphQlIntrospectionType): DataSchema {
  const fields = type.kind === 'INPUT_OBJECT' ? type.inputFields : type.fields;
  const entries = (fields ?? []).map(
    (field) =>
      [
        field.name,
        {
          ...normalizeGraphQlTypeRef(field.type),
          description: field.description ?? undefined,
        },
      ] as const,
  );
  const required = (fields ?? [])
    .filter((field) => isGraphQlNonNull(field.type))
    .map((field) => field.name);
  return {
    type: 'object',
    title: type.name ?? undefined,
    description: type.description ?? undefined,
    required: required.length > 0 ? required : undefined,
    properties: Object.fromEntries(entries),
  };
}

function normalizeGraphQlTypeRef(type: GraphQlIntrospectionTypeRef): DataSchema {
  if (type.kind === 'NON_NULL' && type.ofType !== undefined && type.ofType !== null) {
    return { ...normalizeGraphQlTypeRef(type.ofType), nullable: false };
  }
  if (type.kind === 'LIST' && type.ofType !== undefined && type.ofType !== null) {
    return { type: 'array', items: normalizeGraphQlTypeRef(type.ofType) };
  }
  if (type.kind === 'SCALAR') return normalizeGraphQlNamedScalar(type.name);
  return type.name === undefined || type.name === null ? {} : { ref: { id: type.name } };
}

function normalizeGraphQlNamedScalar(name: string | null | undefined): DataSchema {
  if (name === 'Boolean') return { type: 'boolean' };
  if (name === 'Float') return { type: 'number' };
  if (name === 'ID' || name === 'String') return { type: 'string' };
  if (name === 'Int') return { type: 'integer' };
  return { type: 'string', format: name ?? undefined };
}

function isGraphQlNonNull(type: GraphQlIntrospectionTypeRef): boolean {
  return type.kind === 'NON_NULL';
}

function isNamedGraphQlType(type: GraphQlIntrospectionType): boolean {
  return type.name !== undefined && type.name !== null;
}
