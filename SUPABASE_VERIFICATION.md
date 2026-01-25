# Supabase Database Verification

## Your Database Schema ✅

### Tables Present:
1. ✅ **rooms** - Room management
   - id (uuid, primary key)
   - code (varchar) - 4-character room code
   - host_id (uuid) - Foreign key to auth.users
   - status (varchar) - "waiting" or "active"
   - current_restaurant_index (int4)
   - created_at (timestamptz)
   - updated_at (timestamptz)

2. ✅ **room_participants** - Participant tracking
   - id (uuid, primary key)
   - room_id (uuid) - Foreign key to rooms
   - user_id (uuid) - Foreign key to auth.users
   - name (varchar)
   - is_ready (bool)
   - joined_at (timestamptz)

3. ✅ **swipes** - Swipe tracking
   - id (uuid, primary key)
   - room_id (uuid) - Foreign key to rooms
   - user_id (uuid) - Foreign key to auth.users
   - restaurant_id (varchar)
   - direction (varchar) - "left" or "right"
   - created_at (timestamptz)

4. ✅ **matches** - Match results
   - id (uuid, primary key)
   - room_id (uuid) - Foreign key to rooms
   - restaurant_id (varchar)
   - created_at (timestamptz)

---

## Schema Matches Code ✅

### roomService.ts Interfaces Match:
```typescript
// Room interface matches rooms table
interface Room {
  id: string;              // ✅ uuid
  code: string;            // ✅ varchar
  host_id: string;         // ✅ uuid
  status: "waiting" | "active";  // ✅ varchar
  current_restaurant_index: number;  // ✅ int4
  created_at: string;      // ✅ timestamptz
}

// Participant interface matches room_participants table
interface Participant {
  id: string;              // ✅ uuid
  room_id: string;         // ✅ uuid
  user_id: string;         // ✅ uuid
  name: string;            // ✅ varchar
  is_ready: boolean;       // ✅ bool
  joined_at: string;       // ✅ timestamptz
}

// Swipe interface matches swipes table
interface Swipe {
  id: string;              // ✅ uuid
  room_id: string;         // ✅ uuid
  user_id: string;         // ✅ uuid
  restaurant_id: string;   // ✅ varchar
  direction: "left" | "right";  // ✅ varchar
  created_at: string;      // ✅ timestamptz
}

// Match interface matches matches table
interface Match {
  id: string;              // ✅ uuid
  room_id: string;         // ✅ uuid
  restaurant_id: string;   // ✅ varchar
  created_at: string;      // ✅ timestamptz
}
```

---

## RLS Policies Checklist

### What Needs To Be Verified:

#### **rooms table**
- [ ] SELECT policy - Users can read rooms
- [ ] INSERT policy - Users can create rooms
- [ ] UPDATE policy - Host can update room status
- [ ] DELETE policy - Host can delete rooms

#### **room_participants table**
- [ ] SELECT policy - Users can read participants in their room
- [ ] INSERT policy - Users can join rooms
- [ ] DELETE policy - Users can leave rooms

#### **swipes table**
- [ ] SELECT policy - Users can read swipes in their room
- [ ] INSERT policy - Users can record swipes
- [ ] Unique constraint - One swipe per user per restaurant per room

#### **matches table**
- [ ] SELECT policy - Users can read matches
- [ ] INSERT policy - System can create matches

---

## Real-Time Subscriptions Checklist

### What Needs To Be Enabled:

- [ ] Real-time enabled for `room_participants` table
  - Used for: Participant list updates
  - Events: INSERT, UPDATE, DELETE

- [ ] Real-time enabled for `rooms` table
  - Used for: Room status changes (waiting → active)
  - Events: UPDATE

- [ ] Real-time enabled for `matches` table
  - Used for: Match notifications
  - Events: INSERT

---

## How To Verify RLS Policies

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project
2. Go to **Authentication** → **Policies**

### Step 2: Check Each Table
For each table (rooms, room_participants, swipes, matches):
1. Click on the table name
2. Look for policies listed
3. Verify they allow:
   - SELECT (read)
   - INSERT (create)
   - UPDATE (modify)
   - DELETE (remove)

### Step 3: Check Real-Time
1. Go to **Database** → **Tables**
2. For each table, click the three dots menu
3. Look for "Enable Realtime" option
4. Verify it's enabled for:
   - room_participants
   - rooms
   - matches

---

## How To Enable Real-Time

If real-time is not enabled:

1. Go to **Database** → **Tables**
2. Click on table name (e.g., room_participants)
3. Click the three dots menu (⋮)
4. Select "Enable Realtime"
5. Confirm

---

## Testing RLS Policies

### Test 1: Can Create Room
```sql
-- Should succeed if INSERT policy exists
INSERT INTO rooms (code, host_id, status)
VALUES ('TEST', 'your-user-id', 'waiting');
```

### Test 2: Can Join Room
```sql
-- Should succeed if INSERT policy exists
INSERT INTO room_participants (room_id, user_id, name, is_ready)
VALUES ('room-id', 'your-user-id', 'Your Name', true);
```

### Test 3: Can Record Swipe
```sql
-- Should succeed if INSERT policy exists
INSERT INTO swipes (room_id, user_id, restaurant_id, direction)
VALUES ('room-id', 'your-user-id', '1', 'right');
```

### Test 4: Can Read Participants
```sql
-- Should succeed if SELECT policy exists
SELECT * FROM room_participants WHERE room_id = 'room-id';
```

---

## Common RLS Policy Template

### For room_participants table:
```sql
-- Allow users to read participants in rooms they're in
CREATE POLICY "Users can read participants in their room"
ON room_participants
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM room_participants WHERE room_id = room_id
  )
);

-- Allow users to insert themselves as participants
CREATE POLICY "Users can join rooms"
ON room_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete themselves
CREATE POLICY "Users can leave rooms"
ON room_participants
FOR DELETE
USING (auth.uid() = user_id);
```

---

## Debugging Steps

If join/sync not working:

1. **Check Console Logs**
   - Open DevTools (F12)
   - Look for error messages
   - Check for "Found room", "Successfully joined room"

2. **Check Supabase Logs**
   - Go to Supabase dashboard
   - Check **Logs** section
   - Look for permission denied errors

3. **Check Database**
   - Go to **SQL Editor**
   - Run: `SELECT * FROM room_participants;`
   - Verify data is being inserted

4. **Check Real-Time**
   - Go to **Logs** → **Realtime**
   - Verify subscriptions are active
   - Look for broadcast events

---

## Summary

✅ **Database Schema** - Correct and matches code
⚠️ **RLS Policies** - Need to verify
⚠️ **Real-Time** - Need to verify enabled

**Next Action:** Check your Supabase dashboard to verify RLS policies and real-time subscriptions are properly configured.
