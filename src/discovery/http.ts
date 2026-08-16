import type { ExternalApiFetchResponse } from './index';

export function parseHttpUrl(rawUrl: string): URL | undefined {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    if (parsed.username.length > 0 || parsed.password.length > 0) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function normalizeCandidateUrl(url: URL): string {
  const normalized = new URL(url.toString());
  normalized.hash = '';
  return normalized.toString();
}

export function isSuccessfulStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

export async function parseJsonResponse(response: ExternalApiFetchResponse): Promise<unknown> {
  try {
    return JSON.parse(await response.text()) as unknown;
  } catch {
    return undefined;
  }
}

export function readRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}
