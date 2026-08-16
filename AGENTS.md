# Agent Instructions

## Scope

`@ankhorage/data-sources` is a headless toolkit for importing, generating, normalizing, and testing Ankhorage data-source configurations.

This package consumes canonical serializable contracts from `@ankhorage/contracts`.

It must not own or redefine canonical app contracts.

## Boundaries

- Do not import Studio.
- Do not import ZORA.
- Do not render UI.
- Do not own app manifest contracts.
- Do not own runtime binding lifecycle or cache state.
- Keep helpers provider-neutral unless a later issue explicitly adds provider-specific support behind a clean boundary.

## Module ownership

- An implementation file exports symbols it owns and defines itself.
- Do not import a symbol into an implementation file merely to re-export it.
- Re-exporting belongs only in explicit barrel/public-entry files such as `index.ts`.
- Barrels should re-export directly from the owning module (`export { x } from './owner'`) instead of importing `x` only to export it again.
- Leaf/implementation modules must not import from a parent or sibling barrel when a concrete owner module exists. Import the owner directly to avoid reverse dependencies and cycles.
- Put shared constants, types, and helpers in a clearly named owner module rather than making `index.ts` their implementation owner.

## TypeScript rules

- Do not use `any`.
- Do not use `as any` or broad casts to silence errors.
- Do not use `@ts-ignore` or `@ts-expect-error` unless explicitly requested.
- Do not disable ESLint rules inline.
- Do not weaken TypeScript strictness.
- Build output must go to `dist/` only.

## Verification

Run before completing changes:

```bash
bun run build
bun run lint:fix
bun run test
```

Use `bun run typecheck` when changing types or public exports.

## No legacy / no deprecation

There is no existing production consumer for this package API.

Do not add compatibility shims, deprecated aliases, migration helpers, or temporary public names.
Choose the clean final API shape for each issue.
