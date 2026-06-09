# Deployment Checklist for Decap CMS + React Portfolio

## Pre-Deployment (Local Testing)

- [ ] **Test CMS locally**
  - [-] Run `npm run dev`
  - [-] Visit `http://localhost:3000/admin`
  - [-] Create a test post in each collection
  - [-] Upload and verify images appear correctly
  - [-] Verify posts are saved to `content/` folders as markdown

- [ ] **Check build process**
  - [-] Run `npm run build` successfully completes
  - [-] Run `npm run start` to test production server
  - [-] Verify `/admin` still works in production mode
  - [-] Check for any build warnings or errors

- [ ] **Repository is ready**
  - [ ] Push all changes to GitHub (main branch)
  - [ ] Repository is public or private with proper permissions
  - [ ] `.env.local` is added to `.gitignore` (NEVER commit secrets)

---

## GitHub OAuth Setup (For Production)

- [ ] **Create GitHub OAuth Application**
  - [ ] Go to: https://github.com/settings/developers
  - [ ] Click "OAuth Apps" → "New OAuth App"
  - [ ] Set:
    - Application Name: `Portfolio Admin`
    - Homepage URL: `https://yourdomain.com`
    - Authorization callback: `https://yourdomain.com/api/auth/callback`
  - [ ] Save Client ID and Client Secret

- [ ] **Environment Variables Ready**
  - [ ] `VITE_GITHUB_CLIENT_ID` = Your OAuth App Client ID
  - [ ] `GITHUB_CLIENT_SECRET` = Your OAuth App Client Secret
  - [ ] `GITHUB_PERSONAL_TOKEN` = Your GitHub Personal Access Token
  - [ ] `VITE_BASE_URL` = Your production domain

---

## Choose Deployment Platform

### Option A: Netlify (⭐ Recommended)

- [ ] **Netlify Account Setup**
  - [ ] Create account at https://netlify.com
  - [ ] Connect your GitHub repository
  - [ ] Authorize Netlify to access your repo

- [ ] **Configure Environment Variables**
  - [ ] Go to Site Settings → Build & Deploy → Environment
  - [ ] Add all variables from `.env.example`:
    - `VITE_GITHUB_CLIENT_ID`
    - `GITHUB_CLIENT_SECRET`
    - `GITHUB_PERSONAL_TOKEN`
    - `VITE_BASE_URL`

- [ ] **Configure Build**
  - [ ] Base directory: `/`
  - [ ] Build command: `npm run build`
  - [ ] Publish directory: `dist`

- [ ] **Deploy**
  - [ ] Push to GitHub main branch
  - [ ] Netlify auto-deploys
  - [ ] Check deploy logs for errors
  - [ ] Visit your site: `https://yoursite.netlify.app` or custom domain

- [ ] **Test Production CMS**
  - [ ] Visit `/admin` on production
  - [ ] Login with GitHub OAuth
  - [ ] Create a test post
  - [ ] Verify it appears in your repo on GitHub

### Option B: Vercel

- [ ] **Vercel Setup**
  - [ ] Create account at https://vercel.com
  - [ ] Import GitHub repository
  - [ ] Vercel auto-detects build settings

- [ ] **Add Environment Variables**
  - [ ] Project Settings → Environment Variables
  - [ ] Add all required variables

- [ ] **Deploy**
  - [ ] Push to GitHub
  - [ ] Vercel auto-deploys
  - [ ] Custom domain setup (optional)

### Option C: Self-Hosted (VPS/Server)

- [ ] **Server Preparation**
  - [ ] Linux VPS (Ubuntu 20.04 LTS recommended)
  - [ ] Install Node.js 18+ and npm
  - [ ] Install PM2: `npm install -g pm2`
  - [ ] Setup reverse proxy (nginx/Apache)
  - [ ] SSL certificate (Let's Encrypt)

- [ ] **Deploy Application**
  - [ ] Clone repo: `git clone https://github.com/your-repo.git`
  - [ ] Install deps: `npm install`
  - [ ] Build: `npm run build`
  - [ ] Start with PM2: `pm2 start "npm start" --name portfolio`
  - [ ] Setup nginx proxy to forward `yourdomain.com` → `localhost:3000`

- [ ] **Systemd Service (Optional, for auto-start)**
  - [ ] Create `/etc/systemd/system/portfolio.service`
  - [ ] Enable: `sudo systemctl enable portfolio`
  - [ ] Start: `sudo systemctl start portfolio`

---

## Post-Deployment

- [ ] **Verify Everything Works**
  - [ ] Homepage loads correctly
  - [ ] All pages/collections accessible
  - [ ] Admin panel at `/admin`
  - [ ] Images load from correct URLs

- [ ] **Test CMS on Production**
  - [ ] Login to `/admin`
  - [ ] Create a new post
  - [ ] Upload an image
  - [ ] Publish and verify in GitHub repo
  - [ ] Post appears on main site

- [ ] **Setup Analytics (Optional)**
  - [ ] Google Analytics
  - [ ] Sentry for error tracking
  - [ ] Cloudflare for DDoS protection

- [ ] **Security Check**
  - [ ] Verify `.env` not exposed in repo
  - [ ] Check GitHub OAuth token has minimal scopes
  - [ ] Enable 2FA on GitHub account
  - [ ] HTTPS enforced (redirect HTTP → HTTPS)

- [ ] **Backup Strategy**
  - [ ] GitHub repo is your backup (all content is there)
  - [ ] Automated backups of uploads folder (optional)
  - [ ] Test restore procedure

---

## Troubleshooting Deployment

### Admin page shows "Unable to connect to backend"

**Causes:**
- OAuth credentials not set or incorrect
- Environment variables not deployed
- CORS issues with GitHub API

**Solutions:**
1. Check environment variables are set on deployment platform
2. Verify OAuth app credentials in GitHub settings
3. Check server logs for API errors

### Images upload fails

**Causes:**
- `public/uploads` directory doesn't exist
- Permissions issue
- File size limit exceeded

**Solutions:**
```bash
# Check directory exists and is writable
ls -la public/uploads
chmod 755 public/uploads
```

### Commits to GitHub fail

**Causes:**
- Invalid GitHub Personal Token
- Token doesn't have `repo` scope
- Token expired

**Solutions:**
1. Generate new token: https://github.com/settings/tokens
2. Ensure `repo` scope is selected
3. Update environment variable

---

## Maintenance

- [ ] **Weekly**
  - [ ] Check deployment logs for errors
  - [ ] Verify CMS is still working
  - [ ] Monitor site uptime

- [ ] **Monthly**
  - [ ] Update dependencies: `npm update`
  - [ ] Review GitHub security
  - [ ] Backup content (already in GitHub)

- [ ] **Quarterly**
  - [ ] Update Node.js version
  - [ ] Audit npm packages: `npm audit`
  - [ ] Test disaster recovery

---

## Quick Commands Reference

```bash
# Local development
npm run dev                    # Start dev server with CMS

# Production
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Check TypeScript

# Deployment
git push origin main          # Trigger auto-deploy (on Netlify/Vercel)
```

---

## Support & Resources

- **Decap CMS Issues:** https://github.com/decaporg/decap-cms/issues
- **Netlify Deploy Help:** https://docs.netlify.com/
- **GitHub OAuth Help:** https://docs.github.com/en/developers/apps
- **Server Logs:** Check deployment platform dashboard

---

## Done! 🎉

Your portfolio is now live with:
- ✅ Full CMS for managing content
- ✅ GitHub as your content backend
- ✅ Secure OAuth authentication
- ✅ Image uploads and management
- ✅ Automated deployments

**Start editing:** https://yourdomain.com/admin
