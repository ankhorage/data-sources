<!-- markdownlint-disable MD013 MD033 -->

# @ankhorage/data-sources

Headless toolkit for importing, generating, normalizing, and testing Ankhorage data-source configurations.

This package does **not** define the canonical app contracts. Shared serializable data-source, endpoint, operation, binding, and metadata contracts live in [`@ankhorage/contracts`](https://github.com/ankhorage/contracts).

This package consumes those contracts and provides helpers for manual REST definitions, OpenAPI import, GraphQL introspection, managed API generation from database adapter references, and endpoint test diagnostics.

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

## Initial package surface

The baseline package currently exports package metadata and contract-kind helpers only. Feature helpers are intentionally implemented in later issues.

```ts
import { getDataSourcesPackageInfo, isSupportedDataSourceKind } from '@ankhorage/data-sources';

const info = getDataSourcesPackageInfo();
const isRest = isSupportedDataSourceKind('rest');
```

## Roadmap

Planned repo-local implementation areas:

- manual REST data-source definition helpers
- OpenAPI import and normalization
- GraphQL introspection and operation modeling
- managed API generation from database adapter references
- endpoint request building and test diagnostics
- structured diagnostics for Studio and CLI consumers

## No legacy / no deprecation

There is no existing production app using this package API.

Do not add compatibility shims, deprecated aliases, migration helpers, or temporary public names. Choose the clean final API shape per issue.
