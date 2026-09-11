import { normalizeCandidateUrl, parseHttpUrl } from './http';

/*** Builds the ordered OpenAPI probe plan and the normalized service scope requested by the caller. */
export function createOpenApiDiscoveryPlan(
  rawUrl: string,
  conventionalPaths: readonly string[],
): OpenApiDiscoveryPlan {
  const parsed = parseHttpUrl(rawUrl);
  if (parsed === undefined) return { candidates: [], requestedScope: undefined };

  const exact = normalizeCandidateUrl(parsed);
  const serviceBase = new URL(exact);
  if (!serviceBase.pathname.endsWith('/')) serviceBase.pathname = `${serviceBase.pathname}/`;

  const candidates = new Map<string, OpenApiDiscoveryCandidate>();
  candidates.set(exact, { url: exact, scopeToRequestedService: false });
  for (const path of conventionalPaths) {
    const normalizedPath = path.replace(/^\/+/, '');
    const serviceUrl = normalizeCandidateUrl(new URL(normalizedPath, serviceBase));
    const rootUrl = normalizeCandidateUrl(new URL(normalizedPath, `${parsed.origin}/`));
    if (!candidates.has(serviceUrl)) {
      candidates.set(serviceUrl, { url: serviceUrl, scopeToRequestedService: false });
    }
    if (!candidates.has(rootUrl)) {
      candidates.set(rootUrl, { url: rootUrl, scopeToRequestedService: true });
    }
  }

  const requestedPath = normalizeServicePath(parsed.pathname);
  const isExplicitRootDocument = conventionalPaths.some((path) => {
    const normalizedPath = path.replace(/^\/+/, '');
    const rootCandidate = new URL(normalizedPath, `${parsed.origin}/`);
    return (
      rootCandidate.origin === parsed.origin &&
      normalizeServicePath(rootCandidate.pathname) === requestedPath
    );
  });
  return {
    candidates: [...candidates.values()],
    requestedScope: requestedPath === '/' || isExplicitRootDocument ? undefined : requestedPath,
  };
}

interface OpenApiDiscoveryPlan {
  readonly candidates: readonly OpenApiDiscoveryCandidate[];
  readonly requestedScope: string | undefined;
}

interface OpenApiDiscoveryCandidate {
  readonly url: string;
  readonly scopeToRequestedService: boolean;
}

/*** Normalizes trailing slashes for segment-safe service-path comparisons. */
function normalizeServicePath(pathname: string): string {
  const normalized = pathname.replace(/\/+$/g, '');
  return normalized.length === 0 ? '/' : normalized;
}
