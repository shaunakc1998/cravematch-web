# Real-Time Sync Debugging Guide

## The Problem

**Host can't see Mansi when she joins the room.**

This happens because:
1. Mansi joins and her data is inserted into `room_participants` table
2. Real-time subscription SHOULD trigger on the host's browser
3. But it's NOT triggering (likely due to RLS policies)
4. Polling fallback fetches every 2 seconds as backup

## Why Real-Time Might Not Be Working

### Possible Causes (in order of likelihood):

1. **RLS Policies Not Configured** (MOST LIKELY)
   - Supabase requires explicit RLS policies to allow real-time
   - Without policies, subscriptions silently fail
   - No error is shown - it just doesn't work

2. **Real-Time Not Enabled on Table**
   - Table must have real-time enabled
   - Go to Database → Tables → room_participants
   - Check if "Realtime" is enabled

3. **Wrong Filter in Subscription**
   - Filter: `room_id=eq.${roomId}` might not match
   - Need to verify the filter syntax is correct

4. **User Doesn't Have Permission**
   - RLS policy might not allow the user to read the table
   - Even if data is inserted, user can't see it

## How to Verify & Fix

### Step 1: Check RLS Policies

**Go to Supabase Dashboard:**
1. Click on your project
2. Go to **Authentication** → **Policies**
3. Look for `room_participants` table

**What you should see:**
- At least one policy for SELECT
- At least one policy for INSERT

**If you don't see policies:**
- This is the problem!
- You need to create RLS policies

### Step 2: Create RLS Policies

**For room_participants table, create these policies:**

#### Policy 1: Allow users to read participants in their room
```sql
CREATE POLICY "Users can read participants in their room"
ON room_participants
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM room_participants WHERE room_id = room_id
  )
);
```

#### Policy 2: Allow users to insert themselves
```sql
CREATE POLICY "Users can join rooms"
ON room_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### Policy 3: Allow users to delete themselves
```sql
CREATE POLICY "Users can leave rooms"
ON room_participants
FOR DELETE
USING (auth.uid() = user_id);
```

### Step 3: Enable Real-Time

**Go to Supabase Dashboard:**
1. Go to **Database** → **Tables**
2. Click on `room_participants` table
3. Click the three dots menu (⋮)
4. Select **Enable Realtime**
5. Confirm

**Repeat for:**
- `rooms` table (for status updates)
- `matches` table (for match notifications)

### Step 4: Test

**After making changes:**
1. Refresh your browser
2. Host creates a new session
3. Mansi joins
4. **Host should see Mansi within 2 seconds** (from polling)
5. Check console for logs

## Console Logs to Watch

**If real-time is working:**
```
Setting up subscription for room: {room-id}
Participants updated from subscription: [...]
```

**If real-time fails, polling kicks in:**
```
Participants updated from polling: [...]
```

**If neither works:**
```
Error polling participants: {error message}
```

## Testing Without RLS Policies

If you want to test WITHOUT setting up RLS policies:

1. **Disable RLS temporarily** (NOT recommended for production):
   - Go to Database → Tables → room_participants
   - Click the three dots menu
   - Select "Disable RLS"
   - Test if real-time works

2. **If it works without RLS:**
   - Real-time is working, RLS policies are the issue
   - Set up proper RLS policies

3. **If it still doesn't work:**
   - Real-time might not be enabled on the table
   - Check Step 2 above

## Why Polling Works But Real-Time Doesn't

**Polling (every 2 seconds):**
- Uses regular SELECT query
- Doesn't need real-time enabled
- Doesn't need special RLS policies
- Works but is slower and uses more bandwidth

**Real-Time:**
- Uses WebSocket connection
- Needs real-time enabled on table
- Needs RLS policies to allow access
- Instant updates, efficient

## The Fix Summary

To make real-time work:

1. ✅ Enable real-time on `room_participants` table
2. ✅ Create RLS policies for SELECT/INSERT/DELETE
3. ✅ Refresh browser
4. ✅ Test again

**Expected result:**
- Host sees Mansi instantly when she joins
- No 2-second delay
- Console shows "Participants updated from subscription"

## If You're Still Having Issues

**Check these in order:**

1. **Verify RLS is enabled:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'room_participants';
   ```
   Should return at least 3 policies

2. **Verify real-time is enabled:**
   - Go to Database → Tables → room_participants
   - Look for "Realtime" toggle

3. **Check Supabase logs:**
   - Go to Logs section
   - Look for permission denied errors
   - Look for subscription errors

4. **Test with SQL:**
   ```sql
   INSERT INTO room_participants (room_id, user_id, name, is_ready)
   VALUES ('test-room-id', 'test-user-id', 'Test User', true);
   ```
   - If this fails, RLS is blocking it

## Current Workaround

**The polling fallback (every 2 seconds) will work:**
- Host will see Mansi within 2 seconds
- Not ideal but functional
- Better than nothing while you set up RLS

**To make it instant:**
- Follow the steps above to enable real-time
- Real-time subscription will trigger immediately
- Polling will still run as backup

## Next Action

1. Go to your Supabase dashboard
2. Check if RLS policies exist for `room_participants`
3. If not, create them using the SQL above
4. Enable real-time on the table
5. Refresh browser and test again

**The host should then see Mansi instantly when she joins!**
