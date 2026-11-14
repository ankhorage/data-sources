import type {
  DataOperationIntent,
  DataOperationMethod,
  DataOperationPagination,
  DataOperationProtocol,
  DataSchema,
  OperationId,
} from '@ankhorage/contracts/data';
import type { FlowProviderCapabilityRef } from '@ankhorage/contracts/flow';

/** A credential-free, serializable description of one Data Sources operation. */
export interface FlowApiOperationDescriptor {
  readonly id: string;
  readonly capability: FlowProviderCapabilityRef;
  readonly source: FlowApiOperationSource;
  readonly protocol: DataOperationProtocol;
  readonly intent: DataOperationIntent;
  readonly method?: DataOperationMethod;
  readonly endpoint: FlowApiOperationEndpoint;
  readonly name?: string;
  readonly description?: string;
  readonly input: FlowApiOperationInput;
  readonly result: FlowApiOperationResult;
  readonly errors: readonly FlowApiOperationErrorCategory[];
  readonly pagination?: DataOperationPagination;
  readonly rateLimit: FlowApiOperationRateLimit;
  readonly auth: FlowApiOperationAuthRequirement;
}

/** The server-side Data Sources identity resolved when a Flow capability is invoked. */
export interface FlowApiOperationSource {
  readonly apiId: string;
  readonly endpointId: string;
  readonly operationId: OperationId;
}

/** Transport information that is safe to persist in a graph. */
export interface FlowApiOperationEndpoint {
  readonly kind: 'graphql' | 'http';
  readonly path?: string;
}

/** Explicitly allowlisted public operation inputs. */
export interface FlowApiOperationInput {
  readonly parameters: readonly FlowApiOperationParameter[];
  readonly body?: {
    readonly contentType?: string;
    readonly schema?: DataSchema;
  };
}

/** A public input parameter after secret-bearing transport positions are rejected. */
export interface FlowApiOperationParameter {
  readonly name: string;
  readonly location: 'body' | 'path' | 'query';
  readonly required?: boolean;
  readonly description?: string;
  readonly schema?: DataSchema;
}

/** The response contract and artifact shape available to a Flow node. */
export interface FlowApiOperationResult {
  readonly response?: {
    readonly status?: number | string;
    readonly contentType?: string;
    readonly description?: string;
    readonly schema?: DataSchema;
  };
  readonly artifact: {
    readonly kind: 'artifact';
    readonly mediaType?: string;
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
