import type { DataContractValue } from '@ankhorage/contracts/data';

import type { EndpointTestFetchResponse, EndpointTestResponseDiagnostic } from './types';

export async function createResponseDiagnostic(
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

function isDataContractValue(value: unknown): value is DataContractValue {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isDataContractValue);
  return typeof value === 'object' && Object.values(value).every(isDataContractValue);
}
