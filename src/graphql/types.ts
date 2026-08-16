import type {
  CredentialRef,
  DataContractValue,
  DataSchema,
  OperationId,
} from '@ankhorage/contracts/data';

export type GraphQlOperationKind = 'mutation' | 'query' | 'subscription';

export interface GraphQlIntrospectionTypeRef {
  readonly kind: string;
  readonly name?: string | null;
  readonly ofType?: GraphQlIntrospectionTypeRef | null;
}

export interface GraphQlIntrospectionInputValue {
  readonly name: string;
  readonly description?: string | null;
  readonly type: GraphQlIntrospectionTypeRef;
  readonly defaultValue?: string | null;
}

export interface GraphQlIntrospectionField {
  readonly name: string;
  readonly description?: string | null;
  readonly args?: readonly GraphQlIntrospectionInputValue[] | null;
  readonly type: GraphQlIntrospectionTypeRef;
}

export interface GraphQlIntrospectionEnumValue {
  readonly name: string;
  readonly description?: string | null;
}

export interface GraphQlIntrospectionType {
  readonly kind: string;
  readonly name?: string | null;
  readonly description?: string | null;
  readonly fields?: readonly GraphQlIntrospectionField[] | null;
  readonly inputFields?: readonly GraphQlIntrospectionInputValue[] | null;
  readonly enumValues?: readonly GraphQlIntrospectionEnumValue[] | null;
  readonly possibleTypes?: readonly GraphQlIntrospectionTypeRef[] | null;
}

export interface GraphQlIntrospectionSchema {
  readonly queryType?: { readonly name?: string | null } | null;
  readonly mutationType?: { readonly name?: string | null } | null;
  readonly subscriptionType?: { readonly name?: string | null } | null;
  readonly types?: readonly GraphQlIntrospectionType[] | null;
}

export interface GraphQlIntrospectionResult {
  readonly __schema?: GraphQlIntrospectionSchema;
}

export interface GraphQlOperationDefinition {
  readonly id: OperationId;
  readonly kind: GraphQlOperationKind;
  readonly name?: string;
  readonly description?: string;
  readonly document?: string;
  readonly variables?: DataSchema;
  readonly response?: DataSchema;
  readonly selectionPath?: string;
  readonly metadata?: DataContractValue;
}

export interface GraphQlApiDefinition {
  readonly id: string;
  readonly endpointUrl: string;
  readonly name?: string;
  readonly description?: string;
  readonly credential?: CredentialRef;
  readonly introspection?: GraphQlIntrospectionResult;
  readonly introspectionEnabled?: boolean;
  readonly schemaVersion?: string;
  readonly operations?: readonly GraphQlOperationDefinition[];
  readonly metadata?: DataContractValue;
}
