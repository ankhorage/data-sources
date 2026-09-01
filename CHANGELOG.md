# @ankhorage/data-sources

## 2.0.1

### Patch Changes

- 1a59139: Update Ankhorage dependencies: `@ankhorage/contracts`, `@ankhorage/paradox`.

## 2.0.0

### Major Changes

- 5be6ff8: Consume canonical Contracts v8 API definitions directly, execute external REST and GraphQL APIs without database projection, and remove the generated-API data-source surface.

## 1.0.1

### Patch Changes

- 20ed34c: Validate generated API collection fields and explicit primary-key references in the owning data-source package so Studio and other callers can consume one canonical diagnostic surface.

## 1.0.0

### Major Changes

- c540b7f: Adopt the canonical API source taxonomy, normalize generated API desired state directly from `@ankhorage/contracts`, and remove the legacy managed API source surface.

## 0.6.0

### Minor Changes

- 4922dcd: Add transport-injected OpenAPI URL discovery and GraphQL introspection primitives for canonical external data-source authoring.

## 0.5.5

### Patch Changes

- d3b1d6a: Expose the Ankh provider through the canonical `./cli` package entrypoint.

## 0.5.4

### Patch Changes

- a3583c8: Declare the package-relative Ankh provider entry and its implemented capabilities.

## 0.5.3

### Patch Changes

- 2188199: Update package metadata.

## 0.5.2

### Patch Changes

- 6436cf9: Expose data-source inspection, validation, test, and normalization commands through an Ankh provider manifest.

## 0.5.1

### Patch Changes

- 84abe70: Update CONTRACTS & update docs

## 0.5.0

### Minor Changes

- 5a52064: Add a headless endpoint test runner with dry-run request building, injected fetch execution, credential resolution, response parsing, and structured diagnostics.

## 0.4.0

### Minor Changes

- bc25acb: Add a headless endpoint test runner with dry-run request building, injected fetch execution, credential resolution, response parsing, and structured diagnostics.

## 0.3.0

### Minor Changes

- f4266e8: Add managed API generation helpers that derive normalized database endpoint and CRUD operation configs from provider-neutral adapter references and collection definitions.

## 0.2.0

### Minor Changes

- 504dc55: Add dependency-free GraphQL introspection normalization helpers and serializable GraphQL operation modeling.

## 0.1.0

### Minor Changes

- a52311c: Add manual REST data-source definition helpers with normalization and structured diagnostics.
- 84ddd56: Add dependency-free OpenAPI JSON import helpers that normalize paths, operations, parameters, requests, responses, schemas, and diagnostics into shared Ankhorage data-source contracts.
- bee5b37: Establish the package baseline, ownership boundaries, shared contracts dependency, and initial smoke-tested public API.
