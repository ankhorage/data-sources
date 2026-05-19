import { defineParadoxConfig } from '@ankhorage/paradox';

export default defineParadoxConfig({
  mode: 'write',

  docs: {
    title: '@ankhorage/data-sources',
    description:
      'Provider-neutral data source and endpoint system for APIs, databases, and runtime bindings.',
  },

  package: {
    root: '.',
    entrypoints: ['src/index.ts'],
  },

  output: {
    dir: './paradox',
  },
});
