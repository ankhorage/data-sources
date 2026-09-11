import type {
  CredentialRef,
  DataContractValue,
  DataSourceDiagnostic,
  ExternalGraphQlApiDefinition,
  ExternalRestApiDefinition,
} from '@ankhorage/contracts/data';

import {
  createGraphQlApi,
  createGraphQlIntrospectionRequest,
  type GraphQlIntrospectionResult,
} from '../graphql';
import { importOpenApiDocument, type OpenApiDocumentObject } from '../openapi';
import {
  isSuccessfulStatus,
  normalizeCandidateUrl,
  parseHttpUrl,
  parseJsonResponse,
  readRecord,
} from './http';
import { createOpenApiDiscoveryPlan } from './openapiDiscoveryPlan';
import { scopeOpenApiDocument } from './scopeOpenApiDocument';

export const DEFAULT_OPENAPI_DISCOVERY_PATHS = [
  'openapi.json',
  'swagger.json',
  'api/openapi.json',
  'v3/api-docs',
] as const;

export interface ExternalApiFetchInit {
  readonly method: 'GET' | 'POST';
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: string;
}

export interface ExternalApiFetchResponse {
  readonly status: number;
  text(): Promise<string>;
}

export type ExternalApiFetch = (
  url: string,
  init: ExternalApiFetchInit,
) => Promise<ExternalApiFetchResponse>;

export type OpenApiDiscoveryAttemptOutcome =
  | 'http-error'
  | 'invalid-document'
  | 'matched'
  | 'network-error'
  | 'parse-error'
  | 'unsupported-document';

export interface OpenApiDiscoveryAttempt {
  readonly url: string;
  readonly outcome: OpenApiDiscoveryAttemptOutcome;
  readonly status?: number;
}

export interface DiscoverOpenApiInput {
  readonly id: string;
  readonly url: string;
  readonly fetch: ExternalApiFetch;
  readonly baseUrl?: string;
  readonly credential?: CredentialRef;
  readonly name?: string;
  readonly description?: string;
  readonly metadata?: DataContractValue;
  readonly conventionalPaths?: readonly string[];
}

export type DiscoverOpenApiResult =
  | {
      readonly ok: true;
      readonly data: ExternalRestApiDefinition;
      readonly documentUrl: string;
      readonly attempts: readonly OpenApiDiscoveryAttempt[];
      readonly diagnostics: readonly DataSourceDiagnostic[];
    }
  | {
      readonly ok: false;
      readonly attempts: readonly OpenApiDiscoveryAttempt[];
      readonly diagnostics: readonly DataSourceDiagnostic[];
    };

export interface IntrospectGraphQlApiInput {
  readonly id: string;
  readonly endpointUrl: string;
  readonly fetch: ExternalApiFetch;
  readonly headers?: Readonly<Record<string, string>>;
  readonly credential?: CredentialRef;
  readonly name?: string;
  readonly description?: string;
  readonly schemaVersion?: string;
  readonly metadata?: DataContractValue;
}

export type IntrospectGraphQlApiResult =
  | {
      readonly ok: true;
      readonly data: ExternalGraphQlApiDefinition;
      readonly diagnostics: readonly DataSourceDiagnostic[];
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly DataSourceDiagnostic[];
      readonly status?: number;
    };

/*** Creates the ordered, deduplicated URLs probed during OpenAPI discovery. */
export function createOpenApiDiscoveryCandidates(
  rawUrl: string,
  conventionalPaths: readonly string[] = DEFAULT_OPENAPI_DISCOVERY_PATHS,
): readonly string[] {
  return createOpenApiDiscoveryPlan(rawUrl, conventionalPaths).candidates.map(
    (candidate) => candidate.url,
  );
}

/*** Discovers and imports an OpenAPI document while preserving the requested service boundary. */
export async function discoverOpenApi(input: DiscoverOpenApiInput): Promise<DiscoverOpenApiResult> {
  const conventionalPaths = input.conventionalPaths ?? DEFAULT_OPENAPI_DISCOVERY_PATHS;
  const plan = createOpenApiDiscoveryPlan(input.url, conventionalPaths);
  if (plan.candidates.length === 0) {
    return discoveryFailure(input.id, [], 'OpenAPI discovery requires a valid HTTP or HTTPS URL.');
  }

  const attempts: OpenApiDiscoveryAttempt[] = [];
  for (const candidate of plan.candidates) {
    const requestedScope = candidate.scopeToRequestedService ? plan.requestedScope : undefined;
    const probed = await probeOpenApiCandidate(input, candidate.url, requestedScope);
    attempts.push(probed.attempt);
    if (probed.result === undefined) continue;
    return probed.result.ok
      ? {
          ok: true,
          data: probed.result.data,
          documentUrl: candidate.url,
          attempts,
          diagnostics: probed.result.diagnostics ?? [],
        }
      : { ok: false, attempts, diagnostics: probed.result.diagnostics };
  }

  return discoveryFailure(
    input.id,
    attempts,
    'No supported OpenAPI document was found at the supplied URL or conventional locations.',
  );
}

/*** Introspects a GraphQL endpoint and normalizes its schema into the canonical API definition. */
export async function introspectGraphQlApi(
  input: IntrospectGraphQlApiInput,
): Promise<IntrospectGraphQlApiResult> {
  const endpoint = parseHttpUrl(input.endpointUrl);
  if (endpoint === undefined) {
    return graphqlFailure(input.id, 'GraphQL introspection requires a valid HTTP or HTTPS URL.');
  }

  const response = await fetchGraphQlIntrospection(input, endpoint);
  if (response === undefined) {
    return graphqlFailure(input.id, 'GraphQL introspection request failed.', 'network-error');
  }
  if (!isSuccessfulStatus(response.status)) {
    return {
      ...graphqlFailure(
        input.id,
        `GraphQL introspection returned HTTP status ${response.status}.`,
        'network-error',
      ),
      status: response.status,
    };
  }

  const introspection = readGraphQlIntrospection(await parseJsonResponse(response));
  if (introspection === undefined) {
    return graphqlFailure(
      input.id,
      'GraphQL introspection response did not contain data.__schema.',
      'parse-error',
    );
  }

  const result = createGraphQlApi({
    id: input.id,
    endpointUrl: normalizeCandidateUrl(endpoint),
    credential: input.credential,
    name: input.name,
    description: input.description,
    introspection,
    introspectionEnabled: true,
    schemaVersion: input.schemaVersion,
    metadata: input.metadata,
  });
  return result.ok
    ? { ok: true, data: result.data, diagnostics: result.diagnostics ?? [] }
    : { ok: false, diagnostics: result.diagnostics };
}

/*** Fetches GraphQL introspection without exposing transport failures beyond the discovery boundary. */
async function fetchGraphQlIntrospection(
  input: IntrospectGraphQlApiInput,
  endpoint: URL,
): Promise<ExternalApiFetchResponse | undefined> {
  try {
    return await input.fetch(normalizeCandidateUrl(endpoint), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...(input.headers ?? {}),
      },
      body: JSON.stringify(createGraphQlIntrospectionRequest()),
    });
  } catch {
    return undefined;
  }
}

interface OpenApiProbeResult {
  readonly attempt: OpenApiDiscoveryAttempt;
  readonly result?: ReturnType<typeof importOpenApiDocument>;
}

/*** Probes one OpenAPI candidate and scopes origin-root documents before canonical import. */
async function probeOpenApiCandidate(
  input: DiscoverOpenApiInput,
  candidate: string,
  requestedScope: string | undefined,
): Promise<OpenApiProbeResult> {
  let response: ExternalApiFetchResponse;
  try {
    response = await input.fetch(candidate, {
      method: 'GET',
      headers: { accept: 'application/json, application/vnd.oai.openapi+json' },
    });
  } catch {
    return { attempt: { url: candidate, outcome: 'network-error' } };
  }

  if (!isSuccessfulStatus(response.status)) {
    return { attempt: { url: candidate, outcome: 'http-error', status: response.status } };
  }

  const parsed = await parseJsonResponse(response);
  if (parsed === undefined) {
    return { attempt: { url: candidate, outcome: 'parse-error', status: response.status } };
  }
  if (!isOpenApiDocument(parsed)) {
    return {
      attempt: { url: candidate, outcome: 'unsupported-document', status: response.status },
    };
  }

  const result = importOpenApiCandidate(input, candidate, parsed, requestedScope);
  return {
    attempt: {
      url: candidate,
      outcome: result.ok ? 'matched' : 'invalid-document',
      status: response.status,
    },
    result,
  };
}

/*** Applies service scoping and imports one validated OpenAPI candidate. */
function importOpenApiCandidate(
  input: DiscoverOpenApiInput,
  candidate: string,
  parsed: OpenApiDocumentObject,
  requestedScope: string | undefined,
): ReturnType<typeof importOpenApiDocument> {
  let document = parsed;
  if (requestedScope !== undefined) {
    const scoped = scopeOpenApiDocument(parsed, input.id, requestedScope, candidate);
    if (!scoped.ok) return { ok: false, diagnostics: [scoped.diagnostic] };
    const { document: scopedDocument } = scoped;
    document = scopedDocument;
  }
  return importOpenApiDocument({
    id: input.id,
    document,
    baseUrl: input.baseUrl,
    credential: input.credential,
    documentUrl: candidate,
    name: input.name,
    description: input.description,
    metadata: input.metadata,
  });
}

/*** Checks whether parsed JSON has the minimal OpenAPI document shape required for import. */
function isOpenApiDocument(value: unknown): value is OpenApiDocumentObject {
  const record = readRecord(value);
  return (
    record !== undefined &&
    typeof record.openapi === 'string' &&
    readRecord(record.paths) !== undefined
  );
}

/*** Reads a GraphQL introspection schema from a parsed response payload. */
function readGraphQlIntrospection(value: unknown): GraphQlIntrospectionResult | undefined {
  const payload = readRecord(value);
  const data = readRecord(payload?.data);
  if (readRecord(data?.__schema) === undefined) return undefined;
  return data;
}

/*** Builds a canonical OpenAPI discovery failure with safe diagnostics. */
function discoveryFailure(
  apiId: string,
  attempts: readonly OpenApiDiscoveryAttempt[],
  message: string,
): DiscoverOpenApiResult {
  return {
    ok: false,
    attempts,
    diagnostics: [{ code: 'missing-schema', apiId, message, severity: 'error' }],
  };
}

/*** Builds a canonical GraphQL introspection failure with API identity. */
function graphqlFailure(
  apiId: string,
  message: string,
  code: DataSourceDiagnostic['code'] = 'invalid-config',
): Extract<IntrospectGraphQlApiResult, { readonly ok: false }> {
  return {
    ok: false,
    diagnostics: [{ code, apiId, message, severity: 'error' }],
  };
}
