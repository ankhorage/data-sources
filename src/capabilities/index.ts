import type { Capability } from '@ankhorage/contracts/capabilities';

/*** Publish the canonical catalog for Data Sources CLI capabilities. */
export const CAPABILITIES = [
  {
    id: 'data-sources.inspect',
    owner: '@ankhorage/data-sources',
    access: ['invoke'],
    binding: { kind: 'action', bindableAs: ['target'] },
    label: 'Inspect data sources',
    description: 'List supported data-source kinds.',
  },
  {
    id: 'data-sources.validate',
    owner: '@ankhorage/data-sources',
    access: ['invoke'],
    binding: { kind: 'action', bindableAs: ['target'] },
    label: 'Validate data-source config',
    description: 'Validate a data-source config with the data-sources package.',
  },
  {
    id: 'data-sources.test',
    owner: '@ankhorage/data-sources',
    access: ['invoke'],
    binding: { kind: 'action', bindableAs: ['target'] },
    label: 'Test data-source endpoint',
    description: 'Build or execute a data-source endpoint test request.',
  },
  {
    id: 'data-sources.normalize',
    owner: '@ankhorage/data-sources',
    access: ['invoke'],
    binding: { kind: 'action', bindableAs: ['target'] },
    label: 'Normalize data-source config',
    description: 'Normalize imported data-source config output.',
  },
] as const satisfies readonly Capability[];
