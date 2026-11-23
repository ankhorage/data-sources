import { describe, expect, it } from 'bun:test';

import {
  buildEndpointTestRequest,
  createZefixPublicRestApi,
  mapZefixCompanyResult,
  testEndpoint,
} from '../../index.js';
import type { ZefixCompanyFull, ZefixCompanyShort } from '../../types/zefix.js';

const SEARCH_COMPANY = {
  uid: 'CHE123456789',
  name: 'Example AG',
  legalSeat: 'Zurich',
  legalForm: { uid: '0101', name: { de: 'Aktiengesellschaft' } },
  status: 'ACTIVE',
} satisfies ZefixCompanyShort;

const UID_COMPANY = {
  ...SEARCH_COMPANY,
  canton: 'ZH',
  address: { street: 'Example street', houseNumber: '1', city: 'Zurich', swissZipCode: '8000' },
  purpose: 'Documented company purpose',
} satisfies ZefixCompanyFull;

describe('Zefix Acquisition executor boundary', () => {
  it('builds a company search request through the existing executor', async () => {
    const result = await buildEndpointTestRequest({
      api: createZefixPublicRestApi(),
      endpointId: 'company-search',
      operationId: 'company.search',
      values: { name: 'Example', activeOnly: true },
      credentialResolver: () => ({ headers: { authorization: 'Basic trusted-host-only' } }),
      dryRun: true,
    });

    expect(result).toMatchObject({
      ok: true,
      request: {
        url: 'https://www.zefix.admin.ch/ZefixPublicREST/api/v1/company/search',
        method: 'POST',
        body: '{"name":"Example","activeOnly":true}',
      },
    });
  });

  it('executes UID lookup through the existing executor with an injected local response', async () => {
    const result = await testEndpoint({
      api: createZefixPublicRestApi(),
      endpointId: 'company-uid',
      operationId: 'company.get-by-uid',
      values: { id: 'CHE-123.456.789' },
      credentialResolver: () => ({ headers: { authorization: 'Basic trusted-host-only' } }),
      fetch: (url) => {
        expect(url).toBe(
          'https://www.zefix.admin.ch/ZefixPublicREST/api/v1/company/uid/CHE-123.456.789',
        );
        return Promise.resolve({
          status: 200,
          text: () => Promise.resolve(JSON.stringify([UID_COMPANY])),
        });
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([UID_COMPANY]);
  });
});

describe('Zefix Acquisition empty search result', () => {
  it('executes an empty company-search response through the existing executor', async () => {
    const result = await testEndpoint({
      api: createZefixPublicRestApi(),
      endpointId: 'company-search',
      operationId: 'company.search',
      values: { name: 'No matches' },
      credentialResolver: () => ({ headers: { authorization: 'Basic trusted-host-only' } }),
      fetch: () => Promise.resolve({ status: 200, text: () => Promise.resolve('[]') }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });
});

describe('Zefix company result mapper', () => {
  it('preserves documented provider fields and keeps the complete wire DTO separate', () => {
    expect(mapZefixCompanyResult(UID_COMPANY)).toEqual({
      provider: 'zefix',
      wire: UID_COMPANY,
      company: {
        uid: 'CHE123456789',
        name: 'Example AG',
        legalSeat: 'Zurich',
        canton: 'ZH',
        legalForm: { uid: '0101', name: { de: 'Aktiengesellschaft' } },
        status: 'ACTIVE',
        address: {
          street: 'Example street',
          houseNumber: '1',
          city: 'Zurich',
          swissZipCode: '8000',
        },
        purpose: 'Documented company purpose',
      },
    });
  });

  it('does not invent optional values when Zefix did not supply them', () => {
    const result = mapZefixCompanyResult({ uid: 'CHE-123.456.789' });
    expect(result).toEqual({
      provider: 'zefix',
      wire: { uid: 'CHE-123.456.789' },
      company: {
        uid: 'CHE-123.456.789',
      },
    });
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

  it.each([{ uid: 'not-a-uid' }, { name: 'Missing UID' }] satisfies readonly ZefixCompanyShort[])(
    'rejects an invalid identifier without producing a company result',
    (wire) => {
      expect(mapZefixCompanyResult(wire)).toBeUndefined();
    },
  );

  it('maps no result for an empty local response fixture', () => {
    const results = ([] as readonly ZefixCompanyShort[])
      .map(mapZefixCompanyResult)
      .filter((result) => result !== undefined);
    expect(results).toEqual([]);
  });
});
