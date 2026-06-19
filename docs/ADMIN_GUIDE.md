# Admin Interface Guide

The CMS admin interface provides a section-first content management experience for this personal site. It runs locally in development mode and requires no authentication.

## Getting Started

Start the dev server:

```bash
npm run dev
```

Navigate to `http://localhost:5173/admin` in your browser.

> **Important:** The admin is a local-only tool. It runs exclusively in development mode and has no authentication layer. Do not expose the dev server to the public internet.

## Interface Structure

### Sidebar Navigation

The sidebar organizes all editable content by **page**:

| Page | Sections |
|------|----------|
| Home | Home Hero, Profile Bio, Gateways, Quotes, Principles |
| Photography | Photography Entries, Photo Gallery, Photography Gear |
| Collection | Timeline, Favorites, Inspirations |
| Tech | Tech Notes, Experiments, Things I Like |
| Journal | Journal |
| Portfolio | Portfolio Projects, Portfolio Skills |
| Site/Global | Page Heroes |

Click a page group to expand it, then click a section to open the editor.

### Top Bar

- **Search** - Open the command palette (also accessible via `Cmd+K` / `Ctrl+K`)
- **Deploy** - Trigger a publish to GitHub Pages
- **View Site** - Open the live site in a new tab

### Command Palette

Press `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux) to open the command palette. It provides instant fuzzy search across all content items, letting you jump directly to any entry without navigating the sidebar.

## Editor Types

### Singleton Editor

Used for sections with a single record (e.g., Home Hero, Profile Bio, Portfolio Skills). Opens directly into the edit form for that content item. Changes are saved immediately to the local filesystem.

### Collection Editor

Used for sections with multiple items (e.g., Journal, Photography Entries, Gateways). Provides:

- **List view** - Shows all items in the collection with title, status, and date
- **Add** - Create a new content item with the section's field schema
- **Edit** - Open an existing item for editing
- **Delete** - Remove an item (with confirmation)
- **Reorder** - Drag items to change their display order

## Field Types

The admin supports the following field types:

| Type | Description |
|------|-------------|
| `text` | Single-line text input |
| `textarea` | Multi-line text input |
| `markdown` | Markdown editor with preview |
| `image` | Image upload/selection with preview |
| `gallery` | Multiple image selection |
| `link` | URL input |
| `select` | Dropdown with predefined options |
| `number` | Numeric input |
| `boolean` | Toggle switch |
| `date` | Date picker |
| `tags` | Comma-separated tag input |

## Save vs Publish

The admin separates **saving** from **publishing**:

### Save

- Writes changes to the local filesystem (`content/` directory)
- Updates `content-state.json` to track the item's state
- Changes are reflected immediately in the local dev preview
- No network access required

### Publish

- Commits all saved changes to git
- Pushes to the remote repository
- Triggers the GitHub Pages deployment workflow
- The live site updates after the deployment completes (typically 1-2 minutes)

You can save frequently and publish only when you are ready to go live.

## Live Preview

When editing a content item, the preview pane shows a live rendering of the page that contains your content. The preview:

- Loads the page at the section's configured preview route
- Auto-refreshes when you save changes
- Renders in an iframe to match the actual site appearance

Preview routes are configured per section (e.g., `/` for Home sections, `/photography` for photography content).

## Content Storage

All content lives in the `content/` directory as Markdown files with YAML frontmatter:

```
content/
  home/          # Home page sections (profile, gateways, quotes, principles)
  journal/       # Journal entries
  tech/          # Tech notes and experiments
  photography/   # Photography posts
  collection/    # Collection/inspiration entries
  portfolio/     # Portfolio projects
  gallery/       # Individual gallery photos
  gear/          # Photography gear
  timeline/      # Timeline milestones
  favorites/     # Favorite tools, software, gear
  pages/         # Page hero sections and singleton pages
```

Each file follows this structure:

```markdown
---
title: My Entry Title
slug: my-entry-title
date: 2024-01-15
category: Life
coverImage: /uploads/photo.jpg
---

Body content goes here in Markdown.
```

## Adding New Sections

To add a new section to the admin:

1. Open `src/lib/sections.ts`
2. Add a new entry to the `SECTIONS` array:

```typescript
{
  id: 'unique-section-id',
  page: 'page-name',       // Which sidebar group (home, photography, tech, etc.)
  title: 'Section Title',  // Display name in sidebar
  kind: 'collection',      // 'singleton' or 'collection'
  collection: 'content-dir', // Maps to content/{collection}/ directory
  filter: { category: 'Optional' }, // Optional: filter items by frontmatter field
  slug: 'specific-slug',   // Required for singletons: which file to edit
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    // ... define all editable fields
  ],
  previewRoute: '/page-path', // Optional: route for live preview
  description: 'Brief description of this section',
}
```

3. If the section uses a new collection directory, create it under `content/` and add any initial `.md` files.

## Migration Script

To migrate existing content files into the content-state registry:

```bash
npx tsx scripts/migrate-sections.ts
```

This scans all `content/` directories and registers any untracked files in `content-state.json`.

## Architecture Overview

```
src/pages/admin/
  AdminLayout.tsx        # Main shell with sidebar + content area
  AdminSidebar.tsx       # Page/section navigation tree
  AdminTopBar.tsx        # Search, deploy, view site actions
  AdminDashboard.tsx     # Landing page with overview stats
  SectionPanel.tsx       # Routes to the correct editor type

src/components/admin/
  SingletonSectionEditor.tsx   # Editor for single-record sections
  CollectionSectionEditor.tsx  # List + editor for multi-item sections
  PreviewPane.tsx              # Live preview iframe
  CommandPalette.tsx           # Global search overlay
  fields/                      # Field type components + FieldRenderer

src/lib/
  sections.ts           # Section registry (the source of truth)
  sectionResolver.ts    # Backend: reads/writes content files for sections
  preview.ts            # Preview URL utilities
  commandPalette.ts     # Search/filter utilities
  contentState.ts       # Publishing state tracker
```
