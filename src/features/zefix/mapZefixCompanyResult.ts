import type {
  ZefixAddress,
  ZefixCompanyFull,
  ZefixCompanyShort,
  ZefixCompanyStatus,
  ZefixLegalForm,
} from '../../types/zefix.js';

/***
 * Map one Zefix company DTO into a portable, provenance-preserving acquisition result.
 *
 * The returned `wire` object is the provider record and remains distinct from the curated
 * `company` projection. Manual CRM contacts, activities, follow-ups, and user-entered fields are
 * intentionally absent: they must be stored by their application owner, not mixed with Zefix data.
 */
export function mapZefixCompanyResult(
  wire: ZefixCompanyShort | ZefixCompanyFull,
): ZefixCompanyResult | undefined {
  if (wire.uid === undefined || !ZEFIX_UID_PATTERN.test(wire.uid)) return undefined;

  return {
    provider: 'zefix',
    wire,
    company: {
      uid: wire.uid,
      ...(wire.name === undefined ? {} : { name: wire.name }),
      ...(wire.ehraid === undefined ? {} : { ehraid: wire.ehraid }),
      ...(wire.chid === undefined ? {} : { chid: wire.chid }),
      ...(wire.legalSeat === undefined ? {} : { legalSeat: wire.legalSeat }),
      ...('canton' in wire && wire.canton !== undefined ? { canton: wire.canton } : {}),
      ...(wire.legalForm === undefined ? {} : { legalForm: wire.legalForm }),
      ...(wire.status === undefined ? {} : { status: wire.status }),
      ...('address' in wire && wire.address !== undefined ? { address: wire.address } : {}),
      ...('purpose' in wire && wire.purpose !== undefined ? { purpose: wire.purpose } : {}),
    },
  };
}

export interface ZefixCompanyResult {
  readonly provider: 'zefix';
  /** Exact provider DTO, never a location for manual CRM fields. */
  readonly wire: ZefixCompanyShort | ZefixCompanyFull;
  /** Curated provider facts used for acquisition; all fields come directly from `wire`. */
  readonly company: ZefixCompanyResultCompany;
}

export interface ZefixCompanyResultCompany {
  readonly uid: string;
  readonly name?: string;
  readonly ehraid?: number;
  readonly chid?: string;
  readonly legalSeat?: string;
  readonly canton?: string;
  readonly legalForm?: ZefixLegalForm;
  readonly status?: ZefixCompanyStatus;
  readonly address?: ZefixAddress;
  readonly purpose?: string;
}

const ZEFIX_UID_PATTERN = /^CHE-?\d{3}\.?\d{3}\.?\d{3}$/;
