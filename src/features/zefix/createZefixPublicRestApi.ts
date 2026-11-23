import type { ExternalRestApiDefinition } from '@ankhorage/contracts/data';

import { normalizeManualRestApi } from '../../rest/index.js';

/***
 * Create the portable Zefix PublicREST descriptor for company search and UID lookup.
 *
 * The descriptor holds only the Basic credential reference. A trusted host must resolve that
 * reference before the existing endpoint executor sends a request; credentials never belong in
 * this API definition or in a client bundle.
 */
export function createZefixPublicRestApi(): ExternalRestApiDefinition {
  return normalizeManualRestApi({
    id: 'zefix',
    name: 'Zefix PublicREST',
    baseUrl: 'https://www.zefix.admin.ch/ZefixPublicREST',
    credential: { id: 'zefix-credentials', kind: 'basic' },
    endpoints: [
      {
        id: 'company-search',
        path: '/api/v1/company/search',
        operations: [
          {
            id: 'company.search',
            name: 'Search companies',
            method: 'POST',
            intent: 'read',
            request: { contentType: 'application/json' },
            parameters: [
              { name: 'name', location: 'body', required: true, schema: { type: 'string' } },
              { name: 'legalFormId', location: 'body', schema: { type: 'integer' } },
              { name: 'legalFormUid', location: 'body', schema: { type: 'string' } },
              { name: 'registryOfCommerceId', location: 'body', schema: { type: 'integer' } },
              { name: 'legalSeatId', location: 'body', schema: { type: 'integer' } },
              { name: 'canton', location: 'body', schema: { type: 'string' } },
              { name: 'activeOnly', location: 'body', schema: { type: 'boolean' } },
            ],
          },
        ],
      },
      {
        id: 'company-uid',
        path: '/api/v1/company/uid/{id}',
        operations: [
          {
            id: 'company.get-by-uid',
            name: 'Get company by UID',
            method: 'GET',
            intent: 'read',
            parameters: [
              { name: 'id', location: 'path', required: true, schema: { type: 'string' } },
            ],
          },
        ],
      },
    ],
  });
}
