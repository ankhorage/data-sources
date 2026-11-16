import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { expect, it } from 'bun:test';

const repositoryRoot = resolve(import.meta.dir, '../..');

it('supports Node, Bun, and Expo consumers across every published runtime entrypoint', () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'data-sources-flow-consumer-'));
  try {
    const archive = packDataSources(temporaryRoot);
    const consumerDirectory = join(temporaryRoot, 'consumer');
    mkdirSync(consumerDirectory);
    writeFileSync(
      join(consumerDirectory, 'package.json'),
      JSON.stringify({ name: 'flow-consumer', private: true, version: '0.0.0' }),
    );
    run('bun', ['add', archive, '--ignore-scripts'], consumerDirectory, temporaryRoot);
    verifyNodeAndBunConsumers(consumerDirectory, temporaryRoot);
    verifyExpoConsumers(consumerDirectory, temporaryRoot);
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
}, 120_000);

function verifyNodeAndBunConsumers(consumerDirectory: string, temporaryRoot: string): void {
  run(
    'node',
    ['--input-type=module', '--eval', nodeConsumerSource],
    consumerDirectory,
    temporaryRoot,
  );
  writeFileSync(join(consumerDirectory, 'consumer.ts'), consumerSource);
  writeFileSync(join(consumerDirectory, 'tsconfig.json'), nodeNextConfig);
  run(
    'bun',
    ['add', '--dev', 'typescript@~6.0.0', '--ignore-scripts'],
    consumerDirectory,
    temporaryRoot,
  );
  run('bunx', ['tsc', '--noEmit', '--project', 'tsconfig.json'], consumerDirectory, temporaryRoot);
  writeFileSync(join(consumerDirectory, 'platform-consumer.ts'), platformConsumerSource);
  writeFileSync(join(consumerDirectory, 'tsconfig.platform.json'), platformNodeNextConfig);
  run(
    'bunx',
    ['tsc', '--noEmit', '--project', 'tsconfig.platform.json'],
    consumerDirectory,
    temporaryRoot,
  );
  run('bun', ['run', 'consumer.ts'], consumerDirectory, temporaryRoot);
}

function verifyExpoConsumers(consumerDirectory: string, temporaryRoot: string): void {
  writeFileSync(join(consumerDirectory, 'app.json'), expoAppConfig);
  writeFileSync(join(consumerDirectory, 'index.tsx'), expoConsumerSource);
  run('bun', expoDependencies, consumerDirectory, temporaryRoot);
  for (const platform of expoPlatforms)
    run(
      'bunx',
      ['expo', 'export', '--platform', platform, '--output-dir', `dist-${platform}`],
      consumerDirectory,
      temporaryRoot,
    );
}

/** Packs the exact built checkout as an isolated consumer dependency. */
function packDataSources(temporaryRoot: string): string {
  const packageDirectory = join(temporaryRoot, 'package');
  mkdirSync(packageDirectory);
  run(
    'npm',
    ['pack', '--ignore-scripts', '--pack-destination', packageDirectory],
    repositoryRoot,
    temporaryRoot,
  );
  const archive = readdirSync(packageDirectory).find((file) => file.endsWith('.tgz'));
  if (archive === undefined) throw new Error('Packed Data Sources archive was not created.');
  return join(packageDirectory, archive);
}

/** Runs one consumer setup command and surfaces both process streams on failure. */
function run(
  command: string,
  arguments_: readonly string[],
  cwd: string,
  cacheDirectory: string,
): void {
  const result = Bun.spawnSync({
    cmd: [command, ...arguments_],
    cwd,
    env: {
      ...process.env,
      CI: '1',
      EXPO_NO_TELEMETRY: '1',
      npm_config_cache: join(cacheDirectory, '.npm-cache'),
    },
    stderr: 'pipe',
    stdout: 'pipe',
  });
  const errorOutput = new TextDecoder().decode(result.stderr);
  expect(result.exitCode, `${command} ${arguments_.join(' ')}\n${errorOutput}`).toBe(0);
}

const consumerSource = `
import { createFlowApiOperationOwner, createManualRestApi } from '@ankhorage/data-sources';
import type { FlowProviderCapabilityRef } from '@ankhorage/contracts/flow';

const api = createManualRestApi({
  id: 'consumer-api',
  baseUrl: 'https://api.example.test',
  endpoints: [{ id: 'items', path: '/items', operations: [{ id: 'items.list', intent: 'read', method: 'GET' }] }],
});
if (!api.ok) throw new Error('API fixture was rejected.');
const descriptor = createFlowApiOperationOwner({
  handleKey: new TextEncoder().encode('01234567890123456789012345678901'),
}).project(api.data, 'items', 'items.list');
if (!descriptor.ok) throw new Error('Flow projection was rejected.');
const capability: FlowProviderCapabilityRef = descriptor.data.capability;
if (capability.providerId !== '@ankhorage/data-sources') throw new Error('Unexpected provider.');
`;

const nodeConsumerSource = `
await Promise.all([
  import('@ankhorage/data-sources'),
  import('@ankhorage/data-sources/cli'),
  import('@ankhorage/data-sources/capabilities'),
]);
`;

const platformConsumerSource = `
import { createManualRestApi } from '@ankhorage/data-sources';

const api = createManualRestApi({
  id: 'platform-consumer-api',
  baseUrl: 'https://api.example.test',
  endpoints: [],
});
if (!api.ok) throw new Error('API fixture was rejected.');
`;

const expoAppConfig = JSON.stringify({
  expo: {
    name: 'data-sources-packed-consumer',
    slug: 'data-sources-packed-consumer',
    web: { bundler: 'metro' },
  },
});

const expoConsumerSource = `
export { createManualRestApi } from '@ankhorage/data-sources';

export default function App() {
  return null;
}
`;

const expoDependencies = [
  'add',
  'expo@57.0.33',
  'react@19.2.3',
  'react-dom@19.2.3',
  'react-native@0.86.3',
  'react-native-web@0.21.4',
  '--ignore-scripts',
];

const expoPlatforms = ['web', 'android', 'ios'] as const;

const nodeNextConfig = JSON.stringify({
  compilerOptions: {
    lib: ['ES2022', 'DOM'],
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    noEmit: true,
    strict: true,
    target: 'ES2022',
  },
  include: ['consumer.ts'],
});

const platformNodeNextConfig = JSON.stringify({
  compilerOptions: {
    customConditions: ['react-native'],
    lib: ['ES2022', 'DOM'],
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    noEmit: true,
    strict: true,
    target: 'ES2022',
  },
  include: ['platform-consumer.ts'],
});
