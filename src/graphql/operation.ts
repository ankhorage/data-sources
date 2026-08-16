import type {
  DataContractValue,
  DataOperationConfig,
  DataOperationIntent,
  DataOperationResponse,
  OperationId,
} from '@ankhorage/contracts/data';

import type { GraphQlOperationDefinition, GraphQlOperationKind } from './types';

type DataContractRecord = Record<string, DataContractValue>;

export function normalizeGraphQlOperationId(kind: GraphQlOperationKind, name: string): OperationId {
  const normalizedName = name
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return normalizedName.length > 0 ? `${kind}.${normalizedName}` : `${kind}.operation`;
}

export function normalizeGraphQlOperation(
  operation: GraphQlOperationDefinition,
): DataOperationConfig {
  const response: DataOperationResponse | undefined =
    operation.response === undefined ? undefined : { schema: operation.response };
  return {
    id: operation.id,
    endpointId: 'graphql',
    name: operation.name,
    description: operation.description,
    protocol: 'graphql',
    intent: mapGraphQlOperationKindToIntent(operation.kind),
    request: { schema: operation.variables },
    response,
    metadata: createGraphQlOperationMetadata(operation),
  };
}

function mapGraphQlOperationKindToIntent(kind: GraphQlOperationKind): DataOperationIntent {
  return kind === 'query' || kind === 'subscription' ? 'read' : 'action';
}

function createGraphQlOperationMetadata(operation: GraphQlOperationDefinition): DataContractRecord {
  return {
    ...toMetadataRecord(operation.metadata),
    kind: operation.kind,
    ...(operation.document === undefined ? {} : { document: operation.document }),
    ...(operation.selectionPath === undefined ? {} : { selectionPath: operation.selectionPath }),
  };
}

function toMetadataRecord(value: DataContractValue | undefined): DataContractRecord {
  return isDataContractRecord(value) ? { ...value } : {};
}

function isDataContractRecord(value: DataContractValue | undefined): value is DataContractRecord {
  return (
    value !== undefined && typeof value === 'object' && value !== null && !Array.isArray(value)
  );
}
