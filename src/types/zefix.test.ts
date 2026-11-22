import { describe, expect, it } from 'bun:test';

import type {
  ZefixCompanyFull,
  ZefixCompanySearchQuery,
  ZefixCompanyShort,
  ZefixOperationResponse,
  ZefixRestApiErrorResponse,
  ZefixSchemas,
} from '../index.js';

describe('Zefix upstream public contracts', () => {
  it('represents official search input and minimal company responses', () => {
    const request = { name: 'Example', activeOnly: true } satisfies ZefixCompanySearchQuery;
    const results: ZefixOperationResponse<'POST /api/v1/company/search'> = [
      { uid: 'CHE123456789', name: 'Example AG', status: 'ACTIVE' },
    ];
    expect(request.name).toBe('Example');
    expect(results[0]?.status).toBe('ACTIVE');
  });

  it('distinguishes array UID responses from singular EHRA-ID responses', () => {
    const company: ZefixCompanyFull = {
      uid: 'CHE123456789',
      capitalNominal: '100000.00',
      address: { city: 'Bern' },
      oldNames: [{ name: 'Example GmbH', sequenceNr: 1 }],
      headOffices: [{ uid: 'CHE987654321' }],
    };
    const byUid: ZefixOperationResponse<'GET /api/v1/company/uid/{id}'> = [company];
    const byEhraId: ZefixOperationResponse<'GET /api/v1/company/ehraid/{id}'> = company;
    expect(byUid[0]?.capitalNominal).toBe('100000.00');
    expect(byEhraId.headOffices?.[0]?.uid).toBe('CHE987654321');
  });

  it('exposes the upstream schema registry and official enums', () => {
    const short: ZefixSchemas['CompanyShort'] = { status: 'BEING_CANCELLED' };
    const error: ZefixRestApiErrorResponse = {
      error: { type: 'RESULTLIST_TO_LARGE' },
    };
    const citation: ZefixCompanyShort = short;
    expect(citation.status).toBe('BEING_CANCELLED');
    expect(error.error?.type).toBe('RESULTLIST_TO_LARGE');
  });
});
