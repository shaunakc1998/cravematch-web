# Critical Issues Found - Immediate Action Required

## Issues Reported by User

### 1. **Heart and Cross Buttons Not Visible on Mobile** ❌
**Status:** NOT FIXED
**Problem:** Buttons are too small on mobile screens
**Current Sizes:**
- Cross: `w-20 h-20` (mobile) - TOO SMALL
- Heart: `w-24 h-24` (mobile) - TOO SMALL
**Required Sizes:**
- Cross: `w-28 h-28` (mobile) minimum
- Heart: `w-32 h-32` (mobile) minimum

### 2. **Swipe Logic Completely Broken** ❌
**Status:** CRITICAL
**Problem:** 30% random match logic causing false matches
**Current Code:**
```typescript
if (direction === "right") {
  if (Math.random() > 0.7) {  // 30% chance
    setMatchedRestaurant(restaurant);
    setSessionState("matched");
    return;
  }
}
```
**Issue:** This triggers matches randomly, not based on consensus
**Example:** User swipes right on Sakura Ramen, gets match. Then swipes right on Taco Fiesta, gets another match. This is wrong!

### 3. **Match Not Syncing to Other User** ❌
**Status:** CRITICAL
**Problem:** When host sees match, Mansi doesn't see it
**Root Cause:** Real-time subscription for matches not working
**Evidence:** "When it was a match it showed on my laptop and not on her phone"

### 4. **Multiple False Matches** ❌
**Status:** CRITICAL
**Problem:** Getting matches on every swipe or multiple matches in a row
**Root Cause:** 30% random logic + no consensus tracking

## What Needs to Happen

### Immediate Fix 1: Remove Random Match Logic
**Replace this:**
```typescript
if (direction === "right") {
  if (Math.random() > 0.7) {
    setMatchedRestaurant(restaurant);
    setSessionState("matched");
    return;
  }
}
```

**With this:**
```typescript
// Don't show match locally - wait for consensus from database
// Just move to next restaurant
```

### Immediate Fix 2: Implement Consensus Logic
**New approach:**
1. Both users swipe on same restaurant
2. Check if both swiped right
3. Only then show match
4. Sync match through real-time subscription

### Immediate Fix 3: Increase Button Sizes
**Mobile sizes:**
- Cross button: `w-28 h-28` (was `w-20 h-20`)
- Heart button: `w-32 h-32` (was `w-24 h-24`)
- Text: `text-6xl` (was `text-5xl`)

### Immediate Fix 4: Fix Match Sync
**Add polling for matches:**
```typescript
// Poll matches every 2 seconds
// When new match appears, show celebration screen
```

## Why This Happened

The 30% random logic was added as a "temporary" placeholder for testing, but it's breaking the core functionality. The app needs:

1. **Proper consensus tracking** - Track swipes from all participants
2. **Match detection** - When all participants swipe right on same restaurant
3. **Real-time sync** - Broadcast matches to all users
4. **No random logic** - Matches should be deterministic based on user actions

## Testing Evidence of Broken Logic

**User's Report:**
- Clicked heart on Sakura Ramen → Got match ✓
- Mansi also pressed heart somehow → Got match ✓
- User stopped swiping after Sakura
- Mansi pressed heart on Taco Fiesta → Got another match ✗

**This proves:**
- Matches are random (30% chance)
- Not based on consensus
- Not syncing between users
- Logic is completely broken

## Action Items

1. **REMOVE** the 30% random match logic
2. **IMPLEMENT** consensus tracking
3. **INCREASE** button sizes for mobile
4. **ADD** match polling for sync
5. **TEST** with both users simultaneously

## Files to Modify

1. `app/components/GroupLobby.tsx`
   - Remove random match logic from `handleSwipe()`
   - Increase button sizes
   - Add match polling

2. `app/lib/roomService.ts`
   - Add function to get swipes for restaurant
   - Add function to check consensus
   - Add function to create match

## Current State

❌ Buttons too small
❌ Random match logic active
❌ No consensus tracking
❌ Matches not syncing
❌ Logic completely broken

**This needs to be fixed before the app can be tested properly.**
