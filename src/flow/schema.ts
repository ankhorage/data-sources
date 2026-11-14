import type { DataSchema, DataSourceDiagnostic } from '@ankhorage/contracts/data';

/** Projects a Data Sources schema using a secret-safe field allowlist. */
export function projectFlowDataSchema(
  schema: DataSchema,
  diagnostics: DataSourceDiagnostic[],
  path: string,
  createFieldHandle: (name: string) => string,
): DataSchema | undefined {
  if (schema.default !== undefined || schema.const !== undefined) {
    diagnostics.push(
      unsafeSchemaDiagnostic(`Schema '${path}' contains a default or constant value.`),
    );
    return undefined;
  }
  const children = projectChildren(schema, diagnostics, path, createFieldHandle);
  if (children === undefined) return undefined;
  return {
    ...projectSchemaIdentity(schema),
    ...projectSchemaComposition(schema, children, diagnostics, path, createFieldHandle),
  };
}

/** Copies only schema shape fields whose values are closed, typed declarations. */
function projectSchemaIdentity(schema: DataSchema): DataSchema {
  return {
    ...(schema.type === undefined ? {} : { type: schema.type }),
    ...(schema.nullable === undefined ? {} : { nullable: schema.nullable }),
  };
}

/** Copies validated recursive schema composition fields. */
function projectSchemaComposition(
  schema: DataSchema,
  children: {
    readonly items?: DataSchema;
    readonly allOf?: readonly DataSchema[];
    readonly anyOf?: readonly DataSchema[];
    readonly oneOf?: readonly DataSchema[];
    readonly additionalProperties?: boolean | DataSchema;
  },
  diagnostics: DataSourceDiagnostic[],
  path: string,
  createFieldHandle: (name: string) => string,
): DataSchema {
  return {
    ...(children.additionalProperties === undefined
      ? {}
      : { additionalProperties: children.additionalProperties }),
    ...(children.items === undefined ? {} : { items: children.items }),
    ...(children.allOf === undefined ? {} : { allOf: children.allOf }),
    ...(children.anyOf === undefined ? {} : { anyOf: children.anyOf }),
    ...(children.oneOf === undefined ? {} : { oneOf: children.oneOf }),
    ...projectProperties(schema, diagnostics, path, createFieldHandle),
  };
}

/** Projects recursive schema members only when every member is safe. */
function projectChildren(
  schema: DataSchema,
  diagnostics: DataSourceDiagnostic[],
  path: string,
  createFieldHandle: (name: string) => string,
):
  | {
      readonly items?: DataSchema;
      readonly allOf?: readonly DataSchema[];
      readonly anyOf?: readonly DataSchema[];
      readonly oneOf?: readonly DataSchema[];
      readonly additionalProperties?: boolean | DataSchema;
    }
  | undefined {
  const items = projectOptional(schema.items, diagnostics, `${path}[]`, createFieldHandle);
  const allOf = projectList(schema.allOf, diagnostics, `${path}.allOf`, createFieldHandle);
  const anyOf = projectList(schema.anyOf, diagnostics, `${path}.anyOf`, createFieldHandle);
  const oneOf = projectList(schema.oneOf, diagnostics, `${path}.oneOf`, createFieldHandle);
  const additionalProperties = projectOptionalSchema(
    schema.additionalProperties,
    diagnostics,
    `${path}.*`,
    createFieldHandle,
  );
  if (!isOptionalProjectionValid(schema, { items, allOf, anyOf, oneOf, additionalProperties }))
    return undefined;
  return {
    ...(items === undefined ? {} : { items }),
    ...(allOf === undefined ? {} : { allOf }),
    ...(anyOf === undefined ? {} : { anyOf }),
    ...(oneOf === undefined ? {} : { oneOf }),
    ...(additionalProperties === undefined ? {} : { additionalProperties }),
  };
}

/** Replaces every source property identity with a registry-owned opaque field handle. */
function projectProperties(
  schema: DataSchema,
  diagnostics: DataSourceDiagnostic[],
  path: string,
  createFieldHandle: (name: string) => string,
): Pick<DataSchema, 'properties' | 'required'> {
  if (schema.properties === undefined) return {};
  const handles = new Map<string, string>();
  const properties = Object.fromEntries(
    Object.entries(schema.properties).flatMap(([name, child]) => {
      const handle = createFieldHandle(name);
      handles.set(name, handle);
      const projected = projectFlowDataSchema(
        child,
        diagnostics,
        `${path}.property`,
        createFieldHandle,
      );
      return projected === undefined ? [] : [[handle, projected]];
    }),
  );
  return {
    properties,
    ...(schema.required === undefined
      ? {}
      : { required: schema.required.flatMap((name) => handles.get(name) ?? []) }),
  };
}

/** Checks whether absent optional projections correspond to absent source members. */
function isOptionalProjectionValid(
  schema: DataSchema,
  projections: {
    readonly items?: DataSchema;
    readonly allOf?: readonly DataSchema[];
    readonly anyOf?: readonly DataSchema[];
    readonly oneOf?: readonly DataSchema[];
    readonly additionalProperties?: boolean | DataSchema;
  },
): boolean {
  return !(
    (schema.items !== undefined && projections.items === undefined) ||
    (schema.allOf !== undefined && projections.allOf === undefined) ||
    (schema.anyOf !== undefined && projections.anyOf === undefined) ||
    (schema.oneOf !== undefined && projections.oneOf === undefined) ||
    (schema.additionalProperties !== undefined && projections.additionalProperties === undefined)
  );
}

/** Recursively projects schema-valued additional properties without copying arbitrary values. */
function projectOptionalSchema(
  value: DataSchema['additionalProperties'],
  diagnostics: DataSourceDiagnostic[],
  path: string,
  createFieldHandle: (name: string) => string,
): boolean | DataSchema | undefined {
  if (value === undefined || typeof value === 'boolean') return value;
  return projectFlowDataSchema(value, diagnostics, path, createFieldHandle);
}

/** Projects one optional nested schema. */
function projectOptional(
  schema: DataSchema | undefined,
  diagnostics: DataSourceDiagnostic[],
  path: string,
  createFieldHandle: (name: string) => string,
): DataSchema | undefined {
  return schema === undefined
    ? undefined
    : projectFlowDataSchema(schema, diagnostics, path, createFieldHandle);
}

/** Projects alternatives only when every alternative is safe. */
function projectList(
  schemas: readonly DataSchema[] | undefined,
  diagnostics: DataSourceDiagnostic[],
  path: string,
  createFieldHandle: (name: string) => string,
): readonly DataSchema[] | undefined {
  if (schemas === undefined) return undefined;
  const projected = schemas.map((schema, index) =>
    projectFlowDataSchema(schema, diagnostics, `${path}.${index}`, createFieldHandle),
  );
  const publicSchemas = projected.flatMap((schema) => (schema === undefined ? [] : [schema]));
  return publicSchemas.length === schemas.length ? publicSchemas : undefined;
}

/** Creates a redaction-safe failure without embedding the rejected schema values. */
function unsafeSchemaDiagnostic(message: string): DataSourceDiagnostic {
  return { code: 'unsafe-flow-projection', message, severity: 'error' };
}
