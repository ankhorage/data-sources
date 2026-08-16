import type {
  DataContractValue,
  DataOperationConfig,
  DataOperationParameter,
  DataSourceDiagnostic,
} from '@ankhorage/contracts/data';

import { createDiagnostic } from './result';
import type {
  EndpointTestHeaders,
  EndpointTestInput,
  EndpointTestInputValues,
} from './types';

export function interpolatePath(
  path: string,
  parameters: readonly DataOperationParameter[],
  values: EndpointTestInputValues,
  input: EndpointTestInput,
  diagnostics: DataSourceDiagnostic[],
): string {
  let next = path;
  for (const parameter of parameters.filter((item) => item.location === 'path')) {
    const value = readValue(values, parameter.name) ?? parameter.default;
    if (value === undefined) {
      diagnostics.push(
        createDiagnostic(input, 'invalid-config', `Missing required path parameter '${parameter.name}'.`),
      );
      continue;
    }
    const encoded = encodeURIComponent(serializeEndpointUrlValue(value));
    next = next.replaceAll(`{${parameter.name}}`, encoded).replaceAll(`:${parameter.name}`, encoded);
  }
  return next;
}

export function collectQuery(
  parameters: readonly DataOperationParameter[],
  values: EndpointTestInputValues,
  credentialQuery: EndpointTestInputValues | undefined,
): EndpointTestInputValues {
  const parameterEntries = parameters.flatMap((parameter) => {
    if (parameter.location !== 'query') return [];
    const value = readValue(values, parameter.name) ?? parameter.default;
    return value === undefined ? [] : [[parameter.name, value] as const];
  });
  return Object.fromEntries([...Object.entries(credentialQuery ?? {}), ...parameterEntries]);
}

export function collectHeaders(
  parameters: readonly DataOperationParameter[],
  values: EndpointTestInputValues,
  credentialHeaders: EndpointTestHeaders | undefined,
): Record<string, string> {
  const parameterEntries = parameters.flatMap((parameter) => {
    if (parameter.location !== 'header') return [];
    const value = readValue(values, parameter.name) ?? parameter.default;
    return value === undefined
      ? []
      : [[parameter.name, serializeEndpointUrlValue(value)] as const];
  });
  return Object.fromEntries([...Object.entries(credentialHeaders ?? {}), ...parameterEntries]);
}

export function createHttpBody(
  operation: DataOperationConfig,
  parameters: readonly DataOperationParameter[],
  values: EndpointTestInputValues,
): string | undefined {
  if (operation.method === 'GET' || operation.method === 'HEAD') return undefined;
  const explicitBody = readValue(values, 'body');
  if (explicitBody !== undefined) return JSON.stringify(explicitBody);

  const entries = parameters.flatMap((parameter) => {
    if (parameter.location !== 'body') return [];
    const value = readValue(values, parameter.name) ?? parameter.default;
    return value === undefined ? [] : [[parameter.name, value] as const];
  });
  return entries.length === 0 ? undefined : JSON.stringify(Object.fromEntries(entries));
}

export function appendQuery(url: string, query: EndpointTestInputValues): string {
  const entries = Object.entries(query);
  if (entries.length === 0) return url;
  const search = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(serializeEndpointUrlValue(value))}`)
    .join('&');
  return `${url}${url.includes('?') ? '&' : '?'}${search}`;
}

export function joinUrl(baseUrl: string, path: string): string {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

export function getStringValue(
  values: EndpointTestInputValues | undefined,
  key: string,
): string | undefined {
  const value = readValue(values, key);
  return typeof value === 'string' ? value : undefined;
}

export function getRecordValue(
  values: EndpointTestInputValues | undefined,
  key: string,
): DataContractValue | undefined {
  const value = readValue(values, key);
  return isDataContractValue(value) ? value : undefined;
}

export function getStringMetadataValue(
  metadata: DataContractValue | undefined,
  key: string,
): string | undefined {
  if (!isDataContractRecord(metadata)) return undefined;
  const value = readValue(metadata, key);
  return typeof value === 'string' ? value : undefined;
}

function serializeEndpointUrlValue(value: DataContractValue): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return value.toString();
  if (value === null) return '';
  return JSON.stringify(value);
}

function readValue(
  values: Readonly<Record<string, DataContractValue>> | undefined,
  key: string,
): DataContractValue | undefined {
  return Object.entries(values ?? {}).find(([entryKey]) => entryKey === key)?.[1];
}

function isDataContractValue(value: unknown): value is DataContractValue {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isDataContractValue);
  return typeof value === 'object' && Object.values(value).every(isDataContractValue);
}

function isDataContractRecord(
  value: DataContractValue | undefined,
): value is Record<string, DataContractValue> {
  return value !== undefined && typeof value === 'object' && value !== null && !Array.isArray(value);
}
