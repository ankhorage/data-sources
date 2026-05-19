<!-- markdownlint-disable MD013 MD033 -->

# @ankhorage/data-sources

Headless toolkit for importing, generating, normalizing, and testing Ankhorage data-source configurations.

This package does **not** define the canonical app contracts. Shared serializable data-source, endpoint, operation, binding, and metadata contracts live in [`@ankhorage/contracts`](https://github.com/ankhorage/contracts).

This package consumes those contracts and provides helpers for manual REST definitions, OpenAPI import, GraphQL introspection, managed API generation from database adapter references, and endpoint test diagnostics.

## Manual REST definitions

Manual REST definitions are the baseline path for connecting APIs that do not provide OpenAPI or another reliable machine-readable schema.

```ts
import { createManualRestDataSource } from '@ankhorage/data-sources';

const result = createManualRestDataSource({
  id: 'cms',
  baseUrl: 'https://cms.example.com',
  endpoints: [
    {
      id: 'posts',
      path: '/posts/{postId}',
      operations: [
        {
          id: 'posts.get',
          method: 'GET',
          intent: 'read',
          parameters: [
            {
              name: 'postId',
              location: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          response: {
            status: 200,
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
              },
            },
          },
        },
      ],
    },
  ],
});

if (result.ok) {
  console.log(result.data.kind); // "rest"
}
```

The helper validates:

- non-empty base URLs
- endpoint paths that start with `/`
- supported HTTP methods
- path-template parameters against `location: 'path'` parameter definitions

## Ownership boundaries

`@ankhorage/data-sources` owns UI-free helper logic around data-source configuration.

It must not:

- import Studio
- import ZORA
- render UI
- own canonical app or manifest contracts
- own runtime binding lifecycle or cache state
- redefine data-source, endpoint, operation, binding, or metadata contracts from `@ankhorage/contracts`

Other packages own adjacent concerns:

- `@ankhorage/contracts` owns canonical serializable contracts
- `@ankhorage/zora` owns concrete bindable metadata for ZORA components
- `ankhorage4` owns Studio UI and Runtime integration

## Roadmap

Planned repo-local implementation areas:

- OpenAPI import and normalization
- GraphQL introspection and operation modeling
- managed API generation from database adapter references
- endpoint request building and test diagnostics
- structured diagnostics for Studio and CLI consumers

## No legacy / no deprecation

There is no existing production app using this package API.

Do not add compatibility shims, deprecated aliases, migration helpers, or temporary public names. Choose the clean final API shape per issue.
