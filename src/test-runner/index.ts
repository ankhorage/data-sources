import type {
  CredentialRef,
  DataContractValue,
  DataEndpointConfig,
  DataOperationConfig,
  DataOperationParameter,
  DataSourceConfig,
  DataSourceDiagnostic,
  EndpointId,
  OperationId,
} from '@ankhorage/contracts/data';

export type EndpointTestInputValues = Readonly<Record<string, DataContractValue>>;
export type EndpointTestHeaders = Readonly<Record<string, string>>;

export interface EndpointTestCredential {
  readonly headers?: EndpointTestHeaders;
  readonly query?: EndpointTestInputValues;
}

export type EndpointTestCredentialResolver = (
  credential: CredentialRef,
) => EndpointTestCredential | Promise<EndpointTestCredential | undefined> | undefined;

export interface EndpointTestFetchInit {
  readonly method: string;
  readonly headers: EndpointTestHeaders;
  readonly body?: string;
}

export interface EndpointTestFetchResponse {
  readonly status: number;
  readonly headers?: EndpointTestHeaders;
  text(): Promise<string>;
}

export type EndpointTestFetch = (
  url: string,
  init: EndpointTestFetchInit,
) => Promise<EndpointTestFetchResponse>;

export interface EndpointTestInput {
  readonly dataSource: DataSourceConfig;
  readonly endpointId: EndpointId;
  readonly operationId: OperationId;
  readonly values?: EndpointTestInputValues;
  readonly dryRun?: boolean;
  readonly fetch?: EndpointTestFetch;
  readonly credentialResolver?: EndpointTestCredentialResolver;
}

export interface EndpointTestRequestDiagnostic {
  readonly dataSourceId: string;
  readonly endpointId: EndpointId;
  readonly operationId: OperationId;
  readonly url: string;
  readonly method: string;
  readonly headers: EndpointTestHeaders;
  readonly body?: string;
  readonly dryRun: boolean;
}

export interface EndpointTestResponseDiagnostic {
  readonly status: number;
  readonly ok: boolean;
  readonly headers?: EndpointTestHeaders;
  readonly bodyText?: string;
  readonly parsedBody?: DataContractValue;
}

export type EndpointTestResult =
  | {
      readonly ok: true;
      readonly request: EndpointTestRequestDiagnostic;
      readonly response?: EndpointTestResponseDiagnostic;
      readonly data?: DataContractValue;
      readonly diagnostics: readonly DataSourceDiagnostic[];
    }
  | {
      readonly ok: false;
      readonly request?: EndpointTestRequestDiagnostic;
      readonly response?: EndpointTestResponseDiagnostic;
      readonly diagnostics: readonly DataSourceDiagnostic[];
    };

interface EndpointOperationSelection {
  readonly endpoint: DataEndpointConfig;
  readonly operation: DataOperationConfig;
}

export async function testEndpoint(input: EndpointTestInput): Promise<EndpointTestResult> {
  const built = await buildEndpointTestRequest(input);
  if (!built.ok || input.dryRun === true) return built;

  if (input.fetch === undefined) {
    return failure(built.request, [
      ...built.diagnostics,
      createDiagnostic(
        input,
        'invalid-config',
        'Endpoint test runner requires an injected fetch function.',
      ),
    ]);
  }

  try {
    const response = await input.fetch(built.request.url, {
      method: built.request.method,
      headers: built.request.headers,
      body: built.request.body,
    });
    const responseDiagnostic = await createResponseDiagnostic(response);
    const diagnostics = [...built.diagnostics];
    if (!responseDiagnostic.ok) {
      diagnostics.push(
        createDiagnostic(
          input,
          'http-error',
          `Endpoint test request returned HTTP status ${responseDiagnostic.status}.`,
        ),
      );
    }
    return responseDiagnostic.ok
      ? {
          ok: true,
          request: built.request,
          response: responseDiagnostic,
          data: responseDiagnostic.parsedBody,
          diagnostics,
        }
      : failure(built.request, diagnostics, responseDiagnostic);
  } catch (error) {
    return failure(built.request, [
      ...built.diagnostics,
      createDiagnostic(input, 'network-error', createNetworkErrorMessage(error)),
    ]);
  }
}

export async function buildEndpointTestRequest(
  input: EndpointTestInput,
): Promise<EndpointTestResult> {
  const selection = selectEndpointOperation(input);
  if (selection === undefined) {
    return failure(undefined, [
      createDiagnostic(input, 'missing-operation', 'Endpoint or operation could not be found.'),
    ]);
  }

  if (selection.operation.protocol === 'database') {
    return failure(undefined, [
      createDiagnostic(
        input,
        'invalid-config',
        'Database-backed generated API operations require an adapter executor and cannot be tested through the HTTP endpoint runner.',
      ),
    ]);
  }

  const diagnostics: DataSourceDiagnostic[] = [];
  const credential = await resolveEndpointCredential(input, selection, diagnostics);
  const request =
    selection.operation.protocol === 'graphql'
      ? buildGraphQlRequest(input, selection, credential, diagnostics)
      : buildHttpRequest(input, selection, credential, diagnostics);

  if (request === undefined || diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return failure(request, diagnostics);
  }
  return { ok: true, request, diagnostics };
}

function selectEndpointOperation(input: EndpointTestInput): EndpointOperationSelection | undefined {
  const endpoint = input.dataSource.endpoints[input.endpointId];
  const operation = endpoint?.operations[input.operationId];
  return endpoint === undefined || operation === undefined ? undefined : { endpoint, operation };
}

async function resolveEndpointCredential(
  input: EndpointTestInput,
  selection: EndpointOperationSelection,
  diagnostics: DataSourceDiagnostic[],
): Promise<EndpointTestCredential | undefined> {
  const ref =
    selection.operation.credential ?? selection.endpoint.credential ?? input.dataSource.credential;
  if (ref === undefined) return undefined;
  if (input.credentialResolver === undefined) {
    diagnostics.push(
      createDiagnostic(input, 'missing-credential', `Credential '${ref.id}' requires a resolver.`),
    );
    return undefined;
  }
  const credential = await input.credentialResolver(ref);
  if (credential === undefined) {
    diagnostics.push(
      createDiagnostic(
        input,
        'missing-credential',
        `Credential '${ref.id}' could not be resolved.`,
      ),
    );
  }
  return credential;
}

function buildHttpRequest(
  input: EndpointTestInput,
  selection: EndpointOperationSelection,
  credential: EndpointTestCredential | undefined,
  diagnostics: DataSourceDiagnostic[],
): EndpointTestRequestDiagnostic | undefined {
  const baseUrl = getDataSourceBaseUrl(input.dataSource, selection.endpoint);
  const path = selection.operation.path ?? selection.endpoint.path;
  if (!baseUrl) {
    diagnostics.push(
      createDiagnostic(input, 'invalid-config', 'HTTP endpoint requires a base URL.'),
    );
    return undefined;
  }
  if (path === undefined) {
    diagnostics.push(createDiagnostic(input, 'invalid-config', 'HTTP operation requires a path.'));
    return undefined;
  }

  const values = input.values ?? {};
  const parameters = selection.operation.request?.parameters ?? [];
  const resolvedPath = interpolatePath(path, parameters, values, input, diagnostics);
  const query = collectQuery(parameters, values, credential?.query);
  const body = createHttpBody(selection.operation, values);
  const headers: Record<string, string> = { ...(credential?.headers ?? {}) };
  if (body !== undefined) headers['content-type'] = headers['content-type'] ?? 'application/json';

  return {
    dataSourceId: input.dataSource.id,
    endpointId: input.endpointId,
    operationId: input.operationId,
    url: appendQuery(joinUrl(baseUrl, resolvedPath), query),
    method: selection.operation.method ?? 'GET',
    headers,
    body,
    dryRun: input.dryRun === true,
  };
}

function buildGraphQlRequest(
  input: EndpointTestInput,
  selection: EndpointOperationSelection,
  credential: EndpointTestCredential | undefined,
  diagnostics: DataSourceDiagnostic[],
): EndpointTestRequestDiagnostic | undefined {
  const endpointUrl = getGraphQlEndpointUrl(input.dataSource, selection.endpoint);
  if (!endpointUrl) {
    diagnostics.push(
      createDiagnostic(input, 'invalid-config', 'GraphQL endpoint requires an endpoint URL.'),
    );
    return undefined;
  }

  const query =
    getStringMetadataValue(selection.operation.metadata, 'document') ??
    getStringValue(input.values, 'query');
  if (query === undefined) {
    diagnostics.push(
      createDiagnostic(input, 'invalid-config', 'GraphQL operation requires a query document.'),
    );
    return undefined;
  }

  const variables = getRecordValue(input.values, 'variables');
  return {
    dataSourceId: input.dataSource.id,
    endpointId: input.endpointId,
    operationId: input.operationId,
    url: appendQuery(endpointUrl, credential?.query ?? {}),
    method: 'POST',
    headers: { ...(credential?.headers ?? {}), 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables: variables ?? {} }),
    dryRun: input.dryRun === true,
  };
}

function getDataSourceBaseUrl(
  source: DataSourceConfig,
  endpoint: DataEndpointConfig,
): string | undefined {
  if (endpoint.baseUrl !== undefined) return endpoint.baseUrl;
  if (source.kind !== 'api' || source.origin !== 'external') return undefined;
  return source.protocol === 'rest' ? source.baseUrl : source.endpointUrl;
}

function getGraphQlEndpointUrl(
  source: DataSourceConfig,
  endpoint: DataEndpointConfig,
): string | undefined {
  if (endpoint.baseUrl !== undefined) return endpoint.baseUrl;
  return source.kind === 'api' && source.origin === 'external' && source.protocol === 'graphql'
    ? source.endpointUrl
    : undefined;
}

function interpolatePath(
  path: string,
  parameters: readonly DataOperationParameter[],
  values: EndpointTestInputValues,
  input: EndpointTestInput,
  diagnostics: DataSourceDiagnostic[],
): string {
  let next = path;
  for (const parameter of parameters.filter((item) => item.location === 'path')) {
    const value = values[parameter.name] ?? parameter.default;
    if (value === undefined) {
      diagnostics.push(
        createDiagnostic(
          input,
          'invalid-config',
          `Missing required path parameter '${parameter.name}'.`,
        ),
      );
      continue;
    }
    const encoded = encodeURIComponent(serializeEndpointUrlValue(value));
    next = next
      .replaceAll(`{${parameter.name}}`, encoded)
      .replaceAll(`:${parameter.name}`, encoded);
  }
  return next;
}

function collectQuery(
  parameters: readonly DataOperationParameter[],
  values: EndpointTestInputValues,
  credentialQuery: EndpointTestInputValues | undefined,
): EndpointTestInputValues {
  const query: Record<string, DataContractValue> = { ...(credentialQuery ?? {}) };
  for (const parameter of parameters) {
    if (parameter.location !== 'query') continue;
    const value = values[parameter.name] ?? parameter.default;
    if (value !== undefined) query[parameter.name] = value;
  }
  return query;
}

function createHttpBody(
  operation: DataOperationConfig,
  values: EndpointTestInputValues,
): string | undefined {
  if (operation.method === 'GET' || operation.method === 'HEAD') return undefined;
  return values.body === undefined ? undefined : JSON.stringify(values.body);
}

async function createResponseDiagnostic(
  response: EndpointTestFetchResponse,
): Promise<EndpointTestResponseDiagnostic> {
  const bodyText = await response.text();
  return {
    status: response.status,
    ok: response.status >= 200 && response.status < 300,
    headers: response.headers,
    bodyText,
    parsedBody: parseResponseBody(bodyText),
  };
}

function parseResponseBody(bodyText: string): DataContractValue | undefined {
  if (bodyText.trim().length === 0) return undefined;
  try {
    const parsed: unknown = JSON.parse(bodyText);
    return isDataContractValue(parsed) ? parsed : { raw: bodyText };
  } catch {
    return { raw: bodyText };
  }
}

function appendQuery(url: string, query: EndpointTestInputValues): string {
  const entries = Object.entries(query);
  if (entries.length === 0) return url;
  const search = entries
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(serializeEndpointUrlValue(value))}`,
    )
    .join('&');
  return `${url}${url.includes('?') ? '&' : '?'}${search}`;
}

function serializeEndpointUrlValue(value: DataContractValue): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return value.toString();
  if (value === null) return '';
  return JSON.stringify(value);
}

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

function getStringValue(
  values: EndpointTestInputValues | undefined,
  key: string,
): string | undefined {
  const value = values?.[key];
  return typeof value === 'string' ? value : undefined;
}

function getRecordValue(
  values: EndpointTestInputValues | undefined,
  key: string,
): DataContractValue | undefined {
  const value = values?.[key];
  return isDataContractValue(value) ? value : undefined;
}

function getStringMetadataValue(
  metadata: DataContractValue | undefined,
  key: string,
): string | undefined {
  if (!isDataContractRecord(metadata)) return undefined;
  const value = metadata[key];
  return typeof value === 'string' ? value : undefined;
}

function createDiagnostic(
  input: EndpointTestInput,
  code: string,
  message: string,
): DataSourceDiagnostic {
  return {
    code,
    dataSourceId: input.dataSource.id,
    endpointId: input.endpointId,
    operationId: input.operationId,
    message,
    severity: code === 'missing-schema' ? 'info' : 'error',
  };
}

function failure(
  request: EndpointTestRequestDiagnostic | undefined,
  diagnostics: readonly DataSourceDiagnostic[],
  response?: EndpointTestResponseDiagnostic,
): EndpointTestResult {
  return { ok: false, request, response, diagnostics };
}

function createNetworkErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Endpoint test request failed.';
}

function isDataContractValue(value: unknown): value is DataContractValue {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isDataContractValue);
  return typeof value === 'object' && Object.values(value).every(isDataContractValue);
}

function isDataContractRecord(
  value: DataContractValue | undefined,
): value is Record<string, DataContractValue> {
  return (
    value !== undefined && typeof value === 'object' && value !== null && !Array.isArray(value)
  );
}
