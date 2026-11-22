/**
 * Zefix PublicREST wire-level DTOs (Swiss Federal Registry of Commerce).
 * Source: https://www.zefix.admin.ch/ZefixPublicREST/v3/api-docs
 * OpenAPI: 3.1.0; official API version: 2.7.2.4.
 * License: OGD open use, attribution required:
 * https://opendata.swiss/en/terms-of-use#terms_by
 *
 * Response properties are optional because the official schemas do not
 * declare them required. Date-format fields remain JSON strings.
 * These upstream data shapes must not be exposed as uncurated gateway DTOs.
 */

/** OpenAPI date-format string (YYYY-MM-DD), not a Date object. */
export type ZefixDate = string;

/** Upstream RestApiErrorResponse.error.type values. */
export type ZefixErrorType =
  | 'INTERNAL_SERVER_ERROR'
  | 'INVALID_QUERY_WORDS'
  | 'INVALID_REQUEST_DATA'
  | 'RESULTLIST_TO_LARGE'
  | 'NOT_FOUND';

/** Exact Zefix status vocabulary, distinct from UI labels. */
export type ZefixCompanyStatus = 'ACTIVE' | 'CANCELLED' | 'BEING_CANCELLED';

/** Upstream schema: ErrorDetails. */
export interface ZefixErrorDetails {
  readonly type?: ZefixErrorType;
  readonly message?: string;
}

/** Upstream schema: RestApiErrorResponse. */
export interface ZefixRestApiErrorResponse {
  readonly error?: ZefixErrorDetails;
}

/** Upstream schema: CompanySearchQuery. The name is the only required field. */
export interface ZefixCompanySearchQuery {
  /** At least 3 characters; supports * as a wildcard. */
  readonly name: string;
  /** Internal legal form identifier (1–999). */
  readonly legalFormId?: number;
  /** Public four-character eCH-0097 legal form code. */
  readonly legalFormUid?: string;
  /** Cannot be combined with legalSeatId or canton. */
  readonly registryOfCommerceId?: number;
  /** Cannot be combined with registryOfCommerceId or canton. */
  readonly legalSeatId?: number;
  /** Cannot be combined with registryOfCommerceId or legalSeatId. */
  readonly canton?: string;
  readonly activeOnly?: boolean;
}

/** Upstream schema: DFIEString (de/fr/it/en translation fields). */
export interface ZefixDFIEString {
  readonly de?: string;
  readonly fr?: string;
  readonly it?: string;
  readonly en?: string;
}

/** Upstream schema: LegalForm. */
export interface ZefixLegalForm {
  readonly id?: number;
  readonly uid?: string;
  readonly name?: ZefixDFIEString;
  readonly shortName?: ZefixDFIEString;
}

/** Upstream schema: CompanyShort. */
export interface ZefixCompanyShort {
  readonly name?: string;
  readonly ehraid?: number;
  readonly uid?: string;
  readonly chid?: string;
  readonly legalSeatId?: number;
  readonly legalSeat?: string;
  readonly registryOfCommerceId?: number;
  readonly legalForm?: ZefixLegalForm;
  readonly status?: ZefixCompanyStatus;
  /** Most recent SOGC publication date, not necessarily incorporation. */
  readonly sogcDate?: ZefixDate;
  readonly deletionDate?: ZefixDate;
}

/** Upstream schema: MutationType. */
export interface ZefixMutationType {
  readonly id?: number;
  readonly key?: string;
}

/** Upstream schema: SogcPublication. */
export interface ZefixSogcPublication {
  readonly sogcDate?: ZefixDate;
  readonly sogcId?: number;
  readonly registryOfCommerceId?: number;
  readonly registryOfCommerceCanton?: string;
  readonly registryOfCommerceJournalId?: number;
  readonly registryOfCommerceJournalDate?: ZefixDate;
  readonly message?: string;
  readonly mutationTypes?: readonly ZefixMutationType[];
}

/** Upstream schema: SogcPublicationAndCompanyShort. */
export interface ZefixSogcPublicationAndCompanyShort {
  readonly sogcPublication?: ZefixSogcPublication;
  readonly companyShort?: ZefixCompanyShort;
}

/** Upstream schema: RegistryOfCommerce. */
export interface ZefixRegistryOfCommerce {
  readonly registryOfCommerceId?: number;
  readonly canton?: string;
  readonly address1?: string;
  readonly address2?: string;
  readonly address3?: string;
  readonly address4?: string;
  readonly homepage?: string;
  /** Excerpt URL pattern for active companies. */
  readonly url2?: string;
  /** Cantonal registry contact address, not company contact information. */
  readonly url3?: string;
  /** Excerpt URL pattern for deleted companies. */
  readonly url4?: string;
  /** Upstream reserved field. */
  readonly url5?: string;
}

/** Upstream schema: Address. */
export interface ZefixAddress {
  readonly organisation?: string;
  readonly careOf?: string;
  readonly street?: string;
  readonly houseNumber?: string;
  readonly addon?: string;
  readonly poBox?: string;
  readonly city?: string;
  readonly swissZipCode?: string;
}

/** Upstream schema: CompanyOldName. */
export interface ZefixCompanyOldName {
  readonly name?: string;
  /** Larger sequence numbers indicate older entries. */
  readonly sequenceNr?: number;
  readonly translation?: readonly string[];
}

/** Upstream schema: CompanyFull, extending CompanyShort. */
export interface ZefixCompanyFull extends ZefixCompanyShort {
  readonly translation?: readonly string[];
  readonly purpose?: string;
  readonly sogcPub?: readonly ZefixSogcPublication[];
  readonly address?: ZefixAddress;
  readonly canton?: string;
  /** The nominal capital is a string in the Zefix API. */
  readonly capitalNominal?: string;
  readonly capitalCurrency?: string;
  readonly headOffices?: readonly ZefixCompanyShort[];
  readonly furtherHeadOffices?: readonly ZefixCompanyShort[];
  readonly branchOffices?: readonly ZefixCompanyShort[];
  readonly hasTakenOver?: readonly ZefixCompanyShort[];
  readonly wasTakenOverBy?: readonly ZefixCompanyShort[];
  readonly auditCompanies?: readonly ZefixCompanyShort[];
  readonly oldNames?: readonly ZefixCompanyOldName[];
  readonly cantonalExcerptWeb?: string;
  readonly zefixDetailWeb?: ZefixDFIEString;
}

/** Upstream schema: BfsCommunity. */
export interface ZefixBfsCommunity {
  readonly bfsId?: number;
  readonly canton?: string;
  readonly name?: string;
  readonly registryOfCommerceId?: number;
}

/** All 14 named schemas from the official Zefix PublicREST specification. */
export interface ZefixSchemas {
  readonly ErrorDetails: ZefixErrorDetails;
  readonly RestApiErrorResponse: ZefixRestApiErrorResponse;
  readonly CompanySearchQuery: ZefixCompanySearchQuery;
  readonly CompanyShort: ZefixCompanyShort;
  readonly DFIEString: ZefixDFIEString;
  readonly LegalForm: ZefixLegalForm;
  readonly MutationType: ZefixMutationType;
  readonly SogcPublication: ZefixSogcPublication;
  readonly SogcPublicationAndCompanyShort: ZefixSogcPublicationAndCompanyShort;
  readonly RegistryOfCommerce: ZefixRegistryOfCommerce;
  readonly Address: ZefixAddress;
  readonly CompanyFull: ZefixCompanyFull;
  readonly CompanyOldName: ZefixCompanyOldName;
  readonly BfsCommunity: ZefixBfsCommunity;
}

/** Every documented operation and its exact successful response payload. */
export interface ZefixOperations {
  readonly 'POST /api/v1/company/search': {
    readonly body: ZefixCompanySearchQuery;
    readonly response: readonly ZefixCompanyShort[];
  };
  readonly 'GET /api/v1/company/uid/{id}': {
    readonly path: { readonly id: string };
    readonly response: readonly ZefixCompanyFull[];
  };
  readonly 'GET /api/v1/company/ehraid/{id}': {
    readonly path: { readonly id: number };
    readonly response: ZefixCompanyFull;
  };
  readonly 'GET /api/v1/company/chid/{id}': {
    readonly path: { readonly id: string };
    readonly response: readonly ZefixCompanyFull[];
  };
  readonly 'GET /api/v1/sogc/{id}': {
    readonly path: { readonly id: number };
    readonly response: ZefixSogcPublicationAndCompanyShort;
  };
  readonly 'GET /api/v1/sogc/bydate/{date}': {
    readonly path: { readonly date: ZefixDate };
    readonly response: readonly ZefixSogcPublicationAndCompanyShort[];
  };
  readonly 'GET /api/v1/registryOfCommerce': {
    readonly response: readonly ZefixRegistryOfCommerce[];
  };
  readonly 'GET /api/v1/registryOfCommerce/byBfsCommunityId/{id}': {
    readonly path: { readonly id: string };
    readonly response: ZefixRegistryOfCommerce;
  };
  readonly 'GET /api/v1/legalForm': {
    readonly response: readonly ZefixLegalForm[];
  };
  readonly 'GET /api/v1/community': {
    readonly response: readonly ZefixBfsCommunity[];
  };
}

/** Supported upstream method+path identifiers. */
export type ZefixOperation = keyof ZefixOperations;

/** Successful response for the selected upstream operation. */
export type ZefixOperationResponse<T extends ZefixOperation> = ZefixOperations[T]['response'];
