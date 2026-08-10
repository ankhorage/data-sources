import type {
  DataContractValue,
  DataEndpointConfig,
  DataOperationConfig,
  DataOperationIntent,
  DataOperationParameter,
  DataSchema,
  DataSourceDiagnostic,
  DataSourceDiagnosticResult,
  GeneratedApiAuthRequirement,
  GeneratedApiCrudOperation,
  GeneratedApiDefinition,
  GeneratedApiOperationPolicyRef,
  GeneratedApiResourceDefinition,
  GeneratedRestApiDataSourceConfig,
  OperationId,
} from '@ankhorage/contracts/data';
import type {
  DbCollectionDefinition,
  DbFieldDefinition,
  DbFieldType,
} from '@ankhorage/contracts/db';

import { validateGeneratedApiCollection } from './validateGeneratedApiCollection';

export function createGeneratedApiDataSource(
  definition: GeneratedApiDefinition,
): DataSourceDiagnosticResult<GeneratedRestApiDataSourceConfig> {
  const diagnostics = validateGeneratedApiDefinition(definition);
  if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return { ok: false, diagnostics };
  }

  return {
    ok: true,
    data: normalizeGeneratedApiDataSource(definition),
    diagnostics,
  };
}

export function validateGeneratedApiDefinition(
  definition: GeneratedApiDefinition,
): readonly DataSourceDiagnostic[] {
  const diagnostics: DataSourceDiagnostic[] = [];
  const resourceIds = new Set<string>();

  if (definition.basePath.trim().length === 0 || !definition.basePath.startsWith('/')) {
    diagnostics.push({
      code: 'invalid-config',
      dataSourceId: definition.id,
      message: 'Generated API basePath must be a non-empty absolute path.',
      path: 'basePath',
      severity: 'error',
    });
  }

  if (definition.resources.length === 0) {
    diagnostics.push({
      code: 'invalid-config',
      dataSourceId: definition.id,
      message: 'Generated API requires at least one resource.',
      path: 'resources',
      severity: 'error',
    });
  }

  for (const resource of definition.resources) {
    validateGeneratedApiResource(definition, resource, resourceIds, diagnostics);
  }

  return diagnostics;
}

export function normalizeGeneratedApiDataSource(
  definition: GeneratedApiDefinition,
): GeneratedRestApiDataSourceConfig {
  const endpoints: Record<string, DataEndpointConfig> = {};
  const schemas: Record<string, DataSchema> = {};

  for (const resource of definition.resources) {
    endpoints[resource.id] = createGeneratedApiEndpoint(definition, resource);
    schemas[resource.id] = createGeneratedApiResourceSchema(resource.collection);
  }

  return {
    id: definition.id,
    kind: 'api',
    origin: 'generated',
    protocol: 'rest',
    generatedApiId: definition.id,
    name: definition.name,
    description: definition.description,
    adapter: definition.database,
    endpoints,
    schemas,
    metadata: createGeneratedApiSourceMetadata(definition),
  };
}

export function createGeneratedApiEndpoint(
  definition: GeneratedApiDefinition,
  resource: GeneratedApiResourceDefinition,
): DataEndpointConfig {
  const operations: Record<OperationId, DataOperationConfig> = {};

  for (const operation of resource.operations) {
    const config = createGeneratedApiOperation(definition, resource, operation);
    operations[config.id] = config;
  }

  return {
    id: resource.id,
    kind: 'database',
    name: resource.name,
    description: resource.description,
    path: resource.path,
    operations,
    metadata: createGeneratedApiResourceMetadata(definition, resource),
  };
}

export function createGeneratedApiOperation(
  definition: GeneratedApiDefinition,
  resource: GeneratedApiResourceDefinition,
  operation: GeneratedApiCrudOperation,
): DataOperationConfig {
  const operationId = createGeneratedApiOperationId(resource.id, operation);
  const primaryKey = resolveGeneratedApiPrimaryKey(resource.collection);
  const primaryKeyParameter =
    primaryKey === undefined ? undefined : createPrimaryKeyParameter(primaryKey);

  return {
    id: operationId,
    endpointId: resource.id,
    name: createGeneratedApiOperationName(resource, operation),
    protocol: 'database',
    intent: mapGeneratedApiOperationIntent(operation),
    path: resource.path,
    request: createGeneratedApiOperationRequest(
      resource.collection,
      operation,
      primaryKeyParameter,
    ),
    response: createGeneratedApiOperationResponse(resource.collection, operation),
    metadata: createGeneratedApiOperationMetadata(definition, resource, operation),
  };
}

export function createGeneratedApiOperationId(
  resourceId: string,
  operation: GeneratedApiCrudOperation,
): OperationId {
  return `${resourceId}.${operation}`;
}

export function createGeneratedApiResourceSchema(collection: DbCollectionDefinition): DataSchema {
  const properties: Record<string, DataSchema> = {};
  const required: string[] = [];

  for (const field of collection.fields) {
    properties[field.name] = createGeneratedApiFieldSchema(field);
    if (field.required === true) required.push(field.name);
  }

  return {
    type: 'object',
    title: collection.name,
    required: required.length > 0 ? required : undefined,
    properties,
  };
}

function validateGeneratedApiResource(
  definition: GeneratedApiDefinition,
  resource: GeneratedApiResourceDefinition,
  resourceIds: Set<string>,
  diagnostics: DataSourceDiagnostic[],
): void {
  if (resource.id.trim().length === 0) {
    diagnostics.push(
      resourceDiagnostic(definition, resource, 'Resource IDs must be non-empty.', 'id'),
    );
  } else if (resourceIds.has(resource.id)) {
    diagnostics.push(
      resourceDiagnostic(definition, resource, `Resource ID '${resource.id}' is duplicated.`, 'id'),
    );
  }
  resourceIds.add(resource.id);

  if (!resource.path.startsWith('/')) {
    diagnostics.push(
      resourceDiagnostic(
        definition,
        resource,
        'Generated API resource paths must start with `/`.',
        'path',
      ),
    );
  }

  if (resource.collection.name.trim().length === 0) {
    diagnostics.push(
      resourceDiagnostic(
        definition,
        resource,
        'Generated API resource collections must have a non-empty name.',
        'collection.name',
      ),
    );
  }

  diagnostics.push(...validateGeneratedApiCollection(definition, resource));

  if (resource.operations.length === 0) {
    diagnostics.push(
      resourceDiagnostic(
        definition,
        resource,
        'Generated API resources require at least one operation.',
        'operations',
      ),
    );
  }

  const primaryKey = resolveGeneratedApiPrimaryKey(resource.collection);
  if (
    primaryKey === undefined &&
    resource.operations.some((operation) => operation !== 'list' && operation !== 'create')
  ) {
    diagnostics.push(
      resourceDiagnostic(
        definition,
        resource,
        'Generated API resources need a primaryKey field for read/update/delete operations.',
        'collection.primaryKey',
      ),
    );
  }
}

function resourceDiagnostic(
  definition: GeneratedApiDefinition,
  resource: GeneratedApiResourceDefinition,
  message: string,
  path: string,
): DataSourceDiagnostic {
  return {
    code: 'invalid-config',
    dataSourceId: definition.id,
    endpointId: resource.id,
    message,
    path: `resources.${resource.id}.${path}`,
    severity: 'error',
  };
}

function createGeneratedApiSourceMetadata(definition: GeneratedApiDefinition): DataContractValue {
  return {
    ...readMetadataRecord(definition.metadata),
    basePath: definition.basePath,
    source: 'generated-api',
    auth: createGeneratedApiAuthMetadata(definition.auth),
  };
}

function createGeneratedApiResourceMetadata(
  definition: GeneratedApiDefinition,
  resource: GeneratedApiResourceDefinition,
): DataContractValue {
  return {
    ...readMetadataRecord(resource.metadata),
    adapterId: definition.database.id,
    collection: resource.collection.name,
    schema: resource.collection.schema ?? null,
    source: 'generated-api',
    seed: resource.seed ?? [],
    policies: createGeneratedApiPolicyMetadata(resource.policies),
  };
}

function createGeneratedApiOperationMetadata(
  definition: GeneratedApiDefinition,
  resource: GeneratedApiResourceDefinition,
  operation: GeneratedApiCrudOperation,
): DataContractValue {
  return {
    adapterId: definition.database.id,
    collection: resource.collection.name,
    operation,
    schema: resource.collection.schema ?? null,
    source: 'generated-api',
    policies: createGeneratedApiPolicyMetadata(
      resource.policies?.filter(
        (policy) => policy.operation === undefined || policy.operation === operation,
      ),
    ),
  };
}

function createGeneratedApiAuthMetadata(
  auth: GeneratedApiAuthRequirement | undefined,
): DataContractValue {
  if (auth === undefined) return null;

  const metadata: Record<string, DataContractValue> = {};
  if (auth.required !== undefined) metadata.required = auth.required;
  if (auth.roles !== undefined) metadata.roles = auth.roles;
  if (auth.permissions !== undefined) metadata.permissions = auth.permissions;
  if (auth.policy !== undefined) metadata.policy = auth.policy;
  if (auth.metadata !== undefined) metadata.metadata = auth.metadata;
  return metadata;
}

function createGeneratedApiPolicyMetadata(
  policies: readonly GeneratedApiOperationPolicyRef[] | undefined,
): readonly DataContractValue[] {
  return (policies ?? []).map((policy) => {
    const metadata: Record<string, DataContractValue> = { id: policy.id };
    if (policy.operation !== undefined) metadata.operation = policy.operation;
    return metadata;
  });
}

function createGeneratedApiOperationName(
  resource: GeneratedApiResourceDefinition,
  operation: GeneratedApiCrudOperation,
): string {
  return `${operation} ${resource.name ?? resource.id}`;
}

function mapGeneratedApiOperationIntent(operation: GeneratedApiCrudOperation): DataOperationIntent {
  if (operation === 'list' || operation === 'read') return 'read';
  if (operation === 'create') return 'create';
  if (operation === 'update') return 'update';
  return 'delete';
}

function createGeneratedApiOperationRequest(
  collection: DbCollectionDefinition,
  operation: GeneratedApiCrudOperation,
  primaryKeyParameter: DataOperationParameter | undefined,
): DataOperationConfig['request'] {
  if (operation === 'list') {
    return {
      parameters: [
        { name: 'limit', location: 'query', schema: { type: 'integer' } },
        { name: 'offset', location: 'query', schema: { type: 'integer' } },
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
    schema: createGeneratedApiResourceSchema(collection),
  };
}

function createGeneratedApiOperationResponse(
  collection: DbCollectionDefinition,
  operation: GeneratedApiCrudOperation,
): DataOperationConfig['response'] {
  const schema = createGeneratedApiResourceSchema(collection);

  if (operation === 'list') return { schema: { type: 'array', items: schema } };
  if (operation === 'delete') {
    return { schema: { type: 'object', properties: { deleted: { type: 'boolean' } } };
  }
  return { schema };
}

function createPrimaryKeyParameter(primaryKey: string): DataOperationParameter {
  return {
    name: primaryKey,
    location: 'path',
    required: true,
    schema: { type: 'string' },
  };
}

function resolveGeneratedApiPrimaryKey(collection: DbCollectionDefinition): string | undefined {
  return collection.primaryKey ?? collection.fields.find((field) => field.unique === true)?.name;
}

function createGeneratedApiFieldSchema(field: DbFieldDefinition): DataSchema {
  return {
    ...mapDbFieldTypeToDataSchema(field.type),
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

function readMetadataRecord(
  value: DataContractValue | undefined,
): Record<string, DataContractValue> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  const metadata: Record<string, DataContractValue> = {};
  for (const [key, item] of Object.entries(value)) metadata[key] = item;
  return metadata;
}
