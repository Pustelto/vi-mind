# Task 3 & 4: Layout and Search

## Status: Done

### Phase 3: Hierarchical Layout
- [x] Build tree structure from flat nodes
- [x] Calculate subtree heights recursively
- [x] Position nodes with children centered
- [x] Generate edges between nodes
- [x] Calculate bounds
- [x] 13 tests

### Phase 4: Search Service
- [x] Fuse.js integration for fuzzy search
- [x] Return scores and match indices
- [x] updateNodes for index refresh
- [x] 13 tests

## Verification
- `npm run test:run -- tests/layout tests/services` - ✅ 57 tests pass
- `npm run lint` - ✅ No errors
- `npx tsc --noEmit` - ✅ No type errors

## Files Created
- `src/layout/hierarchicalLayout.ts`
- `src/services/searchService.ts`
- `tests/layout/hierarchicalLayout.test.ts`
- `tests/services/searchService.test.ts`

## Key Decisions
- Layout uses fixed dimensions (NODE_WIDTH=120, NODE_HEIGHT=40)
- Horizontal spacing: 180px, vertical spacing: 60px
- Children are centered vertically relative to parent
- Search threshold: 0.4 (configurable in Fuse.js options)
