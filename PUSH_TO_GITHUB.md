# Push to GitHub Instructions

Your repository is ready with CI/CD configured! Follow these steps to push to GitHub:

## Option 1: Using HTTPS (Recommended for first-time)

```bash
cd /tmp/cc-agent/59542171/project

# Remote is already added to https://github.com/getmobilehq/prayso.git
# Just push to GitHub
git push -u origin main
```

When prompted, enter your GitHub credentials:
- **Username:** Your GitHub username
- **Password:** Your GitHub Personal Access Token (not your password)

### Don't have a Personal Access Token?
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it "Prayer.so Deploy"
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token and use it as your password

---

## Option 2: Using SSH (If you have SSH keys set up)

```bash
cd /tmp/cc-agent/59542171/project

# Change remote to SSH
git remote set-url origin git@github.com:getmobilehq/prayso.git

# Push to GitHub
git push -u origin main
```

---

## After Pushing

### 1. Configure GitHub Secrets for CI/CD

Go to: https://github.com/getmobilehq/prayso/settings/secrets/actions

Add these secrets (click "New repository secret" for each):

#### Supabase Secrets
```
Name: VITE_SUPABASE_URL
Value: https://uxqeflsdgkkbqjaaakrk.supabase.co

Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cWVmbHNkZ2trYnFqYWFha3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTY1NzgsImV4cCI6MjA3NzU5MjU3OH0.Hn4anG1o_FGZ5U7Y4oFxZfT4yDJN--Y5rY8hFgRwPWk
```

#### LiveKit Secret
```
Name: VITE_LIVEKIT_URL
Value: wss://jesusify-c3uvv175.livekit.cloud
```

### 2. Set Up Vercel Deployment

#### A. Create Vercel Project
1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click "Add New" → "Project"
4. Import `getmobilehq/prayso`
5. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_LIVEKIT_URL`
7. Click "Deploy"

#### B. Get Vercel Credentials for GitHub Actions
1. Create Vercel Token:
   - Go to https://vercel.com/account/tokens
   - Create token named "GitHub Actions"
   - Copy the token

2. Get Project IDs:
   - Open your project in Vercel
   - Go to Settings → General
   - Copy:
     - Project ID
     - Team/Org ID (found near the top)

3. Add to GitHub Secrets:
   ```
   VERCEL_TOKEN → (your token)
   VERCEL_PROJECT_ID → (from Vercel)
   VERCEL_ORG_ID → (from Vercel)
   ```

### 3. Configure Custom Domain (prayer.so)

In Vercel:
1. Go to your project → Settings → Domains
2. Add domain: `prayer.so`
3. Add domain: `www.prayer.so`
4. Follow DNS instructions provided by Vercel

At your domain registrar:
1. Add A record: `@` → `76.76.21.21`
2. Add CNAME: `www` → `cname.vercel-dns.com`

### 4. Update Supabase Settings

In Supabase Dashboard:
1. Go to Authentication → URL Configuration
2. Add these redirect URLs:
   - `https://prayer.so/**`
   - `https://www.prayer.so/**`
3. Set Site URL to: `https://prayer.so`

---

## What Happens After Push?

1. **Automatic Testing:** GitHub Actions runs tests on every push
2. **Automatic Deployment:** Successful builds automatically deploy to Vercel
3. **Preview Deployments:** Every PR gets a preview URL
4. **Production Deployment:** Main branch deploys to prayer.so

---

## Verify Everything Works

### Check GitHub Actions
- Go to: https://github.com/getmobilehq/prayso/actions
- You should see workflows running

### Check Vercel
- Go to your Vercel dashboard
- You should see the deployment

### Visit Your Site
- https://prayer.so (after DNS propagates)
- Or use the Vercel preview URL

---

## Troubleshooting

### "Repository not found" error
- Make sure the repository exists at https://github.com/getmobilehq/prayso
- Check you have push access
- Verify your credentials

### Authentication failed
- Use Personal Access Token, not password
- Token needs `repo` scope
- Generate new token if needed

### CI/CD not running
- Check GitHub secrets are configured
- Review Actions tab for errors
- Verify workflow files are in `.github/workflows/`

---

## Quick Reference

**Repository:** https://github.com/getmobilehq/prayso
**Project Directory:** `/tmp/cc-agent/59542171/project`
**Branch:** main
**CI/CD:** GitHub Actions + Vercel
**Domain:** prayer.so

---

Ready to push! Run the commands above and you're live! 🚀
