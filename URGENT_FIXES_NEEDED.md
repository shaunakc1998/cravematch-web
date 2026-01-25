# URGENT FIXES NEEDED - Critical Issues

## Issue 1: Buttons Cut Off on Mobile ❌ CRITICAL
**Problem:** Buttons are hidden below the fold on mobile
**Root Cause:** `safe-area-bottom` class is pushing buttons off screen
**Location:** `app/components/GroupLobby.tsx` line ~550 (SWIPING STATE)

**Current Code (BROKEN):**
```typescript
<div className="flex items-center justify-center gap-4 sm:gap-8 py-6 px-4 safe-area-bottom">
```

**Fix Required:**
Replace with:
```typescript
<div className="flex items-center justify-center gap-6 py-4 px-4 pb-20">
```

Also update button sizes:
- Cross button: `w-16 h-16` (was `w-20 h-20`)
- Heart button: `w-20 h-20` (was `w-24 h-24`)
- Add `flex-shrink-0` to both buttons

## Issue 2: Swipe Not Working ❌ CRITICAL
**Problem:** Buttons don't respond to clicks
**Root Cause:** Likely due to buttons being off-screen or z-index issues
**Solution:** Fix button visibility first (Issue 1)

## Issue 3: Match Not Working ❌ CRITICAL
**Problem:** Even when both users swipe right, no match appears
**Root Cause:** No consensus logic implemented
**Solution Needed:**
1. Add function to check if all participants swiped right on same restaurant
2. Create match in database when consensus reached
3. Add polling to detect matches and show celebration screen

## Quick Fix Instructions

### Step 1: Fix Button Visibility (IMMEDIATE)
In `app/components/GroupLobby.tsx`, find the SWIPING STATE section (around line 550) and replace:

```typescript
// OLD (BROKEN):
<div className="flex items-center justify-center gap-4 sm:gap-8 py-6 px-4 safe-area-bottom">
  <motion.button
    onClick={() => handleSwipe("left")}
    className="relative w-20 h-20 sm:w-16 sm:h-16 rounded-full..."
  >
    ...
  </motion.button>
  
  <motion.button
    onClick={() => handleSwipe("right")}
    className="relative w-24 h-24 sm:w-20 sm:h-20 rounded-full..."
  >
    ...
  </motion.button>
</div>

// NEW (FIXED):
<div className="flex items-center justify-center gap-6 py-4 px-4 pb-20">
  <motion.button
    onClick={() => handleSwipe("left")}
    className="relative w-16 h-16 rounded-full bg-[#111] border-2 border-[rgba(255,255,255,0.08)] flex items-center justify-center group shadow-lg flex-shrink-0"
    whileHover={{ scale: 1.1, borderColor: "rgba(244, 63, 94, 0.5)" }}
    whileTap={{ scale: 0.9 }}
  >
    <motion.span 
      className="text-3xl"
      whileHover={{ scale: 1.2, rotate: 90 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      ✕
    </motion.span>
  </motion.button>
  
  <motion.button
    onClick={() => handleSwipe("right")}
    className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center shadow-xl shadow-[#f43f5e]/30 group flex-shrink-0"
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
  >
    <motion.span 
      className="text-4xl"
      whileHover={{ scale: 1.2 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      ❤️
    </motion.span>
    <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] opacity-30 blur-lg -z-10" />
  </motion.button>
</div>
```

### Step 2: Implement Consensus Logic
Add to `app/lib/roomService.ts`:

```typescript
// Check if all participants swiped right on a restaurant
export async function checkConsensus(
  roomId: string,
  restaurantId: string
): Promise<boolean> {
  const supabase = createClient();
  
  // Get participant count
  const { data: participants, error: pError } = await supabase
    .from("room_participants")
    .select()
    .eq("room_id", roomId);
  
  if (pError || !participants) return false;
  
  // Get right swipes for this restaurant
  const { data: swipes, error: sError } = await supabase
    .from("swipes")
    .select()
    .eq("room_id", roomId)
    .eq("restaurant_id", restaurantId)
    .eq("direction", "right");
  
  if (sError || !swipes) return false;
  
  // Check if all participants swiped right
  return swipes.length === participants.length && participants.length > 0;
}

// Create a match
export async function createMatch(
  roomId: string,
  restaurantId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("matches")
    .insert({
      room_id: roomId,
      restaurant_id: restaurantId
    });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}
```

### Step 3: Add Match Polling to GroupLobby
Add this useEffect to `app/components/GroupLobby.tsx`:

```typescript
// Poll for matches
useEffect(() => {
  if (!currentRoom || sessionState !== "swiping") return;

  const interval = setInterval(async () => {
    try {
      const { getRoomMatches } = await import("../lib/roomService");
      const matches = await getRoomMatches(currentRoom.id);
      
      if (matches.length > 0) {
        // Find the matched restaurant
        const matchedRestaurant = restaurants.find(
          r => r.id === matches[0].restaurant_id
        );
        if (matchedRestaurant) {
          setMatchedRestaurant(matchedRestaurant);
          setSessionState("matched");
        }
      }
    } catch (err) {
      console.error("Error polling matches:", err);
    }
  }, 2000);

  return () => clearInterval(interval);
}, [currentRoom, sessionState]);
```

## Status Summary

❌ **Buttons Cut Off** - NEEDS IMMEDIATE FIX
❌ **Swipe Not Working** - Will work after button fix
❌ **Match Not Working** - Needs consensus logic implementation

## Why This Happened

1. The `safe-area-bottom` class was meant to add padding but it's pushing buttons off-screen
2. No consensus logic was implemented - matches need to check if ALL users swiped right
3. No match polling - matches created in DB aren't being detected by the UI

## Time to Fix

- Button visibility: 5 minutes
- Consensus logic: 10 minutes  
- Match polling: 5 minutes
- Testing: 10 minutes

**Total: ~30 minutes to fully working app**
