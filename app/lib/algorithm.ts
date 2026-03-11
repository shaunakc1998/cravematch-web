import { Restaurant } from "../data/restaurants";

export interface SwipeData {
  userId: string;
  restaurantId: string;
  liked: boolean;
}

export interface MatchResult {
  restaurant: Restaurant;
  score: number; // 0-1, percentage of group that liked it
  likedBy: string[]; // user IDs
  matchType: "unanimous" | "majority" | "ai_suggested";
  reason?: string; // AI explanation
}

export function calculateMatches(
  swipes: SwipeData[],
  restaurants: Restaurant[],
  userIds: string[]
): MatchResult[] {
  if (userIds.length === 0 || restaurants.length === 0) return [];

  // Build a map: restaurantId -> list of userIds who liked it
  const likeMap: Record<string, string[]> = {};

  for (const swipe of swipes) {
    if (!swipe.liked) continue;
    if (!likeMap[swipe.restaurantId]) {
      likeMap[swipe.restaurantId] = [];
    }
    // Avoid duplicate user entries
    if (!likeMap[swipe.restaurantId].includes(swipe.userId)) {
      likeMap[swipe.restaurantId].push(swipe.userId);
    }
  }

  const totalUsers = userIds.length;

  // Build scored results for all restaurants that at least one person liked
  const results: MatchResult[] = restaurants
    .filter((r) => likeMap[r.id] && likeMap[r.id].length > 0)
    .map((r) => {
      const likedBy = likeMap[r.id] || [];
      const score = likedBy.length / totalUsers;
      let matchType: MatchResult["matchType"];
      if (score === 1) {
        matchType = "unanimous";
      } else if (score >= 0.5) {
        matchType = "majority";
      } else {
        matchType = "ai_suggested";
      }
      return { restaurant: r, score, likedBy, matchType };
    });

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // If we have majority matches, return those; otherwise return top 3 anyway
  const majorityResults = results.filter((r) => r.score >= 0.5);
  if (majorityResults.length > 0) {
    return majorityResults;
  }

  // Fallback: return top 3 with ai_suggested type
  return results.slice(0, 3).map((r) => ({ ...r, matchType: "ai_suggested" as const }));
}
