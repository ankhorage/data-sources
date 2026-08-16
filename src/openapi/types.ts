import type { CredentialRef, DataContractValue } from '@ankhorage/contracts/data';

export type OpenApiHttpMethod =
  | 'delete'
  | 'get'
  | 'head'
  | 'options'
  | 'patch'
  | 'post'
  | 'put';

export interface OpenApiServerObject {
  readonly url: string;
  readonly description?: string;
}

export interface OpenApiSchemaObject {
  readonly $ref?: string;
  readonly type?: string | readonly string[];
  readonly title?: string;
  readonly description?: string;
  readonly enum?: readonly DataContractValue[];
  readonly const?: DataContractValue;
  readonly default?: DataContractValue;
  readonly format?: string;
  readonly nullable?: boolean;
  readonly required?: readonly string[];
  readonly properties?: Readonly<Record<string, OpenApiSchemaObject>>;
  readonly additionalProperties?: boolean | OpenApiSchemaObject;
  readonly items?: OpenApiSchemaObject;
  readonly allOf?: readonly OpenApiSchemaObject[];
  readonly anyOf?: readonly OpenApiSchemaObject[];
  readonly oneOf?: readonly OpenApiSchemaObject[];
}

export interface OpenApiMediaTypeObject {
  readonly schema?: OpenApiSchemaObject;
}

export interface OpenApiRequestBodyObject {
  readonly description?: string;
  readonly required?: boolean;
  readonly content?: Readonly<Record<string, OpenApiMediaTypeObject>>;
}

export interface OpenApiResponseObject {
  readonly description?: string;
  readonly content?: Readonly<Record<string, OpenApiMediaTypeObject>>;
}

export interface OpenApiParameterObject {
  readonly name: string;
  readonly in: string;
  readonly required?: boolean;
  readonly description?: string;
  readonly schema?: OpenApiSchemaObject;
}

export interface OpenApiOperationObject {
  readonly operationId?: string;
  readonly summary?: string;
  readonly description?: string;
  readonly deprecated?: boolean;
  readonly parameters?: readonly OpenApiParameterObject[];
  readonly requestBody?: OpenApiRequestBodyObject;
  readonly responses?: Readonly<Record<string, OpenApiResponseObject>>;
}

export type OpenApiPathItemObject = Partial<Record<OpenApiHttpMethod, OpenApiOperationObject>> & {
  readonly parameters?: readonly OpenApiParameterObject[];
};

export interface OpenApiComponentsObject {
  readonly schemas?: Readonly<Record<string, OpenApiSchemaObject>>;
  readonly securitySchemes?: Readonly<Record<string, DataContractValue>>;
}

export interface OpenApiDocumentObject {
  readonly openapi?: string;
  readonly info?: {
    readonly title?: string;
    readonly version?: string;
    readonly description?: string;
  };
  readonly servers?: readonly OpenApiServerObject[];
  readonly paths?: Readonly<Record<string, OpenApiPathItemObject>>;
  readonly components?: OpenApiComponentsObject;
}

export interface OpenApiImportInput {
  readonly id: string;
  readonly document: OpenApiDocumentObject;
  readonly baseUrl?: string;
  readonly credential?: CredentialRef;
  readonly documentId?: string;
  readonly documentUrl?: string;
  readonly name?: string;
  readonly description?: string;
  readonly metadata?: DataContractValue;
}
