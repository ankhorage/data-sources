import type { DataOperationMethod } from '@ankhorage/contracts/data';

import type { FlowApiOperationDescriptor, FlowApiOperationMethod } from './types.js';

const FLOW_HTTP_METHODS = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'] as const;

/** Narrows open Data Sources methods to Flow's closed transport vocabulary. */
export function projectFlowTransport(
  method: DataOperationMethod | undefined,
): Pick<FlowApiOperationDescriptor, 'method'> {
  return method !== undefined && isFlowHttpMethod(method) ? { method } : {};
}

/** Checks whether a method belongs to the persistable Flow transport vocabulary. */
function isFlowHttpMethod(method: DataOperationMethod): method is FlowApiOperationMethod {
  return FLOW_HTTP_METHODS.some((candidate) => candidate === method);
}
