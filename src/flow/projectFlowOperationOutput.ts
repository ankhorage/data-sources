import type {
  DataOperationConfig,
  DataOperationPagination,
  DataSourceDiagnostic,
} from '@ankhorage/contracts/data';

import { projectFlowDataSchema } from './schema';
import type { FlowApiOperationDescriptor, FlowApiOperationResult } from './types';

/*** Projects the credential-free response and pagination output for one Flow operation. */
export function projectFlowOperationOutput(
  operation: DataOperationConfig,
  diagnostics: DataSourceDiagnostic[],
  createFieldHandle: (name: string, identity: string) => string,
):
  | {
      readonly result: FlowApiOperationResult;
      readonly pagination?: NonNullable<FlowApiOperationDescriptor['pagination']>;
    }
  | undefined {
  const { response } = operation;
  const schema =
    response?.schema === undefined
      ? undefined
      : projectFlowDataSchema(response.schema, diagnostics, 'response', createFieldHandle);
  if (response?.schema !== undefined && schema === undefined) return undefined;
  return {
    result: {
      ...(response === undefined
        ? {}
        : {
            response: {
              ...(typeof response.status === 'number' ? { status: response.status } : {}),
              ...(schema === undefined ? {} : { schema }),
            },
          }),
      artifact: { kind: 'artifact' },
    },
    ...(operation.pagination === undefined
      ? {}
      : { pagination: { kind: flowPaginationKind(operation.pagination.kind) } }),
  };
}

/*** Narrows open provider pagination categories to Flow's public vocabulary. */
function flowPaginationKind(
  kind: DataOperationPagination['kind'],
): NonNullable<FlowApiOperationDescriptor['pagination']>['kind'] {
  if (kind === 'cursor') return 'cursor';
  if (kind === 'limit-offset') return 'limit-offset';
  if (kind === 'page') return 'page';
  return 'unknown';
}
