# 🎯 Refo - Referral & Offer Rewards Platform

A full-stack referral and rewards platform built with React, TypeScript, and Supabase. Users can complete tasks, earn rewards, and request payouts.

## ✨ Features

### 👥 User Features
- 🔐 Secure authentication (Email, Phone OTP)
- 📊 Personal dashboard with earnings tracking
- 🎯 Browse and complete offers
- 📸 Upload task completion proofs
- 💰 Request and track payouts
- 🏆 Leaderboard with achievements
- 🔥 Streak tracking and badges
- 💬 AI-powered help chat

### 👨‍💼 Admin Features
- 📈 Comprehensive admin dashboard
- 👤 User management
- 📝 Offer creation and management
- ✅ Task verification and approval
- 💳 Payout processing
- 📊 Analytics and overview
- 🔧 System configuration

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State Management**: TanStack Query
- **Routing**: React Router v6
- **AI**: Lovable AI Gateway (Gemini models)
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Git
- Supabase account (for own deployment)

### Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install
# or
bun install

# Set up environment variables
# Create .env file with your Supabase credentials:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
# VITE_SUPABASE_PROJECT_ID=your-project-id

# Run development server
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:5173`

## 📦 Project Structure

```
refo-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── admin/          # Admin panel components
│   │   ├── AdminRoute.tsx  # Admin access control
│   │   └── ProtectedRoute.tsx # Auth protection
│   ├── pages/              # Route pages
│   ├── contexts/           # React contexts (Auth)
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Supabase integration
│   ├── utils/              # Utility functions
│   ├── lib/                # Library configurations
│   └── index.css           # Global styles
├── supabase/
│   ├── functions/          # Edge functions
│   ├── migrations/         # Database migrations
│   └── config.toml         # Supabase configuration
├── public/                 # Static assets
└── MIGRATION_GUIDE.md      # Detailed migration instructions
```

## 🔐 Security Features

✅ **All Critical Security Issues Fixed:**
- ✅ Admin access control with role-based permissions
- ✅ JWT authentication on all edge functions
- ✅ Comprehensive RLS policies on all tables
- ✅ Input validation on all forms (zod schemas)
- ✅ Secure password handling with leaked password protection
- ✅ Protected API endpoints
- ✅ File upload restrictions
- ✅ Private offers restricted to admins only

## 🗄️ Database Schema

### Main Tables
- `profiles` - User profile information
- `wallet` - User balance tracking
- `user_roles` - Role-based access control (admin/user)
- `offers` - Available tasks/offers
- `tasks` - User task submissions
- `transactions` - Financial transaction history
- `payout_requests` - Withdrawal requests
- `badges` - Achievement badges
- `user_badges` - User badge progress
- `user_streaks` - Daily streak tracking
- `affiliate_links` - Referral tracking
- `chats` - AI chat sessions
- `chat_messages` - Chat history

## 📝 Migration to Your Own Supabase

**See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for complete step-by-step instructions.**

### Quick Overview:
1. ✅ Create new Supabase project
2. ✅ Run all database migrations from `supabase/migrations/`
3. ✅ Set up storage buckets (`task-proofs`)
4. ✅ Configure authentication (email, phone, OAuth)
5. ✅ Deploy edge functions (`refo-chat`, `cleanup-old-proofs`)
6. ✅ Create admin account and grant admin role
7. ✅ Deploy to production (Vercel/Netlify/custom)

### 🚨 Important: Prevent Auto-Pause

**Supabase free tier projects pause after 7 days of inactivity!**

**Solutions:**
- **Upgrade to Pro** ($25/month) - Never pauses
- **Set up monitoring** - Use [UptimeRobot](https://uptimerobot.com/) (free) to ping every 5 min
- **Manual access** - Visit your app weekly
- **Supabase CLI** - Keep project linked: `supabase link --project-ref YOUR_ID`

## 🔧 Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

⚠️ **Never commit `.env` to Git!** (already in `.gitignore`)

## 📊 Admin Setup

After deployment:

1. Sign up for an account through the app
2. In Supabase SQL Editor, run:
```sql
-- Grant admin role to your account
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'your-email@example.com';
```
3. Refresh the app and access `/admin`

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Deployment Options

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```
Add environment variables in Vercel dashboard.

### Option 2: Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```
Set build command: `npm run build`, publish directory: `dist`

### Option 3: Lovable Platform
Click **Publish** button in Lovable editor.

### Option 4: Manual/VPS
```bash
npm run build
# Upload `dist/` folder to your server
# Serve using nginx, Apache, or any static file server
```

## 🆘 Troubleshooting

### "Project paused after 7 days"
- **Fix**: Restore in Supabase dashboard → Settings → General → Restore
- **Prevent**: Upgrade to Pro or set up monitoring

### "Access denied to admin panel"
- Verify admin role exists in `user_roles` table
- Check `has_role()` function is working
- Clear browser cache and re-login

### "RLS policy violation"
- Ensure user is authenticated
- Check RLS policies allow the operation
- Verify `user_id` columns are set correctly

### "Edge function error"
- Check secrets: `supabase secrets list`
- View logs: `supabase functions logs refo-chat`
- Verify JWT verification is enabled

### "Storage upload failed"
- Check bucket exists and is public
- Verify RLS policies on `storage.objects`
- Check file size limits (5MB max)

## 🎨 Customization

### Styling
- **Colors**: Edit `src/index.css` (uses HSL color system)
- **Components**: Customize in `src/components/ui/`
- **Theme**: Modify design tokens in `tailwind.config.ts`

### Features
- **Add offers**: Admin panel → Offers → Create
- **Create badges**: Admin panel → Overview
- **Configure tasks**: Edit offer instructions

## 📚 Documentation

- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use for your own projects!

## 🎯 Roadmap

- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Automated payout processing (payment gateway integration)
- [ ] Social media integrations
- [ ] Gamification enhancements (levels, quests)
- [ ] Email notifications
- [ ] Two-factor authentication

## 💬 Support

Need help?
- 📖 Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- 🐛 Open an issue on GitHub
- 📚 Review [Supabase documentation](https://supabase.com/docs)
- 💬 Join [Supabase Discord](https://discord.supabase.com)

---

## 📌 Important Notes

### Security
- ✅ All critical security issues have been resolved
- ✅ Admin authentication is properly secured
- ✅ RLS policies protect all sensitive data
- ✅ Input validation prevents injection attacks
- ✅ Edge functions require JWT authentication

### Maintenance
- 🔄 Database backups: Supabase auto-backup (Pro plan)
- 📊 Monitor usage in Supabase dashboard
- 🔒 Keep dependencies updated
- 🧪 Test before deploying to production

### Performance
- ⚡ Edge functions for fast backend operations
- 🎨 Optimized frontend with React 18
- 📦 Code splitting for faster loads
- 🖼️ Image optimization with storage CDN

---

Built with ❤️ using React, TypeScript, and Supabase

**⭐ Star this repo if you find it useful!**

## 🔗 Quick Links

- [Migration Guide](./MIGRATION_GUIDE.md) - Complete setup instructions
- [Lovable Project](https://lovable.dev/projects/aa32f486-0560-424a-ac9e-1b228e8b0020) - Edit in Lovable
- [Supabase Setup](https://supabase.com) - Create your database
- [Deploy Guide](https://docs.lovable.dev/features/custom-domain) - Custom domains
