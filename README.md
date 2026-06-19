# arbabmujtaba.github.io

Personal portfolio and blog site built with React 19, Vite 6, TypeScript, and Tailwind CSS v4.

## Development

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

## Admin Interface

The site includes a built-in CMS admin at `/admin` (available only in development mode). It provides:

- Section-first content organization grouped by page
- Singleton and collection editors with live preview
- Command palette search (`Cmd+K`)
- One-click publish to GitHub Pages

No authentication is required since the admin runs locally only.

For full documentation, see [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md).

## Content

All site content lives in `content/` as Markdown files with YAML frontmatter. The admin interface manages these files directly.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with admin |
| `npm run build` | Production build |
| `npm run lint` | Type-check with TypeScript |
| `npm test` | Run test suite (Vitest) |
| `npx tsx scripts/migrate-sections.ts` | Register content files in state tracker |

## Deployment

The site deploys to GitHub Pages via the workflow in `.github/workflows/deploy.yml`. Publishing from the admin triggers this workflow automatically.
