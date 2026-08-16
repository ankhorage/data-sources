import type {
  DataEndpointConfig,
  DataSourceDiagnostic,
  DataSourceDiagnosticResult,
  ExternalGraphQlApiDefinition,
} from '@ankhorage/contracts/data';

import {
  normalizeGraphQlIntrospectionOperations,
  normalizeGraphQlIntrospectionSchemas,
} from './introspection';
import { normalizeGraphQlOperation, normalizeGraphQlOperationId } from './operation';
import type { GraphQlApiDefinition } from './types';

export type * from './types';
export { normalizeGraphQlIntrospectionOperations, normalizeGraphQlIntrospectionSchemas };
export { normalizeGraphQlOperationId };

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

export function createGraphQlApi(
  definition: GraphQlApiDefinition,
): DataSourceDiagnosticResult<ExternalGraphQlApiDefinition> {
  const diagnostics = validateGraphQlApi(definition);
  if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return { ok: false, diagnostics };
  }
  return { ok: true, data: normalizeGraphQlApi(definition), diagnostics };
}

export function validateGraphQlApi(
  definition: GraphQlApiDefinition,
): readonly DataSourceDiagnostic[] {
  const diagnostics: DataSourceDiagnostic[] = [];

  if (definition.endpointUrl.trim().length === 0) {
    diagnostics.push({
      code: 'invalid-config',
      apiId: definition.id,
      message: 'GraphQL API requires a non-empty endpointUrl.',
      path: 'endpointUrl',
      severity: 'error',
    });
  }
  if (definition.introspectionEnabled === false && definition.introspection !== undefined) {
    diagnostics.push({
      code: 'invalid-config',
      apiId: definition.id,
      message: 'GraphQL introspection data was provided while introspection is disabled.',
      path: 'introspection',
      severity: 'warning',
    });
  }
  if (definition.introspectionEnabled !== false && definition.introspection === undefined) {
    diagnostics.push({
      code: 'missing-schema',
      apiId: definition.id,
      message:
        'GraphQL introspection result was not provided. Manual operations can still be used.',
      path: 'introspection',
      severity: 'info',
    });
  }
  return diagnostics;
}

export function normalizeGraphQlApi(
  definition: GraphQlApiDefinition,
): ExternalGraphQlApiDefinition {
  const schemas = normalizeGraphQlIntrospectionSchemas(definition.introspection);
  const discovered = normalizeGraphQlIntrospectionOperations(definition.introspection);
  const operations = Object.fromEntries(
    [...discovered, ...(definition.operations ?? [])].map((operation) => [
      operation.id,
      normalizeGraphQlOperation(operation),
    ]),
  );
  const endpoint: DataEndpointConfig = {
    id: 'graphql',
    kind: 'graphql',
    credential: definition.credential,
    operations,
    metadata: { source: 'graphql' },
  };
  return {
    id: definition.id,
    origin: 'external',
    protocol: 'graphql',
    name: definition.name,
    description: definition.description,
    endpointUrl: definition.endpointUrl,
    credential: definition.credential,
    endpoints: { graphql: endpoint },
    schemas,
    introspection: {
      enabled: definition.introspectionEnabled ?? definition.introspection !== undefined,
      schemaVersion: definition.schemaVersion,
    },
    metadata: definition.metadata,
  };
}
