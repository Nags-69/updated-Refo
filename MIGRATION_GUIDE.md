# 🚀 Refo App - Migration Guide to Your Own Supabase

This guide will help you migrate this project from Lovable Cloud to your own Supabase instance.

## 📋 Prerequisites

- A Supabase account (free tier works!)
- Node.js and npm/bun installed locally
- Git installed on your machine
- Basic understanding of environment variables

---

## 🔧 Step 1: Clone from GitHub

If you've already connected this project to GitHub via Lovable:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

If not connected yet:
1. Click the GitHub button in Lovable
2. Connect your GitHub account
3. Create a new repository
4. Clone as shown above

---

## 🗄️ Step 2: Set Up Your Supabase Project

### 2.1 Create a New Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in:
   - **Name**: `refo-app` (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest to your users
   - **Pricing Plan**: Free tier is fine to start

5. Click **"Create new project"**
6. Wait 2-3 minutes for setup to complete

### 2.2 Prevent Auto-Pause (Important!)

**By default, Supabase free tier projects pause after 7 days of inactivity.**

To prevent this:

**Option A: Upgrade to Pro Plan ($25/month)**
- Go to Settings → Billing
- Upgrade to Pro plan
- Projects never pause

**Option B: Stay on Free Tier**
- Set up a simple cron job or monitoring service to ping your database weekly
- Use services like [UptimeRobot](https://uptimerobot.com/) (free) to ping your app's URL every 5 minutes
- Or manually visit your app once per week

**Option C: Use Supabase CLI to keep it active**
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link your project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# The CLI keeps the project active when linked
```

---

## 🔑 Step 3: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy the following values:

```
Project URL: https://YOUR_PROJECT_ID.supabase.co
Anon/Public Key: eyJhbGc...
Service Role Key: eyJhbGc... (keep this secret!)
Project ID: YOUR_PROJECT_ID
```

---

## 🗃️ Step 4: Run Database Migrations

### 4.1 Get All Migration Files

All database schema migrations are in the `supabase/migrations/` folder. These files contain:
- Table schemas
- RLS policies
- Database functions
- Triggers
- Storage buckets

### 4.2 Apply Migrations

**Option A: Using Supabase Dashboard (Easiest)**

1. Go to your Supabase project → **SQL Editor**
2. Open each migration file from `supabase/migrations/` in order (by timestamp)
3. Copy the SQL content and paste into the SQL Editor
4. Click **"Run"** for each migration
5. Verify no errors appear

**Option B: Using Supabase CLI (Recommended)**

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your local project to remote Supabase
supabase link --project-ref YOUR_PROJECT_ID

# Push all migrations
supabase db push
```

### 4.3 Verify Database Schema

After migrations, verify in Supabase Dashboard → **Table Editor**:

✅ Tables created:
- `profiles`
- `wallet`
- `user_roles`
- `offers`
- `tasks`
- `transactions`
- `badges`
- `user_badges`
- `user_streaks`
- `affiliate_links`
- `payout_requests`
- `categories`
- `chats`
- `chat_messages`
- `task_cleanup_log`

---

## 🪣 Step 5: Set Up Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket:
   - **Name**: `task-proofs`
   - **Public**: Yes
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/*`

3. Set up RLS policies for the bucket (should be done via migrations, but verify):
   - Users can upload to their own folder
   - Users can view their own files
   - Admins can view all files

---

## 🔐 Step 6: Configure Authentication

1. Go to **Authentication → Providers** in Supabase
2. Enable the auth methods you want:
   - ✅ **Email** (enabled by default)
   - ✅ **Phone** (requires Twilio setup - optional)
   - ✅ **Google OAuth** (requires Google Cloud setup - optional)

3. Go to **Authentication → Settings**:
   - Enable **"Confirm email"** → **OFF** (for faster testing)
   - Set **Site URL**: `http://localhost:5173` (for local dev)
   - Add **Redirect URLs**:
     - `http://localhost:5173/dashboard`
     - `https://YOUR_PRODUCTION_DOMAIN.com/dashboard`

---

## 🔧 Step 7: Set Up Environment Variables

### 7.1 Create `.env` File

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...YOUR_ANON_KEY
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

### 7.2 Update `.gitignore`

Make sure `.env` is in `.gitignore`:

```
# .gitignore
.env
.env.local
```

---

## 🚀 Step 8: Deploy Edge Functions (Optional)

If you're using edge functions (like `refo-chat`):

### 8.1 Set Up Secrets

```bash
# Set the Lovable AI API key (if using Lovable AI)
supabase secrets set LOVABLE_API_KEY=your_lovable_api_key

# Set any other API keys
supabase secrets set GEMINI_API_KEY=your_gemini_key_if_needed
```

### 8.2 Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy refo-chat
```

---

## 👤 Step 9: Create Your Admin Account

### 9.1 Sign Up

1. Run the app locally: `npm run dev`
2. Go to the login page
3. Sign up with your email

### 9.2 Grant Admin Role

In Supabase dashboard → **SQL Editor**, run:

```sql
-- Replace YOUR_EMAIL with your actual email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.com';
```

### 9.3 Verify Admin Access

1. Refresh your app
2. Navigate to `/admin`
3. You should now have access!

---

## 🧪 Step 10: Test Everything

### Authentication
- ✅ Sign up with email
- ✅ Sign in with email
- ✅ Sign out

### User Features
- ✅ View dashboard
- ✅ Complete tasks
- ✅ Upload proof images
- ✅ Request payouts
- ✅ View leaderboard

### Admin Features
- ✅ Access admin panel
- ✅ Manage users
- ✅ Approve/reject tasks
- ✅ Process payouts
- ✅ Create offers

---

## 🌐 Step 11: Deploy to Production

### Option A: Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

### Option B: Deploy to Netlify

1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Site settings

### Option C: Deploy to Your Own Server

```bash
# Build the app
npm run build

# Upload the `dist` folder to your server
# Serve using nginx, Apache, or any static file server
```

---

## 🔒 Security Checklist

After migration, verify:

- ✅ All RLS policies are active
- ✅ Admin role verification works
- ✅ JWT verification enabled on edge functions
- ✅ Environment variables are not committed to Git
- ✅ Database backup is configured (Supabase does daily backups on Pro)
- ✅ CORS is properly configured
- ✅ Rate limiting is set up (if needed)

---

## 🆘 Troubleshooting

### "Project paused" error
- Your Supabase project auto-paused after 7 days
- Go to Supabase dashboard → Settings → General → Restore project
- Set up a cron job or upgrade to Pro to prevent this

### "RLS policy violation" error
- Check that the user is authenticated
- Verify RLS policies allow the operation
- Check if user_id columns are properly set

### "Cannot read properties of null" error
- User session might be expired
- Clear localStorage and sign in again
- Check if auth is properly configured

### Edge functions not working
- Verify secrets are set: `supabase secrets list`
- Check function logs: `supabase functions logs refo-chat`
- Ensure JWT verification is properly configured

### Admin panel access denied
- Verify your user has admin role in `user_roles` table
- Check `has_role()` function exists in database
- Clear browser cache and sign in again

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [React + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🎉 You're All Set!

Your Refo app is now running on your own Supabase instance. You have full control over:
- Database and backups
- Edge functions
- Storage
- Authentication
- Scaling and performance

**Need help?** Open an issue on GitHub or reach out to the community!

---

## 💡 Pro Tips

1. **Enable database backups** in Supabase Settings → Database → Backups
2. **Monitor usage** in Supabase Settings → Usage to avoid hitting limits
3. **Use Supabase Studio locally** with `supabase start` for development
4. **Set up database webhooks** for real-time notifications
5. **Enable email templates** in Auth → Email Templates for branded emails

Good luck! 🚀
