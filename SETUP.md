# CraveMatch - Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Name it "cravematch" (or anything you like)
4. Set a strong database password (save it!)
5. Choose a region close to you
6. Click "Create new project" and wait ~2 minutes

### Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (the long string)

### Step 3: Set Up Environment Variables

**For Local Development:**

Create a file called `.env.local` in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**For Vercel Deployment:**

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add both variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click "Save"

### Step 4: Set Up the Database

1. In Supabase, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

### Step 5: Enable Authentication

1. In Supabase, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. (Optional) Disable "Confirm email" for easier testing:
   - Go to **Authentication** → **Settings**
   - Turn off "Enable email confirmations"

### Step 6: Enable Realtime

1. In Supabase, go to **Database** → **Replication**
2. Make sure these tables have realtime enabled:
   - `rooms`
   - `room_participants`
   - `swipes`
   - `matches`

(The SQL schema should have done this automatically)

### Step 7: Deploy to Vercel

```bash
# Push your changes
git add .
git commit -m "Add Supabase integration"
git push

# Vercel will auto-deploy if connected
```

Or manually deploy:
```bash
npx vercel --prod
```

---

## 🎮 How to Use

### Solo Mode
1. Sign up / Sign in
2. Swipe right on restaurants you like
3. View your matches in the Matches tab

### Group Mode (with friends!)
1. **Host**: Go to Group tab → "Host a Session"
2. **Host**: Share the 4-letter room code with friends
3. **Friends**: Go to Group tab → Enter the code → "Join"
4. **Host**: Once everyone joins, click "Start Swiping"
5. **Everyone**: Swipe on restaurants
6. **Match**: When EVERYONE swipes right on the same restaurant, it's a match!

---

## 🔧 Troubleshooting

### "Invalid API key" error
- Double-check your environment variables
- Make sure there are no extra spaces
- Restart your dev server after changing `.env.local`

### "Permission denied" errors
- Make sure you ran the SQL schema
- Check that RLS policies are created

### Realtime not working
- Check that tables are added to replication
- Make sure you're subscribed to the correct room ID

### Auth not working
- Check that Email provider is enabled in Supabase
- For testing, disable email confirmation

---

## 📱 Testing with Friends

1. Deploy to Vercel
2. Share the URL with friends
3. Everyone creates an account
4. One person hosts a session
5. Others join with the room code
6. Start swiping together!

---

## 🎉 You're Done!

Your CraveMatch app is now live with:
- ✅ Real user authentication
- ✅ Real-time multiplayer rooms
- ✅ Persistent data
- ✅ Works on any device

Share the Vercel URL with your friends and start matching on restaurants!
