import type {
  CredentialRef,
  DataContractValue,
  DataSourceDiagnostic,
  GraphQlDataSourceConfig,
  OpenApiDataSourceConfig,
} from '@ankhorage/contracts/data';

import {
  createGraphQlDataSource,
  createGraphQlIntrospectionRequest,
  type GraphQlIntrospectionResult,
} from '../graphql';
import { importOpenApiDocument, type OpenApiDocumentObject } from '../openapi';

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

export interface DiscoverOpenApiDataSourceInput {
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

export type DiscoverOpenApiDataSourceResult =
  | {
      readonly ok: true;
      readonly data: OpenApiDataSourceConfig;
      readonly documentUrl: string;
      readonly attempts: readonly OpenApiDiscoveryAttempt[];
      readonly diagnostics: readonly DataSourceDiagnostic[];
    }
  | {
      readonly ok: false;
      readonly attempts: readonly OpenApiDiscoveryAttempt[];
      readonly diagnostics: readonly DataSourceDiagnostic[];
    };

export interface IntrospectGraphQlDataSourceInput {
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

export type IntrospectGraphQlDataSourceResult =
  | {
      readonly ok: true;
      readonly data: GraphQlDataSourceConfig;
      readonly diagnostics: readonly DataSourceDiagnostic[];
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly DataSourceDiagnostic[];
      readonly status?: number;
    };

export function createOpenApiDiscoveryCandidates(
  rawUrl: string,
  conventionalPaths: readonly string[] = DEFAULT_OPENAPI_DISCOVERY_PATHS,
): readonly string[] {
  const parsed = parseHttpUrl(rawUrl);
  if (parsed === undefined) return [];

  const exact = normalizeCandidateUrl(parsed);
  const serviceBase = new URL(exact);
  if (!serviceBase.pathname.endsWith('/')) serviceBase.pathname = `${serviceBase.pathname}/`;

  const candidates = [exact];
  for (const path of conventionalPaths) {
    const normalizedPath = path.replace(/^\/+/, '');
    candidates.push(normalizeCandidateUrl(new URL(normalizedPath, serviceBase)));
    candidates.push(normalizeCandidateUrl(new URL(normalizedPath, `${parsed.origin}/`)));
  }

  return [...new Set(candidates)];
}

export async function discoverOpenApiDataSource(
  input: DiscoverOpenApiDataSourceInput,
): Promise<DiscoverOpenApiDataSourceResult> {
  const candidates = createOpenApiDiscoveryCandidates(input.url, input.conventionalPaths);
  if (candidates.length === 0) {
    return discoveryFailure(input.id, [], 'OpenAPI discovery requires a valid HTTP or HTTPS URL.');
  }

  const attempts: OpenApiDiscoveryAttempt[] = [];
  for (const candidate of candidates) {
    const probed = await probeOpenApiCandidate(input, candidate);
    attempts.push(probed.attempt);
    if (probed.result !== undefined) {
      return probed.result.ok
        ? {
            ok: true,
            data: probed.result.data,
            documentUrl: candidate,
            attempts,
            diagnostics: probed.result.diagnostics ?? [],
          }
        : { ok: false, attempts, diagnostics: probed.result.diagnostics };
    }
  }

  return discoveryFailure(
    input.id,
    attempts,
    'No supported OpenAPI document was found at the supplied URL or conventional locations.',
  );
}

export async function introspectGraphQlDataSource(
  input: IntrospectGraphQlDataSourceInput,
): Promise<IntrospectGraphQlDataSourceResult> {
  const endpoint = parseHttpUrl(input.endpointUrl);
  if (endpoint === undefined) {
    return graphqlFailure(input.id, 'GraphQL introspection requires a valid HTTP or HTTPS URL.');
  }

  const request = createGraphQlIntrospectionRequest();
  let response: ExternalApiFetchResponse;
  try {
    response = await input.fetch(normalizeCandidateUrl(endpoint), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...(input.headers ?? {}),
      },
      body: JSON.stringify(request),
    });
  } catch {
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

  const parsed = await parseJsonResponse(response);
  const introspection = readGraphQlIntrospection(parsed);
  if (introspection === undefined) {
    return graphqlFailure(
      input.id,
      'GraphQL introspection response did not contain data.__schema.',
      'parse-error',
    );
  }

  const result = createGraphQlDataSource({
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

interface OpenApiProbeResult {
  readonly attempt: OpenApiDiscoveryAttempt;
  readonly result?: ReturnType<typeof importOpenApiDocument>;
}

async function probeOpenApiCandidate(
  input: DiscoverOpenApiDataSourceInput,
  candidate: string,
): Promise<OpenApiProbeResult> {
  let response: ExternalApiFetchResponse;
  try {
    response = await input.fetch(candidate, {
      method: 'GET',
      headers: {
        accept: 'application/json, application/vnd.oai.openapi+json',
      },
    });
  } catch {
    return { attempt: { url: candidate, outcome: 'network-error' } };
  }

  if (!isSuccessfulStatus(response.status)) {
    return {
      attempt: { url: candidate, outcome: 'http-error', status: response.status },
    };
  }

  const parsed = await parseJsonResponse(response);
  if (parsed === undefined) {
    return {
      attempt: { url: candidate, outcome: 'parse-error', status: response.status },
    };
  }

  if (!isOpenApiDocument(parsed)) {
    return {
      attempt: { url: candidate, outcome: 'unsupported-document', status: response.status },
    };
  }

  const result = importOpenApiDocument({
    id: input.id,
    document: parsed,
    baseUrl: input.baseUrl,
    credential: input.credential,
    documentUrl: candidate,
    name: input.name,
    description: input.description,
    metadata: input.metadata,
  });

  return {
    attempt: {
      url: candidate,
      outcome: result.ok ? 'matched' : 'invalid-document',
      status: response.status,
    },
    result,
  };
}

function parseHttpUrl(rawUrl: string): URL | undefined {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    if (parsed.username.length > 0 || parsed.password.length > 0) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function normalizeCandidateUrl(url: URL): string {
  const normalized = new URL(url.toString());
  normalized.hash = '';
  return normalized.toString();
}

function isSuccessfulStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

async function parseJsonResponse(response: ExternalApiFetchResponse): Promise<unknown> {
  try {
    return JSON.parse(await response.text()) as unknown;
  } catch {
    return undefined;
  }
}

function isOpenApiDocument(value: unknown): value is OpenApiDocumentObject {
  const record = readRecord(value);
  return (
    record !== undefined &&
    typeof record.openapi === 'string' &&
    readRecord(record.paths) !== undefined
  );
}

function readGraphQlIntrospection(value: unknown): GraphQlIntrospectionResult | undefined {
  const payload = readRecord(value);
  const data = readRecord(payload?.data);
  if (readRecord(data?.__schema) === undefined) return undefined;
  return data as GraphQlIntrospectionResult;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return isRecord(value) ? value : undefined;
}

function discoveryFailure(
  dataSourceId: string,
  attempts: readonly OpenApiDiscoveryAttempt[],
  message: string,
): DiscoverOpenApiDataSourceResult {
  return {
    ok: false,
    attempts,
    diagnostics: [{ code: 'missing-schema', dataSourceId, message, severity: 'error' }],
  };
}

function graphqlFailure(
  dataSourceId: string,
  message: string,
  code: DataSourceDiagnostic['code'] = 'invalid-config',
): Extract<IntrospectGraphQlDataSourceResult, { readonly ok: false }> {
  return {
    ok: false,
    diagnostics: [{ code, dataSourceId, message, severity: 'error' }],
  };
}
