import { createClient } from "./supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface Room {
  id: string;
  code: string;
  host_id: string;
  status: "waiting" | "active" | "completed";
  current_restaurant_index: number;
  created_at: string;
}

export interface Participant {
  id: string;
  room_id: string;
  user_id: string;
  name: string;
  is_ready: boolean;
  joined_at: string;
}

export interface Swipe {
  id: string;
  room_id: string;
  user_id: string;
  restaurant_id: string;
  direction: "left" | "right";
  created_at: string;
}

export interface Match {
  id: string;
  room_id: string;
  restaurant_id: string;
  created_at: string;
}

// Generate a unique 4-character room code
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new room
export async function createRoom(userId: string, userName: string): Promise<{ room: Room | null; error: string | null }> {
  const supabase = createClient();
  
  // Generate unique code
  let code = generateRoomCode();
  let attempts = 0;
  
  while (attempts < 10) {
    // Try to create room with this code
    const { data: room, error } = await supabase
      .from("rooms")
      .insert({
        code,
        host_id: userId,
        status: "waiting",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Duplicate code, try again
        code = generateRoomCode();
        attempts++;
        continue;
      }
      return { room: null, error: error.message };
    }

    // Add host as participant
    const { error: participantError } = await supabase
      .from("room_participants")
      .insert({
        room_id: room.id,
        user_id: userId,
        name: userName,
        is_ready: true,
      });

    if (participantError) {
      // Clean up room if participant insert fails
      await supabase.from("rooms").delete().eq("id", room.id);
      return { room: null, error: participantError.message };
    }

    return { room: room as Room, error: null };
  }

  return { room: null, error: "Could not generate unique room code" };
}

// Join an existing room
export async function joinRoom(
  code: string,
  userId: string,
  userName: string
): Promise<{ room: Room | null; error: string | null }> {
  const supabase = createClient();

  try {
    // Find room by code
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select()
      .eq("code", code.toUpperCase())
      .eq("status", "waiting")
      .single();

    if (roomError) {
      console.error("Room lookup error:", roomError);
      return { room: null, error: "Room not found or session already started" };
    }

    if (!room) {
      return { room: null, error: "Room not found" };
    }

    console.log("Found room:", room);

    // Check if already in room
    const { data: existing, error: existingError } = await supabase
      .from("room_participants")
      .select()
      .eq("room_id", room.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      console.log("User already in room");
      return { room: room as Room, error: null };
    }

    // Join room
    const { error: joinError } = await supabase
      .from("room_participants")
      .insert({
        room_id: room.id,
        user_id: userId,
        name: userName,
        is_ready: true,
      });

    if (joinError) {
      console.error("Join error:", joinError);
      return { room: null, error: joinError.message };
    }

    console.log("Successfully joined room");
    return { room: room as Room, error: null };
  } catch (err) {
    console.error("Join room exception:", err);
    return { room: null, error: "Failed to join room" };
  }
}

// Get room participants
export async function getRoomParticipants(roomId: string): Promise<Participant[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("room_participants")
    .select()
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("Error fetching participants:", error);
    return [];
  }

  return data as Participant[];
}

// Start the session (host only)
export async function startSession(roomId: string, userId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("rooms")
    .update({ status: "active" })
    .eq("id", roomId)
    .eq("host_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// Record a swipe
export async function recordSwipe(
  roomId: string,
  userId: string,
  restaurantId: string,
  direction: "left" | "right"
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("swipes")
    .insert({
      room_id: roomId,
      user_id: userId,
      restaurant_id: restaurantId,
      direction,
    });

  if (error) {
    // Ignore duplicate swipe errors
    if (error.code === "23505") {
      return { success: true, error: null };
    }
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// Get matches for a room
export async function getRoomMatches(roomId: string): Promise<Match[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("matches")
    .select()
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching matches:", error);
    return [];
  }

  return data as Match[];
}

// Leave a room
export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  const supabase = createClient();

  await supabase
    .from("room_participants")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", userId);
}

// Delete a room (host only)
export async function deleteRoom(roomId: string, userId: string): Promise<void> {
  const supabase = createClient();

  await supabase
    .from("rooms")
    .delete()
    .eq("id", roomId)
    .eq("host_id", userId);
}

// Subscribe to room changes
export function subscribeToRoom(
  roomId: string,
  onParticipantChange: (participants: Participant[]) => void,
  onRoomChange: (room: Room) => void,
  onMatch: (match: Match) => void
): RealtimeChannel {
  const supabase = createClient();

  console.log("Subscribing to room:", roomId);

  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_participants",
        filter: `room_id=eq.${roomId}`,
      },
      async () => {
        console.log("Participant change detected");
        const participants = await getRoomParticipants(roomId);
        onParticipantChange(participants);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        console.log("Room update detected:", payload.new);
        onRoomChange(payload.new as Room);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "matches",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        console.log("Match detected:", payload.new);
        onMatch(payload.new as Match);
      }
    )
    .subscribe((status) => {
      console.log("Subscription status:", status);
    });

  return channel;
}

// Unsubscribe from room
export function unsubscribeFromRoom(channel: RealtimeChannel): void {
  const supabase = createClient();
  supabase.removeChannel(channel);
}
