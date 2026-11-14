import type {
  ApiDefinition,
  DataContractValue,
  DataOperationConfig,
  DataOperationIntent,
  DataSchema,
  DataSourceDiagnosticResult,
} from '@ankhorage/contracts/data';
import type { FlowProviderCapabilityRef } from '@ankhorage/contracts/flow';

/** A credential-free, serializable description of one Data Sources operation. */
export interface FlowApiOperationDescriptor {
  readonly id: string;
  readonly capability: FlowProviderCapabilityRef;
  readonly source: FlowApiOperationSource;
  readonly protocol: 'graphql' | 'http';
  readonly intent: DataOperationIntent;
  readonly method?: FlowApiOperationMethod;
  readonly endpoint: FlowApiOperationEndpoint;
  readonly input: FlowApiOperationInput;
  readonly result: FlowApiOperationResult;
  readonly errors: readonly FlowApiOperationErrorCategory[];
  readonly pagination?: FlowApiOperationPagination;
  readonly rateLimit: FlowApiOperationRateLimit;
  readonly auth: FlowApiOperationAuthRequirement;
}

/** The server-side Data Sources identity resolved when a Flow capability is invoked. */
export interface FlowApiOperationSource {
  readonly handle: string;
}

/** Transport information that is safe to persist in a graph. */
export interface FlowApiOperationEndpoint {
  readonly kind: 'graphql' | 'http';
}

/** Explicitly allowlisted public operation inputs. */
export interface FlowApiOperationInput {
  readonly parameters: readonly FlowApiOperationParameter[];
  readonly body?: {
    readonly schema?: DataSchema;
  };
}

/** A public input parameter after secret-bearing transport positions are rejected. */
export interface FlowApiOperationParameter {
  readonly handle: string;
  readonly location: 'body' | 'path' | 'query';
  readonly required: boolean;
  readonly schema?: DataSchema;
}

/** Values bound by a Flow consumer using only persisted opaque handles. */
export interface FlowApiOperationBindings {
  readonly parameters?: Readonly<Record<string, DataContractValue>>;
  readonly body?: DataContractValue;
}

/** Server-owned 32-byte key material that makes persisted Flow handles opaque and restart-stable.
 *
 * Retain the same key across owner restarts. Replacing it intentionally invalidates old descriptors,
 * which must be reprojected before use.
 */
export interface FlowApiOperationOwnerOptions {
  readonly handleKey: Uint8Array;
}

/** The private owner-side resolution of a descriptor and its Flow bindings. */
export interface ResolvedFlowApiOperation {
  readonly api: ApiDefinition;
  readonly operation: DataOperationConfig;
  readonly parameters: readonly { readonly name: string; readonly value: DataContractValue }[];
  readonly body?: DataContractValue;
}

/** Server-side owner boundary: only this registry retains raw source identities and field names. */
export interface FlowApiOperationOwner {
  project(
    api: ApiDefinition,
    endpointId: string,
    operationId: string,
  ): DataSourceDiagnosticResult<FlowApiOperationDescriptor>;
  resolve(
    descriptor: FlowApiOperationDescriptor,
    bindings: FlowApiOperationBindings,
  ): DataSourceDiagnosticResult<ResolvedFlowApiOperation>;
}

/** Public HTTP methods recognized by the Flow descriptor protocol. */
export type FlowApiOperationMethod =
  'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT';

/** Pagination category without unclassified provider field names. */
export interface FlowApiOperationPagination {
  readonly kind: 'cursor' | 'limit-offset' | 'page' | 'unknown';
}

/** The response contract and artifact shape available to a Flow node. */
export interface FlowApiOperationResult {
  readonly response?: {
    readonly status?: number;
    readonly schema?: DataSchema;
  };
  readonly artifact: {
    readonly kind: 'artifact';
  };
}

/** Error classes Flow may render while retaining retry policy ownership. */
export type FlowApiOperationErrorCategory =
  'authentication' | 'authorization' | 'network' | 'rate-limit' | 'response-validation';

/** A rate-limit description that never guesses provider-specific limits. */
export interface FlowApiOperationRateLimit {
  readonly kind: 'unknown';
}

/** Secret-free authentication requirements; no credential reference or configuration is exposed. */
export interface FlowApiOperationAuthRequirement {
  readonly required: boolean;
  readonly kind?: 'apiKey' | 'basic' | 'bearer' | 'oauth2';
}
