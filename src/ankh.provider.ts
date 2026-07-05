import {
  DATA_SOURCES_PACKAGE_NAME,
  SUPPORTED_DATA_SOURCE_KINDS,
} from './index';

const DATA_SOURCES_PACKAGE_VERSION = '0.5.1';
const DATA_SOURCES_COMMAND_CATEGORY = 'data-sources';

const DATA_SOURCES_CAPABILITIES = [
  'data-sources.inspect',
  'data-sources.validate',
  'data-sources.test',
  'data-sources.normalize',
] as const;

const commands = [
  {
    path: ['kind', 'list'],
    summary: 'List supported data-source kinds.',
    capability: 'data-sources.inspect',
    aliases: ['kinds'],
    examples: ['ankh data-sources kind list'],
  },
  {
    path: ['config', 'validate'],
    summary: 'Validate a data-source config with the data-sources package.',
    capability: 'data-sources.validate',
    examples: ['ankh data-sources config validate ./data-source.json'],
  },
  {
    path: ['endpoint', 'test'],
    summary: 'Build or execute a data-source endpoint test request.',
    capability: 'data-sources.test',
    examples: ['ankh data-sources endpoint test orders listOrders --dry-run'],
  },
  {
    path: ['config', 'normalize'],
    summary: 'Normalize imported data-source config output.',
    capability: 'data-sources.normalize',
    examples: ['ankh data-sources config normalize ./openapi.json'],
  },
] as const;

const handlers = commands.map((command) => ({
  path: command.path,
  handler(request: {
    readonly context: {
      writeStdout(text: string): void;
    };
  }) {
    const supportedKinds = SUPPORTED_DATA_SOURCE_KINDS.join(', ');
    request.context.writeStdout(
      `${command.path.join(' ')} is provided by ${DATA_SOURCES_PACKAGE_NAME}. ` +
        `Supported kinds: ${supportedKinds}.\n`,
    );
    return { exitCode: 0 };
  },
}));

const provider = {
  id: DATA_SOURCES_PACKAGE_NAME,
  category: DATA_SOURCES_COMMAND_CATEGORY,
  version: DATA_SOURCES_PACKAGE_VERSION,
  capabilities: DATA_SOURCES_CAPABILITIES,
  commands,
  handlers,
};

export default provider;
