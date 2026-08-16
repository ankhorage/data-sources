import type {
  ApiDefinition,
  DataEndpointConfig,
  DataOperationConfig,
  DataSourceDiagnostic,
} from '@ankhorage/contracts/data';

import { createResponseDiagnostic } from './response';
import { createDiagnostic, createNetworkErrorMessage, failure } from './result';
import {
  appendQuery,
  collectHeaders,
  collectQuery,
  createHttpBody,
  getRecordValue,
  getStringMetadataValue,
  getStringValue,
  interpolatePath,
  joinUrl,
} from './serialization';
import type {
  EndpointTestCredential,
  EndpointTestInput,
  EndpointTestRequestDiagnostic,
  EndpointTestResult,
} from './types';

export type * from './types';

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
    return createEndpointTestResult(input, built, await createResponseDiagnostic(response));
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
  if (input.api.origin === 'internal') {
    return failure(undefined, [
      createDiagnostic(input, 'invalid-config', 'Internal APIs are not executable in API phase 1.'),
    ]);
  }

  const selection = selectEndpointOperation(input);
  if (selection === undefined) {
    return failure(undefined, [
      createDiagnostic(input, 'missing-operation', 'Endpoint or operation could not be found.'),
    ]);
  }
  if (selection.operation.protocol !== 'http' && selection.operation.protocol !== 'graphql') {
    return failure(undefined, [
      createDiagnostic(
        input,
        'invalid-config',
        `API operation protocol '${selection.operation.protocol}' is not supported.`,
      ),
    ]);
  }

  const diagnostics: DataSourceDiagnostic[] = [];
  const credential = await resolveEndpointCredential(input, selection, diagnostics);
  const request = buildProtocolRequest(input, selection, credential, diagnostics);
  if (request === undefined || diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return failure(request, diagnostics);
  }
  return { ok: true, request, diagnostics };
}

function createEndpointTestResult(
  input: EndpointTestInput,
  built: Extract<EndpointTestResult, { readonly ok: true }>,
  response: Awaited<ReturnType<typeof createResponseDiagnostic>>,
): EndpointTestResult {
  const diagnostics = [...built.diagnostics];
  if (!response.ok) {
    diagnostics.push(
      createDiagnostic(
        input,
        'http-error',
        `Endpoint test request returned HTTP status ${response.status}.`,
      ),
    );
    return failure(built.request, diagnostics, response);
  }
  return {
    ok: true,
    request: built.request,
    response,
    data: response.parsedBody,
    diagnostics,
  };
}

function selectEndpointOperation(input: EndpointTestInput): EndpointOperationSelection | undefined {
  const endpoint = input.api.endpoints[input.endpointId];
  const operation = endpoint?.operations[input.operationId];
  return endpoint === undefined || operation === undefined ? undefined : { endpoint, operation };
}

async function resolveEndpointCredential(
  input: EndpointTestInput,
  selection: EndpointOperationSelection,
  diagnostics: DataSourceDiagnostic[],
): Promise<EndpointTestCredential | undefined> {
  const ref =
    selection.operation.credential ?? selection.endpoint.credential ?? input.api.credential;
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

function buildProtocolRequest(
  input: EndpointTestInput,
  selection: EndpointOperationSelection,
  credential: EndpointTestCredential | undefined,
  diagnostics: DataSourceDiagnostic[],
): EndpointTestRequestDiagnostic | undefined {
  return selection.operation.protocol === 'graphql'
    ? buildGraphQlRequest(input, selection, credential, diagnostics)
    : buildHttpRequest(input, selection, credential, diagnostics);
}

function buildHttpRequest(
  input: EndpointTestInput,
  selection: EndpointOperationSelection,
  credential: EndpointTestCredential | undefined,
  diagnostics: DataSourceDiagnostic[],
): EndpointTestRequestDiagnostic | undefined {
  const baseUrl = getRestBaseUrl(input.api, selection.endpoint);
  const path = selection.operation.path ?? selection.endpoint.path;
  if (baseUrl === undefined || path === undefined) {
    const message =
      baseUrl === undefined
        ? 'HTTP endpoint requires a base URL.'
        : 'HTTP operation requires a path.';
    diagnostics.push(createDiagnostic(input, 'invalid-config', message));
    return undefined;
  }

  const values = input.values ?? {};
  const parameters = selection.operation.request?.parameters ?? [];
  const resolvedPath = interpolatePath(path, parameters, values, input, diagnostics);
  const query = collectQuery(parameters, values, credential?.query);
  const headers = collectHeaders(parameters, values, credential?.headers);
  const body = createHttpBody(selection.operation, parameters, values);
  const requestHeaders =
    body === undefined
      ? headers
      : {
          ...headers,
          'content-type':
            headers['content-type'] ??
            selection.operation.request?.contentType ??
            'application/json',
        };
  return {
    apiId: input.api.id,
    endpointId: input.endpointId,
    operationId: input.operationId,
    url: appendQuery(joinUrl(baseUrl, resolvedPath), query),
    method: selection.operation.method ?? 'GET',
    headers: requestHeaders,
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
  const endpointUrl = getGraphQlEndpointUrl(input.api, selection.endpoint);
  if (endpointUrl === undefined) {
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
    apiId: input.api.id,
    endpointId: input.endpointId,
    operationId: input.operationId,
    url: appendQuery(endpointUrl, credential?.query ?? {}),
    method: 'POST',
    headers: { ...(credential?.headers ?? {}), 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables: variables ?? {} }),
    dryRun: input.dryRun === true,
  };
}

function getRestBaseUrl(api: ApiDefinition, endpoint: DataEndpointConfig): string | undefined {
  if (endpoint.baseUrl !== undefined) return endpoint.baseUrl;
  return api.origin === 'external' && api.protocol === 'rest' ? api.baseUrl : undefined;
}

function getGraphQlEndpointUrl(
  api: ApiDefinition,
  endpoint: DataEndpointConfig,
): string | undefined {
  if (endpoint.baseUrl !== undefined) return endpoint.baseUrl;
  return api.origin === 'external' && api.protocol === 'graphql' ? api.endpointUrl : undefined;
}
