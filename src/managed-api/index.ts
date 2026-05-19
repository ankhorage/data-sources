import type {
  AdapterRef,
  DataContractValue,
  DataEndpointConfig,
  DataOperationConfig,
  DataOperationIntent,
  DataOperationParameter,
  DataSchema,
  DataSourceDiagnostic,
  DataSourceDiagnosticResult,
  ManagedApiDataSourceConfig,
  ManagedApiResourceConfig,
  OperationId,
} from '@ankhorage/contracts/data';
import type {
  DbCollectionDefinition,
  DbFieldDefinition,
  DbFieldType,
} from '@ankhorage/contracts/db';

export const MANAGED_API_CRUD_OPERATIONS = ['list', 'read', 'create', 'update', 'delete'] as const;

export type ManagedApiCrudOperation = (typeof MANAGED_API_CRUD_OPERATIONS)[number];

export interface ManagedApiOperationPolicyRef {
  readonly id: string;
  readonly operation?: string;
}

export interface ManagedApiGenerationResourceDefinition {
  readonly name: string;
  readonly collection: DbCollectionDefinition;
  readonly operations?: readonly ManagedApiCrudOperation[];
  readonly policies?: readonly ManagedApiOperationPolicyRef[];
}

export interface ManagedApiGenerationDefinition {
  readonly id: string;
  readonly adapter: AdapterRef;
  readonly name?: string;
  readonly description?: string;
  readonly resources: readonly ManagedApiGenerationResourceDefinition[];
}

export function createManagedApiDataSource(
  definition: ManagedApiGenerationDefinition,
): DataSourceDiagnosticResult<ManagedApiDataSourceConfig> {
  const diagnostics = validateManagedApiDefinition(definition);
  const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === 'error');

  if (hasErrors) return { ok: false, diagnostics };

  return {
    ok: true,
    data: normalizeManagedApiDataSource(definition),
    diagnostics,
  };
}

export function validateManagedApiDefinition(
  definition: ManagedApiGenerationDefinition,
): readonly DataSourceDiagnostic[] {
  const diagnostics: DataSourceDiagnostic[] = [];

  if (definition.resources.length === 0) {
    diagnostics.push({
      code: 'invalid-config',
      dataSourceId: definition.id,
      message: 'Managed API generation requires at least one resource.',
      path: 'resources',
      severity: 'error',
    });
  }

  for (const resource of definition.resources) {
    if (resource.name.trim().length === 0) {
      diagnostics.push({
        code: 'invalid-config',
        dataSourceId: definition.id,
        endpointId: resource.name,
        message: 'Managed API resource names must be non-empty.',
        path: 'resources.name',
        severity: 'error',
      });
    }

    if (resource.collection.name.trim().length === 0) {
      diagnostics.push({
        code: 'invalid-config',
        dataSourceId: definition.id,
        endpointId: resource.name,
        message: 'Managed API resource collections must have a non-empty name.',
        path: `resources.${resource.name}.collection.name`,
        severity: 'error',
      });
    }

    const primaryKey = resolveManagedApiPrimaryKey(resource.collection);
    if (
      primaryKey === undefined &&
      getManagedApiOperations(resource).some((operation) => operation !== 'list')
    ) {
      diagnostics.push({
        code: 'invalid-config',
        dataSourceId: definition.id,
        endpointId: resource.name,
        message:
          'Managed API resources need a primaryKey field when generating read/create/update/delete operations.',
        path: `resources.${resource.name}.collection.primaryKey`,
        severity: 'error',
      });
    }
  }

  return diagnostics;
}

export function normalizeManagedApiDataSource(
  definition: ManagedApiGenerationDefinition,
): ManagedApiDataSourceConfig {
  const resources: ManagedApiResourceConfig[] = [];
  const endpoints: Record<string, DataEndpointConfig> = {};
  const schemas: Record<string, DataSchema> = {};

  for (const resource of definition.resources) {
    const operations = getManagedApiOperations(resource);
    const resourceConfig: ManagedApiResourceConfig = {
      name: resource.name,
      collection: resource.collection,
      operations,
      metadata: createManagedApiResourceMetadata(resource),
    };

    resources.push(resourceConfig);
    endpoints[resource.name] = createManagedApiEndpoint(definition, resource, operations);
    schemas[resource.name] = createManagedApiResourceSchema(resource.collection);
  }

  return {
    id: definition.id,
    kind: 'managed-api',
    name: definition.name,
    description: definition.description,
    adapter: definition.adapter,
    resources,
    endpoints,
    schemas,
  };
}

export function createManagedApiEndpoint(
  definition: ManagedApiGenerationDefinition,
  resource: ManagedApiGenerationResourceDefinition,
  operations: readonly ManagedApiCrudOperation[] = getManagedApiOperations(resource),
): DataEndpointConfig {
  const operationConfigs: Record<OperationId, DataOperationConfig> = {};

  for (const operation of operations) {
    const operationConfig = createManagedApiOperation(definition, resource, operation);
    operationConfigs[operationConfig.id] = operationConfig;
  }

  return {
    id: resource.name,
    kind: 'database',
    operations: operationConfigs,
    metadata: {
      adapterId: definition.adapter.id,
      collection: resource.collection.name,
      schema: resource.collection.schema ?? null,
      source: 'managed-api',
    },
  };
}

export function createManagedApiOperation(
  definition: ManagedApiGenerationDefinition,
  resource: ManagedApiGenerationResourceDefinition,
  operation: ManagedApiCrudOperation,
): DataOperationConfig {
  const operationId = createManagedApiOperationId(resource.name, operation);
  const primaryKey = resolveManagedApiPrimaryKey(resource.collection);
  const primaryKeyParameter =
    primaryKey === undefined ? undefined : createPrimaryKeyParameter(primaryKey);

  return {
    id: operationId,
    endpointId: resource.name,
    name: createManagedApiOperationName(resource.name, operation),
    protocol: 'database',
    intent: mapManagedApiOperationIntent(operation),
    request: createManagedApiOperationRequest(resource.collection, operation, primaryKeyParameter),
    response: createManagedApiOperationResponse(resource.collection, operation),
    metadata: {
      adapterId: definition.adapter.id,
      collection: resource.collection.name,
      operation,
      schema: resource.collection.schema ?? null,
      source: 'managed-api',
    },
  };
}

export function getManagedApiOperations(
  resource: ManagedApiGenerationResourceDefinition,
): readonly ManagedApiCrudOperation[] {
  return resource.operations ?? MANAGED_API_CRUD_OPERATIONS;
}

export function createManagedApiOperationId(
  resourceName: string,
  operation: ManagedApiCrudOperation,
): OperationId {
  return `${resourceName}.${operation}`;
}

export function createManagedApiResourceSchema(collection: DbCollectionDefinition): DataSchema {
  const properties: Record<string, DataSchema> = {};
  const required: string[] = [];

  for (const field of collection.fields) {
    properties[field.name] = createManagedApiFieldSchema(field);
    if (field.required === true) required.push(field.name);
  }

  return {
    type: 'object',
    title: collection.name,
    required: required.length > 0 ? required : undefined,
    properties,
  };
}

function createManagedApiResourceMetadata(
  resource: ManagedApiGenerationResourceDefinition,
): DataContractValue | undefined {
  if (resource.policies === undefined) return undefined;

  return {
    policies: resource.policies.map((policy) => {
      const metadata: Record<string, DataContractValue> = {
        id: policy.id,
      };

      if (policy.operation !== undefined) {
        metadata.operation = policy.operation;
      }

      return metadata;
    }),
  };
}

function createManagedApiOperationName(
  resourceName: string,
  operation: ManagedApiCrudOperation,
): string {
  return `${operation} ${resourceName}`;
}

function mapManagedApiOperationIntent(operation: ManagedApiCrudOperation): DataOperationIntent {
  if (operation === 'list' || operation === 'read') return 'read';
  if (operation === 'create') return 'create';
  if (operation === 'update') return 'update';
  return 'delete';
}

function createManagedApiOperationRequest(
  collection: DbCollectionDefinition,
  operation: ManagedApiCrudOperation,
  primaryKeyParameter: DataOperationParameter | undefined,
): DataOperationConfig['request'] {
  if (operation === 'list') {
    return {
      parameters: [
        {
          name: 'limit',
          location: 'query',
          schema: { type: 'integer' },
        },
        {
          name: 'offset',
          location: 'query',
          schema: { type: 'integer' },
        },
      ],
    };
  }

  if (operation === 'read' || operation === 'delete') {
    return primaryKeyParameter === undefined ? undefined : { parameters: [primaryKeyParameter] };
  }

  const parameters =
    operation === 'update' && primaryKeyParameter !== undefined ? [primaryKeyParameter] : undefined;

  return {
    parameters,
    schema: createManagedApiResourceSchema(collection),
  };
}

function createManagedApiOperationResponse(
  collection: DbCollectionDefinition,
  operation: ManagedApiCrudOperation,
): DataOperationConfig['response'] {
  const resourceSchema = createManagedApiResourceSchema(collection);

  if (operation === 'list') {
    return {
      schema: {
        type: 'array',
        items: resourceSchema,
      },
    };
  }

  if (operation === 'delete') {
    return {
      schema: {
        type: 'object',
        properties: {
          deleted: { type: 'boolean' },
        },
      },
    };
  }

  return { schema: resourceSchema };
}

function createPrimaryKeyParameter(primaryKey: string): DataOperationParameter {
  return {
    name: primaryKey,
    location: 'path',
    required: true,
    schema: {
      type: 'string',
    },
  };
}

function resolveManagedApiPrimaryKey(collection: DbCollectionDefinition): string | undefined {
  if (collection.primaryKey !== undefined) return collection.primaryKey;
  return collection.fields.find((field) => field.unique === true)?.name;
}

function createManagedApiFieldSchema(field: DbFieldDefinition): DataSchema {
  const schema: DataSchema = mapDbFieldTypeToDataSchema(field.type);

  return {
    ...schema,
    default: field.defaultValue,
  };
}

function mapDbFieldTypeToDataSchema(type: DbFieldType): DataSchema {
  if (type === 'boolean') return { type: 'boolean' };
  if (type === 'datetime') return { type: 'string', format: 'date-time' };
  if (type === 'json') return { type: 'object' };
  if (type === 'number') return { type: 'number' };
  if (type === 'uuid') return { type: 'string', format: 'uuid' };
  return { type: 'string' };
}
