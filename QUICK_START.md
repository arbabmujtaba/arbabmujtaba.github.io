# Decap CMS Quick Start

## 🎯 5-Minute Setup

### 1. **Start Development Server**

```bash
npm run dev
```

Visit: `http://localhost:3000/admin`

### 2. **Create Your First Content**

- Click any collection (Journal, Tech, Photography, etc.)
- Click "New [Collection]"
- Fill in the fields
- Click "Publish"

✨ Done! Content is saved locally and pushed to GitHub.

---

## 🔄 Local Development Workflow

```
1. npm run dev          # Start server
2. Open /admin         # Edit in CMS
3. Create/edit posts   # Add content
4. Commit to GitHub    # Automatic (if configured)
5. npm run build       # Build for production
6. npm run start       # Run production server
```

---

## 🔐 Production Setup

### Step 1: GitHub OAuth (One-time Setup)

1. Go to: https://github.com/settings/developers
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Name:** Portfolio Admin
   - **Homepage:** `https://yourdomain.com`
   - **Callback:** `https://yourdomain.com/api/auth/callback`
4. Copy **Client ID** and **Client Secret**

### Step 2: Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:

```env
VITE_GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_secret
GITHUB_PERSONAL_TOKEN=your_token
VITE_BASE_URL=https://yourdomain.com
```

### Step 3: Deploy

Choose a platform:

- **Netlify** (Easiest - built-in CMS support)
- **Vercel** (GitHub integration)
- **Self-hosted** (Any VPS with Node.js)

---

## 📁 Project Structure

```
/public/admin/
  ├── index.html      ← CMS UI
  └── config.yml      ← Collections & fields

/content/
  ├── journal/        ← Blog posts
  ├── tech/           ← Tech articles
  ├── photography/    ← Photo galleries
  ├── collection/     ← Curated lists
  └── portfolio/      ← Project showcase

/public/uploads/     ← Images (auto-created)
```

---

## ✅ Checklist

- [ ] Decap CMS loads at `/admin`
- [ ] Can create/edit posts locally
- [ ] Posts save to `content/` folder
- [ ] Images upload to `public/uploads/`
- [ ] GitHub OAuth configured
- [ ] Deployed to production

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Admin page blank | Refresh browser, check network tab |
| Can't create posts | Verify `content/` folder exists |
| Images won't upload | Check permissions on `public/uploads/` |
| GitHub sync fails | Verify Personal Access Token is valid |

---

## 📚 Full Guide

See [DECAP_CMS_SETUP.md](./DECAP_CMS_SETUP.md) for detailed documentation.

## 🔗 Links

- **Decap CMS Docs:** https://decapcms.org/docs/
- **GitHub OAuth Setup:** https://docs.github.com/en/developers/apps/building-oauth-apps
- **Admin Panel:** http://localhost:3000/admin

---

**Ready to start? Run `npm run dev` and visit `/admin`! 🚀**
