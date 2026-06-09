# Decap CMS + React + GitHub Setup Guide

This guide walks you through setting up **Decap CMS** (formerly Netlify CMS) with your React portfolio, using GitHub as the backend and local development support.

## ✅ Current Setup Status

Your project has:
- ✅ React + TypeScript frontend
- ✅ Express backend with local storage API
- ✅ Decap CMS admin panel at `/admin`
- ✅ Content collections configured (journal, tech, photography, collection, portfolio)
- ✅ Local backend proxy enabled for development
- ✅ CORS headers configured for local development

## 🚀 Development (Local Testing)

### 1. Start Local Development Server

```bash
npm run dev
```

This starts your Express server on `http://localhost:3000` with:
- Frontend at `http://localhost:3000`
- Admin panel at `http://localhost:3000/admin`

### 2. Access the Admin Panel

Visit `http://localhost:3000/admin` in your browser.

**Local Development Mode:**
- No GitHub authentication required
- Uses local file system storage via Express API
- Perfect for testing CMS workflows locally

### 3. Create/Edit Content

The admin panel allows you to:
- Create new posts in Journal, Tech, Photography, Collections, and Portfolio
- Upload images (stored in `public/uploads/[collection]/`)
- Edit frontmatter metadata (title, date, category, etc.)
- Write markdown content
- Preview changes in real-time

## 🔐 Production Setup (GitHub Integration)

### Prerequisites

You need:
1. GitHub Personal Access Token (PAT) with repo permissions
2. OAuth Application credentials (Optional, for better UX)
3. Deploy platform: Netlify, Vercel, or similar

### Option A: GitHub Personal Access Token (Simple)

**For quick testing without OAuth setup:**

1. Generate a [GitHub Personal Access Token](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (full control of private repositories)
   - Copy and save the token securely

2. Use the token in your Decap CMS configuration
   - When prompted in the admin panel, paste your token
   - Decap CMS will use this for direct GitHub API access

**Security Note:** This method exposes your token in the browser. Only use for testing!

### Option B: GitHub OAuth App (Recommended for Production)

This provides secure authentication without exposing personal tokens.

#### Step 1: Create GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in the form:
   - **Application name:** Your Portfolio Admin
   - **Homepage URL:** `https://yourdomain.com` (or `http://localhost:3000` for testing)
   - **Authorization callback URL:** `https://yourdomain.com/api/auth/callback` (or `http://localhost:3000/api/auth/callback`)

4. Copy your:
   - **Client ID**
   - **Client Secret** (keep this secure!)

#### Step 2: Set Environment Variables

Create a `.env.local` file in your project root:

```env
VITE_GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_PERSONAL_TOKEN=your_personal_token_here
```

#### Step 3: Add OAuth Handler to Server

Add this to your `server.ts` to handle OAuth callbacks:

```typescript
import axios from 'axios';

// OAuth endpoint
app.post('/api/auth', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.VITE_GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/callback`
    }, {
      headers: { Accept: 'application/json' }
    });

    const { access_token, error } = response.data;
    
    if (error) {
      return res.status(401).json({ error });
    }

    res.json({ token: access_token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// OAuth callback redirect
app.get('/api/auth/callback', (req, res) => {
  const { code } = req.query;
  if (code) {
    res.redirect(`/admin?code=${code}`);
  } else {
    res.redirect('/admin?error=no_code');
  }
});
```

#### Step 4: Update Admin Config

Modify `public/admin/config.yml`:

```yaml
backend:
  name: github
  repo: arbabandjones/portfolio
  branch: main
  auth_endpoint: /api/auth
  base_url: https://yourdomain.com  # Add your domain
```

## 📱 Deployment Options

### Option 1: Netlify (Recommended)

Netlify has built-in Decap CMS support:

1. Push your code to GitHub
2. Connect your repo to [Netlify](https://netlify.com)
3. Set environment variables in Netlify dashboard:
   - `VITE_GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
4. Deploy!

Netlify automatically handles:
- OAuth authentication
- Static hosting
- Serverless functions for backend

### Option 2: Vercel

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Add environment variables in project settings
3. Deploy with `npm run build`

### Option 3: Self-Hosted

For self-hosted deployments:

1. Build: `npm run build`
2. Start production: `npm run start`
3. Expose port 3000 to your domain (nginx reverse proxy recommended)

## 🔄 Workflow Examples

### Creating a Journal Entry via Admin Panel

1. Go to `/admin`
2. Click "Journal" collection
3. Click "New Journal"
4. Fill in:
   - Title: "My First Post"
   - Slug: "my-first-post"
   - Date: Today's date
   - Category: "Thoughts"
   - Body: Write your markdown content
5. Click "Publish" to commit to GitHub main branch

### Uploading Images

1. In the admin panel, click on image field
2. Click "Choose different media" or upload new
3. Select from `public/uploads/` or upload new image
4. Image is automatically optimized and saved
5. Image path is inserted into content

### Managing Collections

Collections are configured in `public/admin/config.yml`:

- **journal** - Personal journal entries
- **tech** - Technical blog posts
- **photography** - Photo galleries
- **collection** - Curated collections (books, gear, etc.)
- **portfolio** - Project showcase

Add new collections by extending the YAML config.

## 🐛 Troubleshooting

### "Cannot connect to GitHub"

**Solution:**
- Verify your Personal Access Token is valid
- Check repo name matches `arbabandjones/portfolio`
- Ensure GitHub branch is set to `main`

### Admin panel loads but collections are empty

**Solution:**
- Check that content files exist in `content/[collection]/` folders
- Verify markdown files have proper frontmatter format
- Check browser console for API errors

### Local development shows "Authentication required"

**Solution:**
- Ensure `local_backend: true` is set in config.yml
- Restart development server: `npm run dev`
- Clear browser cache: `Cmd+Shift+Delete` (Mac)

### Images not uploading

**Solution:**
- Check `public/uploads/` directory permissions
- Verify image file size is under 50MB
- Check allowed formats: JPG, PNG, WebP
- Look at server logs for upload errors

## 📚 Resources

- [Decap CMS Documentation](https://decapcms.org/docs/)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Express.js Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)

## 🔗 Quick Links

- **Admin Panel:** `http://localhost:3000/admin`
- **Content Folder:** `./content/`
- **Config File:** `public/admin/config.yml`
- **Server Code:** `server.ts`

---

**Happy editing! 🎉**

Questions? Check the [Decap CMS GitHub Discussions](https://github.com/decaporg/decap-cms/discussions).
