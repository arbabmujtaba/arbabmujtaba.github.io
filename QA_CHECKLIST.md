# QA Checklist — Publishing Platform

## Phase 1: Content States
- [x] Create content item → defaults to Draft state
- [x] Draft → Review transition works
- [x] Review → Published transition works
- [x] Review → Draft (reject) works
- [x] Published → Archived works
- [x] Archived → Draft (restore) works
- [x] Invalid transitions blocked (e.g., Draft → Published)
- [x] State badges render with correct colors
- [x] State filters in table work
- [x] content-state.json updates on state change
- [x] Version history tracked per transition

## Phase 2: Preview System
- [x] /preview/:collection/:slug route renders
- [x] Desktop preview (1200px) works
- [x] Tablet preview (768px) works
- [x] Mobile preview (375px) works
- [x] Live preview auto-refreshes on editor changes
- [x] Preview CSS matches production styling

## Phase 3: Git Automation
- [x] simple-git installed
- [x] detectDefaultBranch returns correct branch
- [x] detectConflicts returns conflict status
- [x] stageFiles uses explicit per-file staging
- [x] commit generates 'Published: {Title}' message
- [x] push auto-detects current branch
- [x] rollback soft unstages changes
- [x] Protected branches guard works (no hard reset)

## Phase 4: Publishing Pipeline
- [x] POST /api/publish returns jobId
- [x] 11-step pipeline executes sequentially
- [x] SSE /api/publish/:jobId/progress streams updates
- [x] Duplicate publish guard blocks rapid re-publishes
- [x] Retry logic on network errors (3 retries, backoff)
- [x] Content state transitions to Published on success
- [x] Failed publishes show error details
- [x] Markdown validation catches unclosed code blocks
- [x] Metadata validation rejects missing title/date
- [x] Slug validation enforces URL-safe format

## Phase 5: Deployment Center
- [x] GET /api/deploy/status returns current state
- [x] GET /api/deploy/commits returns git history
- [x] Status cards show correct counts
- [x] Last Published card displays recent publish
- [x] Publishing Queue shows active jobs
- [x] Quick Links show website and repo URLs
- [x] Polling refreshes every 5 seconds

## Phase 6: Dashboard & UX
- [x] Editorial Overview stats show state counts
- [x] Quick Views show Recent Drafts / Pending / Published
- [x] PublishingModal opens on Publish button click
- [x] PublishingModal shows 11-step animated timeline
- [x] PublishingModal shows success with website URL
- [x] Toast notifications auto-dismiss after 4s
- [x] StatusBadge renders correctly per state
- [x] Admin sub-router switches between Dashboard/Editor/Deployment

## Phase 7: General
- [x] TypeScript compiles with zero errors
- [x] No console.log leaks in production code (except error logging)
- [x] All imports resolve correctly
- [x] No dead code or unused variables
- [x] Responsive layout on mobile/tablet/desktop
- [x] Dark theme consistency across all pages
