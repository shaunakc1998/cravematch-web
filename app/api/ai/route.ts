import Anthropic from "@anthropic-ai/sdk";
import { Restaurant } from "../../data/restaurants";
import { SwipeData } from "../../lib/algorithm";

interface Member {
  id: string;
  name: string;
}

interface AiRequest {
  swipes: SwipeData[];
  restaurants: Restaurant[];
  members: Member[];
}

interface AiResponse {
  topPick: {
    restaurantId: string;
    reason: string;
  };
  preferenceInsights: {
    userId: string;
    insight: string;
  }[];
}

function buildUserMessage(
  swipes: SwipeData[],
  restaurants: Restaurant[],
  members: Member[]
): string {
  const restaurantMap: Record<string, Restaurant> = {};
  for (const r of restaurants) {
    restaurantMap[r.id] = r;
  }

  const memberLines: string[] = [];

  for (const member of members) {
    const memberSwipes = swipes.filter((s) => s.userId === member.id);
    const liked = memberSwipes
      .filter((s) => s.liked)
      .map((s) => restaurantMap[s.restaurantId])
      .filter(Boolean);
    const disliked = memberSwipes
      .filter((s) => !s.liked)
      .map((s) => restaurantMap[s.restaurantId])
      .filter(Boolean);

    const likedText = liked
      .map(
        (r) =>
          `${r.name} (${r.cuisine}, dishes: ${r.dishes.slice(0, 3).join(", ")}, vibes: ${r.vibes.join(", ")})`
      )
      .join("; ");

    const dislikedText = disliked
      .map(
        (r) =>
          `${r.name} (${r.cuisine}, dishes: ${r.dishes.slice(0, 3).join(", ")})`
      )
      .join("; ");

    memberLines.push(
      `Member: ${member.name} (id: ${member.id})\n  Liked: ${likedText || "none"}\n  Disliked: ${dislikedText || "none"}`
    );
  }

  const restaurantList = restaurants
    .map(
      (r) =>
        `- id: ${r.id}, name: ${r.name}, cuisine: ${r.cuisine}, dishes: ${r.dishes.join(", ")}, vibes: ${r.vibes.join(", ")}, dietary: ${r.dietary.join(", ")}`
    )
    .join("\n");

  return `Here are the group members and their swipe patterns:

${memberLines.join("\n\n")}

Available restaurants:
${restaurantList}

Based on the swipe patterns above, identify the best single restaurant pick for the whole group. Remember: people's preferences are at the dish level, not cuisine level. Someone who disliked a Mexican restaurant might still love burritos or tacos at a different spot.

Respond with ONLY valid JSON in this exact format:
{
  "topPick": {
    "restaurantId": "<id of best restaurant>",
    "reason": "<1-2 sentence explanation of why this restaurant works for everyone considering their dish-level preferences>"
  },
  "preferenceInsights": [
    {
      "userId": "<member id>",
      "insight": "<1 sentence insight about what they enjoy, based on their specific dish/flavor patterns>"
    }
  ]
}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AiRequest;
    const { swipes, restaurants, members } = body;

    if (!swipes || !restaurants || !members) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = new Anthropic();

    const systemPrompt = `You are a restaurant recommendation AI. Your job is to find the best restaurant for a group based on their swipe patterns.

Key insight: People have DISH-level preferences, not just cuisine preferences. Someone who swiped left on a traditional Mexican restaurant might still love burritos. Someone who swiped left on an Indian restaurant might love chicken tikka.

Analyze the swipe patterns to understand underlying food preferences (specific dishes, flavors, vibes) and recommend the best group match.

Always respond with valid JSON only.`;

    const userMessage = buildUserMessage(swipes, restaurants, members);

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "{}";

    // Strip any markdown code fences if present
    const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as AiResponse;

    return Response.json(parsed);
  } catch (err) {
    console.error("AI route error:", err);
    return Response.json({ error: "Failed to get AI recommendation" }, { status: 500 });
  }
}
