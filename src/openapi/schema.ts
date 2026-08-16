import type {
  DataContractValue,
  DataSchema,
  DataSchemaPrimitiveType,
  DataSchemaRegistry,
  DataSourceDiagnostic,
} from '@ankhorage/contracts/data';

import type { OpenApiSchemaObject } from './types';

const DATA_SCHEMA_PRIMITIVES = [
  'array',
  'boolean',
  'integer',
  'null',
  'number',
  'object',
  'string',
] as const satisfies readonly DataSchemaPrimitiveType[];

export function normalizeOpenApiSchema(schema: OpenApiSchemaObject): DataSchema {
  return {
    ref: normalizeOpenApiSchemaRef(schema.$ref),
    type: normalizeSchemaType(schema.type),
    title: schema.title,
    description: schema.description,
    enum: schema.enum,
    const: schema.const,
    default: schema.default,
    format: schema.format,
    nullable: schema.nullable,
    required: schema.required,
    properties: normalizeSchemaRecord(schema.properties),
    additionalProperties: normalizeAdditionalProperties(schema.additionalProperties),
    items: schema.items === undefined ? undefined : normalizeOpenApiSchema(schema.items),
    allOf: normalizeSchemaList(schema.allOf),
    anyOf: normalizeSchemaList(schema.anyOf),
    oneOf: normalizeSchemaList(schema.oneOf),
  };
}

export function normalizeOpenApiSchemas(
  schemas: Readonly<Record<string, OpenApiSchemaObject>> | undefined,
  apiId: string,
  diagnostics: DataSourceDiagnostic[],
): DataSchemaRegistry | undefined {
  if (schemas === undefined) return undefined;
  return Object.fromEntries(
    Object.entries(schemas).map(([schemaId, schema]) => {
      collectUnsupportedSchemaDiagnostics(
        schema,
        apiId,
        `components.schemas.${schemaId}`,
        diagnostics,
      );
      return [schemaId, normalizeOpenApiSchema(schema)];
    }),
  );
}

function normalizeOpenApiSchemaRef(ref: string | undefined): { readonly id: string } | undefined {
  if (ref === undefined) return undefined;
  const prefix = '#/components/schemas/';
  return { id: ref.startsWith(prefix) ? ref.slice(prefix.length) : ref };
}

function normalizeSchemaRecord(
  record: Readonly<Record<string, OpenApiSchemaObject>> | undefined,
): Readonly<Record<string, DataSchema>> | undefined {
  if (record === undefined) return undefined;
  return Object.fromEntries(
    Object.entries(record).map(([key, schema]) => [key, normalizeOpenApiSchema(schema)]),
  );
}

function normalizeSchemaList(
  list: readonly OpenApiSchemaObject[] | undefined,
): readonly DataSchema[] | undefined {
  return list?.map(normalizeOpenApiSchema);
}

function normalizeAdditionalProperties(
  value: boolean | OpenApiSchemaObject | undefined,
): boolean | DataSchema | undefined {
  if (value === undefined || typeof value === 'boolean') return value;
  return normalizeOpenApiSchema(value);
}

function normalizeSchemaType(
  type: string | readonly string[] | undefined,
): DataSchemaPrimitiveType | readonly DataSchemaPrimitiveType[] | undefined {
  if (type === undefined) return undefined;
  if (typeof type === 'string') return isDataSchemaPrimitive(type) ? type : undefined;
  return type.filter(isDataSchemaPrimitive);
}

function isDataSchemaPrimitive(type: string): type is DataSchemaPrimitiveType {
  return DATA_SCHEMA_PRIMITIVES.some((primitive) => primitive === type);
}

function collectUnsupportedSchemaDiagnostics(
  schema: OpenApiSchemaObject,
  apiId: string,
  path: string,
  diagnostics: DataSourceDiagnostic[],
): void {
  if (typeof schema.type === 'string' && !isDataSchemaPrimitive(schema.type)) {
    diagnostics.push({
      code: 'unsupported-schema',
      apiId,
      message: `OpenAPI schema type '${schema.type}' is not supported by the normalized schema model.`,
      path: `${path}.type`,
      severity: 'warning',
    });
  }

  for (const [propertyName, propertySchema] of Object.entries(schema.properties ?? {})) {
    collectUnsupportedSchemaDiagnostics(
      propertySchema,
      apiId,
      `${path}.properties.${propertyName}`,
      diagnostics,
    );
  }
  if (schema.items !== undefined) {
    collectUnsupportedSchemaDiagnostics(schema.items, apiId, `${path}.items`, diagnostics);
  }
}
