# CraveMatch - Troubleshooting Guide

## Join Session Not Working - Debugging Steps

### What We Fixed
1. **Immediate participant fetch after join** - Now fetches existing participants when joining
2. **Better error logging** - Added console logs to track the join flow
3. **Changed `.single()` to `.maybeSingle()`** - Prevents errors when checking if user already exists

### How to Debug

#### Step 1: Open Browser DevTools
- Press `F12` or right-click → Inspect
- Go to **Console** tab
- Keep it open while testing

#### Step 2: Host a Session
- Click "Host a Session"
- Watch console for logs
- You should see the room code displayed

#### Step 3: Join Session (Different Browser/Incognito)
- Enter the room code
- Click "Join Session"
- **Watch console for these logs:**

```
Found room: {id: "...", code: "XXXX", host_id: "...", status: "waiting", ...}
Successfully joined room
Participants updated: [...]
```

#### Step 4: Check Participants List
- Both users should see each other in the participants list
- If not, check console for errors

### Common Issues & Solutions

#### Issue 1: "Room not found or session already started"
**Possible Causes:**
1. Room code is wrong
2. Room status changed to "active" (session already started)
3. Room doesn't exist in database

**Solution:**
- Check the room code is exactly 4 characters
- Make sure host hasn't clicked "Start Swiping" yet
- Check Supabase console to verify room exists

#### Issue 2: Participant doesn't appear on host's screen
**Possible Causes:**
1. Real-time subscription not working
2. Participant insert failed silently
3. RLS (Row Level Security) policies blocking access

**Solution:**
- Check console for "Participants updated:" log
- If not appearing, check Supabase RLS policies
- Verify room_participants table has correct data

#### Issue 3: Join button disabled or not responding
**Possible Causes:**
1. Room code input not filled (needs exactly 4 characters)
2. Network error
3. Supabase connection issue

**Solution:**
- Make sure room code is exactly 4 characters
- Check browser console for network errors
- Verify Supabase is accessible

### Console Logs to Watch For

**Successful Join Flow:**
```
Found room: {...}
Successfully joined room
Participants updated: [{id: "...", name: "User1", isReady: true}, {id: "...", name: "User2", isReady: true}]
```

**Failed Join Flow:**
```
Room lookup error: {code: "PGRST116", message: "..."}
// OR
Join error: {code: "23505", message: "duplicate key value..."}
// OR
Join room exception: Error: ...
```

### Supabase Verification Checklist

- [ ] `rooms` table exists and has data
- [ ] `room_participants` table exists and has data
- [ ] RLS policies allow INSERT on room_participants
- [ ] RLS policies allow SELECT on rooms
- [ ] Real-time subscriptions are enabled
- [ ] Database connection is working

### Testing Checklist

- [ ] Host can create a session
- [ ] Room code displays correctly
- [ ] Join code input accepts 4 characters
- [ ] Join button works when code is entered
- [ ] Participant appears on host's screen after join
- [ ] Host sees participant count increase
- [ ] Both users see each other in participants list
- [ ] Real-time updates work (new participant appears instantly)

### If Still Not Working

1. **Check Supabase Logs:**
   - Go to Supabase dashboard
   - Check database logs for errors
   - Look for permission/RLS issues

2. **Check Network Tab:**
   - Open DevTools → Network tab
   - Try to join
   - Look for failed requests
   - Check response status and error messages

3. **Verify Database Schema:**
   - Check `rooms` table structure
   - Check `room_participants` table structure
   - Verify all required columns exist
   - Check data types match

4. **Test with Direct SQL:**
   - In Supabase SQL editor
   - Try inserting a participant manually
   - Verify it works without errors

### Key Files to Check

1. **app/lib/roomService.ts** - Join logic and error handling
2. **app/components/GroupLobby.tsx** - UI and state management
3. **Supabase RLS Policies** - Permission settings
4. **Supabase Real-time Settings** - Subscription configuration

### Next Steps

If join is working but participants not syncing:
1. Check real-time subscription logs
2. Verify RLS policies for room_participants table
3. Check if INSERT trigger is firing
4. Verify subscription filter is correct

If swiping not working after session starts:
1. Check if room status updated to "active"
2. Verify all participants received the update
3. Check if swiping state rendered correctly
4. Verify handleSwipe function is being called
