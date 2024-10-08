# CHANGES to `bahai-indexes`

## ?

BREAKING CHANGE:
    Require Node 18+

- chore: update devDeps. and lint

## 0.14.0

- chore: update to non-vulnerable `httpquery`, devDeps. and lint
- chore: update repo metainfo

## 0.13.0

- feat: Lights of Guidance
- fix: allow seeAlso processing when children are present

## 0.12.0

- feat: adds SAQ index
- fix: bug with entry clicks

## 0.11.0

BREAKING: Requires Node 14

- feat: index links
- fix: bug with Aqdas index parsing
- fix: bug with Iqan seeAlso
- fix: parser paths
- fix: button width
- chore: update `httpquery`, devDeps and lint
- docs: add missing index

## 0.10.0

- feat: add Gleanings

## 0.9.1

- fix: ensure display is 100% when a panel is collapsed

## 0.9.0

- feat: add collapse state buttons and parameter to activate

## 0.8.4

- fix: regression in not showing full contents in all mode with full index
    entries

## 0.8.3

- fix: was not separating by book in multi-book view

## 0.8.2

- fix: disable forms until ready

## 0.8.1

- docs: link to demo, to-dos

## 0.8.0

- feat: allow for URL param storage instead of local storage
- feat: adds placeholders

## 0.7.0

- feat: provide redirect at `/indexes/` (for external use)

## 0.6.1

- fix: issue with merge links

## 0.6.0

- fix: do not throw with text using Roman numerals
- feat: avoid hard-coding URL
- chore: update `httpquery` and devDeps.

## 0.5.0

- feat: add webapp for querying indexes (uses httpquery)
- fix: avoid throwing when building flattened JSON
- refactor: add `$text` on all entries
- refactor: add `$book` on top-level items (for jsonata support)
- chore: bump devDeps.

## 0.4.0

- Linting: Latest per ash-nazg
- npm: Update devDeps. including peerDeps. of `eslint-config-ash-nazg`
- npm: Switch to pnpm
- npm: Update devDeps.

## 0.3.0

- Breaking change; Require Node 12 (runs asynchronously)
- Breaking change; Switch to ESM
- Breaking change; Logs completion
- Breaking change: Change parser and src file paths
- Linting (ESLint): As per latest ash-nazg
- Docs: Mention npm install and copyrights
- Maintenance: Add `.editorconfig`
- npm: Add script for `build`
- npm: Update devDeps.

## 0.2.0

- Enhancement: Provide flattened JSON export

## 0.1.0

- Index for the *Kitáb-i-Aqdas*
  - Parses HTML copy into JSON
  - Parses flattened JSON from hierarchical JSON (main verses only)
  - Validates IDs are unique and that see-also link references match an ID
  - Validate links
