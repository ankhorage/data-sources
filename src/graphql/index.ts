import type {
  CredentialRef,
  DataContractValue,
  DataEndpointConfig,
  DataOperationConfig,
  DataOperationIntent,
  DataOperationResponse,
  DataSchema,
  DataSchemaRegistry,
  DataSourceDiagnostic,
  DataSourceDiagnosticResult,
  GraphQlDataSourceConfig,
  OperationId,
} from '@ankhorage/contracts/data';

export const GRAPHQL_INTROSPECTION_QUERY = `query AnkhorageGraphQlIntrospection {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      kind
      name
      description
      fields {
        name
        description
        args {
          name
          description
          type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }
          defaultValue
        }
        type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }
      }
      inputFields {
        name
        description
        type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }
        defaultValue
      }
      enumValues { name description }
      possibleTypes { kind name }
    }
  }
}`;

export type GraphQlOperationKind = 'mutation' | 'query' | 'subscription';

export interface GraphQlIntrospectionTypeRef {
  readonly kind: string;
  readonly name?: string | null;
  readonly ofType?: GraphQlIntrospectionTypeRef | null;
}

export interface GraphQlIntrospectionInputValue {
  readonly name: string;
  readonly description?: string | null;
  readonly type: GraphQlIntrospectionTypeRef;
  readonly defaultValue?: string | null;
}

export interface GraphQlIntrospectionField {
  readonly name: string;
  readonly description?: string | null;
  readonly args?: readonly GraphQlIntrospectionInputValue[] | null;
  readonly type: GraphQlIntrospectionTypeRef;
}

export interface GraphQlIntrospectionEnumValue {
  readonly name: string;
  readonly description?: string | null;
}

export interface GraphQlIntrospectionType {
  readonly kind: string;
  readonly name?: string | null;
  readonly description?: string | null;
  readonly fields?: readonly GraphQlIntrospectionField[] | null;
  readonly inputFields?: readonly GraphQlIntrospectionInputValue[] | null;
  readonly enumValues?: readonly GraphQlIntrospectionEnumValue[] | null;
  readonly possibleTypes?: readonly GraphQlIntrospectionTypeRef[] | null;
}

export interface GraphQlIntrospectionSchema {
  readonly queryType?: { readonly name?: string | null } | null;
  readonly mutationType?: { readonly name?: string | null } | null;
  readonly subscriptionType?: { readonly name?: string | null } | null;
  readonly types?: readonly GraphQlIntrospectionType[] | null;
}

export interface GraphQlIntrospectionResult {
  readonly __schema?: GraphQlIntrospectionSchema;
}

export interface GraphQlOperationDefinition {
  readonly id: OperationId;
  readonly kind: GraphQlOperationKind;
  readonly name?: string;
  readonly description?: string;
  readonly document?: string;
  readonly variables?: DataSchema;
  readonly response?: DataSchema;
  readonly selectionPath?: string;
  readonly metadata?: DataContractValue;
}

export interface GraphQlDataSourceDefinition {
  readonly id: string;
  readonly endpointUrl: string;
  readonly name?: string;
  readonly description?: string;
  readonly credential?: CredentialRef;
  readonly introspection?: GraphQlIntrospectionResult;
  readonly introspectionEnabled?: boolean;
  readonly schemaVersion?: string;
  readonly operations?: readonly GraphQlOperationDefinition[];
  readonly metadata?: DataContractValue;
}

export interface GraphQlIntrospectionRequest {
  readonly query: typeof GRAPHQL_INTROSPECTION_QUERY;
  readonly operationName: 'AnkhorageGraphQlIntrospection';
}

export function createGraphQlIntrospectionRequest(): GraphQlIntrospectionRequest {
  return {
    query: GRAPHQL_INTROSPECTION_QUERY,
    operationName: 'AnkhorageGraphQlIntrospection',
  };
}

export function normalizeGraphQlOperationId(kind: GraphQlOperationKind, name: string): OperationId {
  const normalizedName = name
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return normalizedName.length > 0 ? `${kind}.${normalizedName}` : `${kind}.operation`;
}

export function createGraphQlDataSource(
  definition: GraphQlDataSourceDefinition,
): DataSourceDiagnosticResult<GraphQlDataSourceConfig> {
  const diagnostics = validateGraphQlDataSource(definition);
  const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');

  if (hasErrors) return { ok: false, diagnostics };

  return {
    ok: true,
    data: normalizeGraphQlDataSource(definition),
    diagnostics,
  };
}

export function validateGraphQlDataSource(
  definition: GraphQlDataSourceDefinition,
): readonly DataSourceDiagnostic[] {
  const diagnostics: DataSourceDiagnostic[] = [];

  if (definition.endpointUrl.trim().length === 0) {
    diagnostics.push({
      code: 'invalid-config',
      dataSourceId: definition.id,
      message: 'GraphQL data source requires a non-empty endpointUrl.',
      path: 'endpointUrl',
      severity: 'error',
    });
  }

  if (definition.introspectionEnabled === false && definition.introspection !== undefined) {
    diagnostics.push({
      code: 'invalid-config',
      dataSourceId: definition.id,
      message: 'GraphQL introspection data was provided while introspection is disabled.',
      path: 'introspection',
      severity: 'warning',
    });
  }

  if (definition.introspectionEnabled !== false && definition.introspection === undefined) {
    diagnostics.push({
      code: 'missing-schema',
      dataSourceId: definition.id,
      message: 'GraphQL introspection result was not provided. Manual operations can still be used.',
      path: 'introspection',
      severity: 'info',
    });
  }

  return diagnostics;
}

export function normalizeGraphQlDataSource(definition: GraphQlDataSourceDefinition): GraphQlDataSourceConfig {
  const schemas = normalizeGraphQlIntrospectionSchemas(definition.introspection);
  const introspectionOperations = normalizeGraphQlIntrospectionOperations(definition.introspection);
  const manualOperations = definition.operations ?? [];
  const operations: Record<OperationId, DataOperationConfig> = {};

  for (const operation of [...introspectionOperations, ...manualOperations]) {
    operations[operation.id] = normalizeGraphQlOperation(operation);
  }

  const endpoint: DataEndpointConfig = {
    id: 'graphql',
    kind: 'graphql',
    baseUrl: definition.endpointUrl,
    credential: definition.credential,
    operations,
    metadata: {
      source: 'graphql',
    },
  };

  return {
    id: definition.id,
    kind: 'graphql',
    name: definition.name,
    description: definition.description,
    endpointUrl: definition.endpointUrl,
    credential: definition.credential,
    endpoints: {
      graphql: endpoint,
    },
    schemas,
    introspection: {
      enabled: definition.introspectionEnabled ?? definition.introspection !== undefined,
      schemaVersion: definition.schemaVersion,
    },
    metadata: definition.metadata,
  };
}

export function normalizeGraphQlIntrospectionSchemas(
  introspection: GraphQlIntrospectionResult | undefined,
): DataSchemaRegistry | undefined {
  const types = introspection?.__schema?.types?.filter(isNamedGraphQlType) ?? [];
  if (types.length === 0) return undefined;

  const schemas: Record<string, DataSchema> = {};

  for (const type of types) {
    if (type.name === undefined || type.name === null || type.name.startsWith('__')) continue;
    schemas[type.name] = normalizeGraphQlType(type);
  }

  return schemas;
}

export function normalizeGraphQlIntrospectionOperations(
  introspection: GraphQlIntrospectionResult | undefined,
): readonly GraphQlOperationDefinition[] {
  const schema = introspection?.__schema;
  if (schema === undefined) return [];

  const types = schema.types?.filter(isNamedGraphQlType) ?? [];
  const operations: GraphQlOperationDefinition[] = [];

  appendRootOperations(operations, 'query', schema.queryType?.name, types);
  appendRootOperations(operations, 'mutation', schema.mutationType?.name, types);
  appendRootOperations(operations, 'subscription', schema.subscriptionType?.name, types);

  return operations;
}

function appendRootOperations(
  operations: GraphQlOperationDefinition[],
  kind: GraphQlOperationKind,
  rootTypeName: string | null | undefined,
  types: readonly GraphQlIntrospectionType[],
): void {
  if (rootTypeName === undefined || rootTypeName === null) return;

  const rootType = types.find((type) => type.name === rootTypeName);
  for (const field of rootType?.fields ?? []) {
    operations.push({
      id: normalizeGraphQlOperationId(kind, field.name),
      kind,
      name: field.name,
      description: field.description ?? undefined,
      variables: normalizeGraphQlVariablesSchema(field.args ?? []),
      response: normalizeGraphQlTypeRef(field.type),
      selectionPath: `$.data.${field.name}`,
      metadata: {
        rootType: rootTypeName,
        source: 'introspection',
      },
    });
  }
}

function normalizeGraphQlOperation(operation: GraphQlOperationDefinition): DataOperationConfig {
  const response: DataOperationResponse | undefined =
    operation.response === undefined
      ? undefined
      : {
          schema: operation.response,
        };

  return {
    id: operation.id,
    endpointId: 'graphql',
    name: operation.name,
    description: operation.description,
    protocol: 'graphql',
    intent: mapGraphQlOperationKindToIntent(operation.kind),
    request: {
      schema: operation.variables,
    },
    response,
    metadata: {
      ...toMetadataRecord(operation.metadata),
      document: operation.document,
      kind: operation.kind,
      selectionPath: operation.selectionPath,
    },
  };
}

function mapGraphQlOperationKindToIntent(kind: GraphQlOperationKind): DataOperationIntent {
  if (kind === 'query' || kind === 'subscription') return 'read';
  return 'action';
}

function normalizeGraphQlVariablesSchema(args: readonly GraphQlIntrospectionInputValue[]): DataSchema {
  const properties: Record<string, DataSchema> = {};
  const required: string[] = [];

  for (const arg of args) {
    properties[arg.name] = {
      ...normalizeGraphQlTypeRef(arg.type),
      description: arg.description ?? undefined,
      default: arg.defaultValue ?? undefined,
    };
    if (isGraphQlNonNull(arg.type)) required.push(arg.name);
  }

  return {
    type: 'object',
    required: required.length > 0 ? required : undefined,
    properties,
  };
}

function normalizeGraphQlType(type: GraphQlIntrospectionType): DataSchema {
  if (type.kind === 'OBJECT' || type.kind === 'INTERFACE' || type.kind === 'INPUT_OBJECT') {
    return normalizeGraphQlObjectType(type);
  }

  if (type.kind === 'ENUM') {
    return {
      type: 'string',
      title: type.name ?? undefined,
      description: type.description ?? undefined,
      enum: type.enumValues?.map((value) => value.name),
    };
  }

  if (type.kind === 'SCALAR') {
    return {
      ...normalizeGraphQlNamedScalar(type.name),
      title: type.name ?? undefined,
      description: type.description ?? undefined,
    };
  }

  if (type.kind === 'UNION') {
    return {
      title: type.name ?? undefined,
      description: type.description ?? undefined,
      anyOf: type.possibleTypes?.map((possibleType) => normalizeGraphQlTypeRef(possibleType)),
    };
  }

  return {
    title: type.name ?? undefined,
    description: type.description ?? undefined,
  };
}

function normalizeGraphQlObjectType(type: GraphQlIntrospectionType): DataSchema {
  const fields = type.kind === 'INPUT_OBJECT' ? type.inputFields : type.fields;
  const properties: Record<string, DataSchema> = {};
  const required: string[] = [];

  for (const field of fields ?? []) {
    const fieldType = 'type' in field ? field.type : undefined;
    if (fieldType === undefined) continue;

    properties[field.name] = {
      ...normalizeGraphQlTypeRef(fieldType),
      description: field.description ?? undefined,
    };

    if (isGraphQlNonNull(fieldType)) required.push(field.name);
  }

  return {
    type: 'object',
    title: type.name ?? undefined,
    description: type.description ?? undefined,
    required: required.length > 0 ? required : undefined,
    properties,
  };
}

function normalizeGraphQlTypeRef(type: GraphQlIntrospectionTypeRef): DataSchema {
  if (type.kind === 'NON_NULL' && type.ofType !== undefined && type.ofType !== null) {
    return {
      ...normalizeGraphQlTypeRef(type.ofType),
      nullable: false,
    };
  }

  if (type.kind === 'LIST' && type.ofType !== undefined && type.ofType !== null) {
    return {
      type: 'array',
      items: normalizeGraphQlTypeRef(type.ofType),
    };
  }

  if (type.kind === 'SCALAR') {
    return normalizeGraphQlNamedScalar(type.name);
  }

  if (type.name !== undefined && type.name !== null) {
    return { ref: { id: type.name } };
  }

  return {};
}

function normalizeGraphQlNamedScalar(name: string | null | undefined): DataSchema {
  if (name === 'Boolean') return { type: 'boolean' };
  if (name === 'Float') return { type: 'number' };
  if (name === 'ID' || name === 'String') return { type: 'string' };
  if (name === 'Int') return { type: 'integer' };

  return {
    type: 'string',
    format: name ?? undefined,
  };
}

function isGraphQlNonNull(type: GraphQlIntrospectionTypeRef): boolean {
  return type.kind === 'NON_NULL';
}

function isNamedGraphQlType(type: GraphQlIntrospectionType): boolean {
  return type.name !== undefined && type.name !== null;
}

function toMetadataRecord(value: DataContractValue | undefined): Record<string, DataContractValue> {
  if (value !== undefined && typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return { ...value };
  }

  return {};
}
