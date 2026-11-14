import type { DataSchema, DataSourceDiagnostic } from '@ankhorage/contracts/data';

const SENSITIVE_NAME = /(?:api[_-]?key|authorization|credential|cookie|password|secret|token)/iu;

/** Projects a Data Sources schema using a secret-safe field allowlist. */
export function projectFlowDataSchema(
  schema: DataSchema,
  diagnostics: DataSourceDiagnostic[],
  path: string,
): DataSchema | undefined {
  if (schema.default !== undefined || schema.const !== undefined) {
    diagnostics.push(
      unsafeSchemaDiagnostic(`Schema '${path}' contains a default or constant value.`),
    );
    return undefined;
  }
  const children = projectChildren(schema, diagnostics, path);
  if (children === undefined) return undefined;
  return {
    ...projectSchemaIdentity(schema),
    ...projectSchemaComposition(schema, children),
  };
}

/** Copies primitive schema identity fields that carry no fixed request values. */
function projectSchemaIdentity(schema: DataSchema): DataSchema {
  return {
    ...(schema.type === undefined ? {} : { type: schema.type }),
    ...(schema.title === undefined ? {} : { title: schema.title }),
    ...(schema.description === undefined ? {} : { description: schema.description }),
    ...(schema.enum === undefined ? {} : { enum: schema.enum }),
    ...(schema.format === undefined ? {} : { format: schema.format }),
    ...(schema.nullable === undefined ? {} : { nullable: schema.nullable }),
    ...(schema.required === undefined ? {} : { required: schema.required }),
    ...(schema.ref === undefined ? {} : { ref: { id: schema.ref.id } }),
  };
}

/** Copies validated recursive schema composition fields. */
function projectSchemaComposition(
  schema: DataSchema,
  children: {
    readonly properties?: Readonly<Record<string, DataSchema>>;
    readonly items?: DataSchema;
    readonly allOf?: readonly DataSchema[];
    readonly anyOf?: readonly DataSchema[];
    readonly oneOf?: readonly DataSchema[];
  },
): DataSchema {
  return {
    ...(children.properties === undefined ? {} : { properties: children.properties }),
    ...(schema.additionalProperties === undefined || schema.additionalProperties === true
      ? {}
      : { additionalProperties: schema.additionalProperties }),
    ...(children.items === undefined ? {} : { items: children.items }),
    ...(children.allOf === undefined ? {} : { allOf: children.allOf }),
    ...(children.anyOf === undefined ? {} : { anyOf: children.anyOf }),
    ...(children.oneOf === undefined ? {} : { oneOf: children.oneOf }),
  };
}

/** Projects recursive schema members only when every member is safe. */
function projectChildren(
  schema: DataSchema,
  diagnostics: DataSourceDiagnostic[],
  path: string,
):
  | {
      readonly properties?: Readonly<Record<string, DataSchema>>;
      readonly items?: DataSchema;
      readonly allOf?: readonly DataSchema[];
      readonly anyOf?: readonly DataSchema[];
      readonly oneOf?: readonly DataSchema[];
    }
  | undefined {
  const properties = projectProperties(schema.properties, diagnostics, path);
  const items = projectOptional(schema.items, diagnostics, `${path}[]`);
  const allOf = projectList(schema.allOf, diagnostics, `${path}.allOf`);
  const anyOf = projectList(schema.anyOf, diagnostics, `${path}.anyOf`);
  const oneOf = projectList(schema.oneOf, diagnostics, `${path}.oneOf`);
  if (
    properties === undefined ||
    !isOptionalProjectionValid(schema, { items, allOf, anyOf, oneOf })
  )
    return undefined;
  return {
    properties,
    ...(items === undefined ? {} : { items }),
    ...(allOf === undefined ? {} : { allOf }),
    ...(anyOf === undefined ? {} : { anyOf }),
    ...(oneOf === undefined ? {} : { oneOf }),
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
  },
): boolean {
  return !(
    (schema.items !== undefined && projections.items === undefined) ||
    (schema.allOf !== undefined && projections.allOf === undefined) ||
    (schema.anyOf !== undefined && projections.anyOf === undefined) ||
    (schema.oneOf !== undefined && projections.oneOf === undefined)
  );
}

/** Projects object properties while rejecting names that imply secret-bearing input. */
function projectProperties(
  properties: DataSchema['properties'],
  diagnostics: DataSourceDiagnostic[],
  path: string,
): Readonly<Record<string, DataSchema>> | undefined {
  if (properties === undefined) return {};
  const entries = Object.entries(properties).map(([name, schema]) => {
    if (SENSITIVE_NAME.test(name)) {
      diagnostics.push(
        unsafeSchemaDiagnostic(`Schema '${path}.${name}' has an unsafe public name.`),
      );
      return undefined;
    }
    const projected = projectFlowDataSchema(schema, diagnostics, `${path}.${name}`);
    return projected === undefined ? undefined : ([name, projected] as const);
  });
  const publicEntries = entries.flatMap((entry) => (entry === undefined ? [] : [entry]));
  return publicEntries.length === entries.length ? Object.fromEntries(publicEntries) : undefined;
}

/** Projects one optional nested schema. */
function projectOptional(
  schema: DataSchema | undefined,
  diagnostics: DataSourceDiagnostic[],
  path: string,
): DataSchema | undefined {
  return schema === undefined ? undefined : projectFlowDataSchema(schema, diagnostics, path);
}

/** Projects alternatives only when every alternative is safe. */
function projectList(
  schemas: readonly DataSchema[] | undefined,
  diagnostics: DataSourceDiagnostic[],
  path: string,
): readonly DataSchema[] | undefined {
  if (schemas === undefined) return undefined;
  const projected = schemas.map((schema, index) =>
    projectFlowDataSchema(schema, diagnostics, `${path}.${index}`),
  );
  const publicSchemas = projected.flatMap((schema) => (schema === undefined ? [] : [schema]));
  return publicSchemas.length === schemas.length ? publicSchemas : undefined;
}

/** Creates a redaction-safe failure without embedding the rejected schema values. */
function unsafeSchemaDiagnostic(message: string): DataSourceDiagnostic {
  return { code: 'unsafe-flow-projection', message, severity: 'error' };
}
