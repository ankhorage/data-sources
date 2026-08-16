import type {
  ApiDefinition,
  CredentialRef,
  DataContractValue,
  DataSourceDiagnostic,
  EndpointId,
  OperationId,
} from '@ankhorage/contracts/data';

export type EndpointTestInputValues = Readonly<Record<string, DataContractValue>>;
export type EndpointTestHeaders = Readonly<Record<string, string>>;

export interface EndpointTestCredential {
  readonly headers?: EndpointTestHeaders;
  readonly query?: EndpointTestInputValues;
}

export type EndpointTestCredentialResolver = (
  credential: CredentialRef,
) => EndpointTestCredential | Promise<EndpointTestCredential | undefined> | undefined;

export interface EndpointTestFetchInit {
  readonly method: string;
  readonly headers: EndpointTestHeaders;
  readonly body?: string;
}

export interface EndpointTestFetchResponse {
  readonly status: number;
  readonly headers?: EndpointTestHeaders;
  text(): Promise<string>;
}

export type EndpointTestFetch = (
  url: string,
  init: EndpointTestFetchInit,
) => Promise<EndpointTestFetchResponse>;

export interface EndpointTestInput {
  readonly api: ApiDefinition;
  readonly endpointId: EndpointId;
  readonly operationId: OperationId;
  readonly values?: EndpointTestInputValues;
  readonly dryRun?: boolean;
  readonly fetch?: EndpointTestFetch;
  readonly credentialResolver?: EndpointTestCredentialResolver;
}

export interface EndpointTestRequestDiagnostic {
  readonly apiId: string;
  readonly endpointId: EndpointId;
  readonly operationId: OperationId;
  readonly url: string;
  readonly method: string;
  readonly headers: EndpointTestHeaders;
  readonly body?: string;
  readonly dryRun: boolean;
}

export interface EndpointTestResponseDiagnostic {
  readonly status: number;
  readonly ok: boolean;
  readonly headers?: EndpointTestHeaders;
  readonly bodyText?: string;
  readonly parsedBody?: DataContractValue;
}

export type EndpointTestResult =
  | {
      readonly ok: true;
      readonly request: EndpointTestRequestDiagnostic;
      readonly response?: EndpointTestResponseDiagnostic;
      readonly data?: DataContractValue;
      readonly diagnostics: readonly DataSourceDiagnostic[];
    }
  | {
      readonly ok: false;
      readonly request?: EndpointTestRequestDiagnostic;
      readonly response?: EndpointTestResponseDiagnostic;
      readonly diagnostics: readonly DataSourceDiagnostic[];
    };
