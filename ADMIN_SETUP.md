# Admin Portal Setup Guide - GitHub Pages Edition

## Overview

The admin portal allows you to edit content directly from your GitHub repo using **GitHub API**. No backend server needed - everything runs on GitHub Pages!

### ⚡ How It Works

1. **Edit in Browser**: Click the lock icon to authenticate with your GitHub token
2. **Edit Content**: Hover over any portfolio/journal entry and click the edit button
3. **Save Directly to GitHub**: Changes are pushed directly to your repo via GitHub API
4. **Automatic Deploy**: GitHub Pages rebuilds automatically

## Quick Setup (3 steps)

### 1️⃣ Create GitHub Personal Access Token

1. Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Give it a name (e.g., "Portfolio Admin")
3. Select scopes: **`repo`** (full control of private repositories)
4. Click "Generate token"
5. **Copy the token** (you won't see it again!)

### 2️⃣ Configure Environment

Edit `.env.local`:

```env
GEMINI_API_KEY=your_key_here
APP_URL=http://localhost:5173
VITE_GITHUB_REPO=your-username/your-repo
```

### 3️⃣ Run Locally (Development)

```bash
npm run dev
```

- Visit `http://localhost:5173`
- Click the lock icon (🔒) bottom-right
- Paste your GitHub token
- Hover over content → edit button appears
- Save changes → pushed directly to GitHub

## GitHub Pages Deployment

### Building

```bash
npm run build
```

Output in `/dist/` ready for GitHub Pages.

### Deploying

**Option A: GitHub Actions (Recommended)**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Option B: Manual Deploy**

```bash
npm run build
git add dist/
git commit -m "Build"
git push
```

Then enable GitHub Pages in repo settings → Source: `gh-pages` branch.

## Admin Portal Features

### Hover-to-Edit
- Move mouse over portfolio projects or journal entries
- Orange edit button appears (🟠)
- Click to open editor

### Full Editor
- **Left side**: YAML frontmatter (metadata)
- **Right side**: Markdown body content
- Side-by-side view for easy editing

### Save to GitHub
- Click "Save to GitHub"
- Changes commit to your repo
- GitHub Pages rebuilds automatically
- Page reloads with new content

## Security

### ⚠️ GitHub Token Safety

- **Use sessionStorage** (clears when tab closes)
- **Never commit token** to git
- **Keep `.env.local` in `.gitignore`** ✓ (already done)
- **Rotate token occasionally** via GitHub settings
- Token scoped to `repo` (can access all your repos)

### Optional: Restrict to Public Repos Only

If concerned, create a token with `public_repo` scope instead of `repo`. You'll only be able to edit public repositories.

## Troubleshooting

### "Invalid GitHub token" error
- ✓ Token is wrong or expired
- ✓ Create a new token at [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
- ✓ Make sure scope includes `repo`

### Changes don't appear
- ✓ GitHub Pages rebuilds take ~1 minute
- ✓ Check Actions tab in repo for deployment status
- ✓ Hard refresh browser (Cmd+Shift+R)

### "GitHub repo not configured"
- ✓ Set `VITE_GITHUB_REPO=your-username/your-repo` in `.env.local`
- ✓ Use exact repo name (case-sensitive on Unix)

### Edit button doesn't appear
- ✓ Click lock icon and authenticate first
- ✓ Must be in admin mode (lock icon should show status)
- ✓ Hover over a portfolio/journal entry

## File Structure

```
src/
├── context/
│   └── AdminContext.tsx           # Global admin state
├── components/
│   ├── EditButton.tsx             # Hover edit button
│   ├── EditModal.tsx              # GitHub-powered editor
│   └── AdminAuthModal.tsx         # GitHub token auth
└── App.tsx                        # Admin provider + modals
```

## API Integration

All requests use **GitHub API v3** directly (no backend):

- **Authentication**: Bearer token (GitHub Personal Access Token)
- **Base URL**: `https://api.github.com`
- **Rate limit**: 5,000 requests/hour (free tier)

### Edit Endpoints

**Get file SHA (for updates):**
```
GET /repos/{owner}/{repo}/contents/{path}
```

**Create/Update file:**
```
PUT /repos/{owner}/{repo}/contents/{path}
Body: { message, content (base64), sha }
```

## What's Editable

✅ **Portfolio** - Project title, description, tech stack, images  
✅ **Journal** - Entry title, date, category, content  
📋 Easily extend to Tech, Photography, Collection (same pattern)

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `GEMINI_API_KEY` | Gemini AI integration | No (for future use) |
| `APP_URL` | App hostname | No |
| `VITE_GITHUB_REPO` | Repo for editing (owner/repo) | ✅ Yes |

## Cost

✅ **Completely Free**
- GitHub API: Free tier (generous)
- GitHub Pages: Free hosting
- No backend/server costs
- No trial restrictions

## Next Steps

- [ ] Edit a portfolio project
- [ ] Edit a journal entry
- [ ] Commit a change and see GitHub Pages update
- [ ] Add edit buttons to more content types
- [ ] Implement draft mode with localStorage fallback

