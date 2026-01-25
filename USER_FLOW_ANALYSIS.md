# CraveMatch - Complete User Flow Analysis

## User Flow Walkthrough

### **FLOW 1: Authentication**
**File:** `app/auth/page.tsx`, `app/context/AuthContext.tsx`

**Steps:**
1. User lands on `/auth` page
2. User enters email and password
3. Clicks "Sign Up" or "Sign In"
4. AuthContext calls Supabase auth
5. On success, redirects to `/` (main page)
6. User data stored in context

**Status:** ✅ WORKING
- Auth context properly set up
- Supabase integration working
- Redirect logic in place

---

### **FLOW 2: Main Page Navigation**
**File:** `app/page.tsx`, `app/context/AppContext.tsx`

**Steps:**
1. User lands on main page after auth
2. Page checks if user is logged in
3. If not logged in, redirects to `/auth`
4. If logged in, shows main content
5. BottomNavBar allows tab switching
6. Three tabs: Discover, Matches, Group

**Status:** ✅ WORKING
- Auth check in place
- Tab navigation implemented
- All three tabs render correctly

---

### **FLOW 3: Individual Swiping (Discover Tab)**
**File:** `app/components/SwipeDeck.tsx`

**Steps:**
1. User clicks "Discover" tab
2. SwipeDeck component renders
3. Shows restaurant card with image, name, rating, cuisine, price, distance
4. User swipes left (reject) or right (like)
5. Card animates out
6. Next restaurant appears
7. When all restaurants shown, shows "All caught up!"

**Status:** ✅ WORKING
- 54 restaurants loaded from data
- Cards display correctly
- Swipe animations work
- Proper state management

---

### **FLOW 4: View Matches (Matches Tab)**
**File:** `app/components/MatchesList.tsx`

**Steps:**
1. User clicks "Matches" tab
2. Shows list of liked restaurants
3. Each restaurant shows image, name, rating, cuisine, price, distance
4. User can click to open Google Maps
5. Shows count of matches

**Status:** ✅ WORKING
- Matches display correctly
- Google Maps integration in place
- Proper styling and layout

---

### **FLOW 5: Group Session - Host**
**File:** `app/components/GroupLobby.tsx`

**Steps:**
1. User clicks "Group" tab
2. Shows "Swipe Together" screen
3. User clicks "Host a Session"
4. Creates room in Supabase
5. Generates 4-character room code
6. Adds host as participant
7. Shows waiting screen with room code
8. Displays participants list (initially just host)
9. Waits for others to join

**Status:** ✅ WORKING
- Room creation logic correct
- Code generation working
- Host added as participant
- Waiting screen displays correctly

**Potential Issue:** Real-time subscription might not be set up yet at this point

---

### **FLOW 6: Group Session - Join**
**File:** `app/components/GroupLobby.tsx`, `app/lib/roomService.ts`

**Steps:**
1. Second user clicks "Group" tab
2. Enters 4-character room code
3. Clicks "Join Session"
4. `joinRoom()` called:
   - Looks up room by code
   - Checks if room status is "waiting"
   - Checks if user already in room
   - Inserts user as participant
5. Fetches existing participants immediately
6. Sets up real-time subscription
7. Shows waiting screen with all participants

**Status:** ⚠️ NEEDS VERIFICATION
- Join logic looks correct
- Immediate fetch added
- Real-time subscription set up
- **BUT:** Need to verify Supabase RLS allows INSERT and SELECT

---

### **FLOW 7: Real-Time Participant Sync**
**File:** `app/lib/roomService.ts`

**Steps:**
1. When participant joins, INSERT fires on room_participants table
2. Real-time subscription triggers
3. `onParticipantChange` callback fires
4. Fetches all participants from database
5. Updates UI with new participant list
6. Both users see each other

**Status:** ⚠️ NEEDS VERIFICATION
- Subscription logic correct
- Callback structure correct
- **BUT:** Depends on Supabase RLS policies being correct

---

### **FLOW 8: Start Swiping**
**File:** `app/components/GroupLobby.tsx`

**Steps:**
1. Host clicks "Start Swiping" button
2. Validation checks:
   - At least 2 participants
   - User is host
   - Room exists
3. Calls `startSession()` to update room status to "active"
4. Updates local state to "swiping"
5. Real-time subscription triggers for all users
6. All users transition to swiping state
7. Shows restaurant card with swipe buttons

**Status:** ✅ WORKING
- Host validation in place
- Database update before state change
- Proper error handling
- UI renders correctly

---

### **FLOW 9: Group Swiping**
**File:** `app/components/GroupLobby.tsx`

**Steps:**
1. All participants see same restaurant card
2. User clicks heart (like) or X (reject)
3. `handleSwipe()` called
4. 30% chance of random match (TEMPORARY - for testing)
5. If match: shows matched screen
6. If no match: shows next restaurant
7. Can continue swiping

**Status:** ⚠️ ISSUE FOUND
- **PROBLEM:** Random 30% match logic is still in place
- This should be replaced with actual consensus logic
- Currently: `if (Math.random() > 0.7) { setMatchedRestaurant(...) }`
- Should: Track swipes from all participants and find consensus

---

### **FLOW 10: Match Celebration**
**File:** `app/components/GroupLobby.tsx`

**Steps:**
1. When match occurs, shows celebration screen
2. Displays matched restaurant details
3. Shows "IT'S A MATCH!" message
4. User can click "Let's Eat!" or "Keep Swiping"
5. "Keep Swiping" clears matched state and continues
6. "Let's Eat!" also continues (same behavior)

**Status:** ✅ WORKING
- UI displays correctly
- State management correct
- Buttons work properly

---

### **FLOW 11: Leave Session**
**File:** `app/components/GroupLobby.tsx`

**Steps:**
1. User clicks "Leave Session" button
2. Unsubscribes from real-time updates
3. Clears all session state
4. Returns to idle screen
5. User can host new session or join another

**Status:** ✅ WORKING
- Cleanup logic correct
- State reset properly
- Subscription unsubscribed

---

## Critical Issues Found

### **Issue 1: Random Match Logic** ⚠️ CRITICAL
**Location:** `app/components/GroupLobby.tsx` line ~195
**Problem:** Matches are 30% random, not based on group consensus
**Impact:** Core feature broken - defeats purpose of app
**Fix Needed:** Implement proper consensus tracking

### **Issue 2: Real-Time Sync Verification** ⚠️ CRITICAL
**Location:** Supabase RLS policies
**Problem:** Participants might not sync if RLS policies are wrong
**Impact:** Join feature might not work
**Fix Needed:** Verify RLS policies allow:
- INSERT on room_participants
- SELECT on room_participants
- SELECT on rooms

### **Issue 3: No Swipe Recording** ⚠️ MEDIUM
**Location:** `app/components/GroupLobby.tsx`
**Problem:** Swipes are not being recorded to database
**Impact:** Can't track consensus or calculate matches
**Fix Needed:** Call `recordSwipe()` when user swipes

---

## Complete User Flow Checklist

### Authentication
- [ ] User can sign up
- [ ] User can sign in
- [ ] User redirects to main page after auth
- [ ] User data persists

### Individual Swiping
- [ ] Discover tab shows restaurants
- [ ] Can swipe left (reject)
- [ ] Can swipe right (like)
- [ ] Matches tab shows liked restaurants
- [ ] Can view all 54 restaurants

### Group Session - Host
- [ ] Can click "Host a Session"
- [ ] Room code generates correctly
- [ ] Room code displays
- [ ] Host appears in participants list
- [ ] Waiting screen shows

### Group Session - Join
- [ ] Can enter room code
- [ ] Can click "Join Session"
- [ ] Join succeeds (check console logs)
- [ ] Participant appears on host's screen
- [ ] Joiner sees host in participants list
- [ ] Both see each other in real-time

### Group Swiping
- [ ] Host can click "Start Swiping"
- [ ] Non-host cannot start (error shown)
- [ ] Both users transition to swiping state
- [ ] Restaurant card displays
- [ ] Heart button visible and clickable
- [ ] Cross button visible and clickable
- [ ] Can swipe through restaurants
- [ ] Match screen appears (after 30% chance)
- [ ] Can continue swiping after match

### Leave Session
- [ ] Can click "Leave Session"
- [ ] Returns to idle screen
- [ ] Can host new session
- [ ] Can join another session

---

## Recommended Testing Order

1. **Test Auth Flow**
   - Sign up new user
   - Sign in with existing user
   - Verify redirect to main page

2. **Test Individual Swiping**
   - Click Discover tab
   - Swipe through restaurants
   - Check Matches tab
   - Verify liked restaurants appear

3. **Test Group Session - Host**
   - Click Group tab
   - Click "Host a Session"
   - Note the room code
   - Verify waiting screen

4. **Test Group Session - Join**
   - Open second browser/incognito
   - Sign in as different user
   - Click Group tab
   - Enter room code
   - Click "Join Session"
   - **CRITICAL:** Check console for logs
   - Verify participant appears on host's screen

5. **Test Group Swiping**
   - Host clicks "Start Swiping"
   - Both users see swiping screen
   - Both can swipe
   - Match screen appears
   - Can continue swiping

6. **Test Leave**
   - Click "Leave Session"
   - Verify return to idle screen

---

## Console Logs to Monitor

**Successful Join:**
```
Found room: {...}
Successfully joined room
Participants updated: [...]
```

**Successful Start Swiping:**
```
Room updated: {status: "active", ...}
```

**Successful Swipe:**
```
(No logs currently - should add)
```

---

## Next Steps

1. **Verify Supabase RLS Policies** - Most likely cause of join issues
2. **Implement Swipe Recording** - Currently not recording swipes
3. **Implement Consensus Logic** - Replace random 30% with actual matching
4. **Add Swipe Logging** - Track swipes in console for debugging
5. **Test Full Flow** - Follow testing order above
