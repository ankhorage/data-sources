import { describe, expect, it } from 'bun:test';

import * as dataSources from './index';

describe('API phase 1 public surface', () => {
  it('does not export generated API database projection helpers', () => {
    const publicApi = dataSources as Readonly<Record<string, unknown>>;

    expect(publicApi.createGeneratedApiDataSource).toBeUndefined();
    expect(publicApi.normalizeGeneratedApiDataSource).toBeUndefined();
    expect(publicApi.validateGeneratedApiCollection).toBeUndefined();
  });

  it('exports canonical API helpers instead of data-source aliases', () => {
    const publicApi = dataSources as Readonly<Record<string, unknown>>;

    expect(typeof publicApi.createManualRestApi).toBe('function');
    expect(typeof publicApi.createGraphQlApi).toBe('function');
    expect(typeof publicApi.discoverOpenApi).toBe('function');
    expect(typeof publicApi.introspectGraphQlApi).toBe('function');
    expect(publicApi.createManualRestDataSource).toBeUndefined();
    expect(publicApi.createGraphQlDataSource).toBeUndefined();
  });
});
