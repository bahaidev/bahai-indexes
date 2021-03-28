# bahai-indexes CHANGES

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
