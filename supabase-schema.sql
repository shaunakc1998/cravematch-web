-- CraveMatch Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ─── MIGRATIONS (run these if you already have the schema set up) ───────────
-- Add filters column to rooms (safe to run multiple times)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS filters JSONB DEFAULT '{"radius":5,"priceLevels":[1,2,3,4],"dietary":[],"openNow":false}';

-- Add liked column to swipes (alternative to direction)
ALTER TABLE swipes ADD COLUMN IF NOT EXISTS liked BOOLEAN;

-- Update liked from direction for existing rows
UPDATE swipes SET liked = (direction = 'right') WHERE liked IS NULL;
-- ────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table (for group sessions)
CREATE TABLE rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(4) UNIQUE NOT NULL,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
  current_restaurant_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room participants table
CREATE TABLE room_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Swipes table (tracks each user's swipes in a room)
CREATE TABLE swipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id VARCHAR(50) NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('left', 'right')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id, restaurant_id)
);

-- Matches table (when all participants swipe right on same restaurant)
CREATE TABLE matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  restaurant_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, restaurant_id)
);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Users can view rooms they're in" ON rooms
  FOR SELECT USING (
    host_id = auth.uid() OR 
    id IN (SELECT room_id FROM room_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can update their rooms" ON rooms
  FOR UPDATE USING (host_id = auth.uid());

CREATE POLICY "Hosts can delete their rooms" ON rooms
  FOR DELETE USING (host_id = auth.uid());

-- RLS Policies for room_participants
CREATE POLICY "Users can view participants in their rooms" ON room_participants
  FOR SELECT USING (
    room_id IN (
      SELECT id FROM rooms WHERE host_id = auth.uid()
      UNION
      SELECT room_id FROM room_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms" ON room_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON room_participants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can leave rooms" ON room_participants
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for swipes
CREATE POLICY "Users can view swipes in their rooms" ON swipes
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM room_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own swipes" ON swipes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for matches
CREATE POLICY "Users can view matches in their rooms" ON matches
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM room_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create matches" ON matches
  FOR INSERT WITH CHECK (true);

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE swipes;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- Function to generate unique room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(4) AS $$
DECLARE
  chars VARCHAR(32) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code VARCHAR(4) := '';
  i INTEGER;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..4 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM rooms WHERE rooms.code = code) THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to check for matches after a swipe
CREATE OR REPLACE FUNCTION check_for_match()
RETURNS TRIGGER AS $$
DECLARE
  participant_count INTEGER;
  right_swipe_count INTEGER;
BEGIN
  -- Only check if it's a right swipe
  IF NEW.direction = 'right' THEN
    -- Count total participants in the room
    SELECT COUNT(*) INTO participant_count
    FROM room_participants
    WHERE room_id = NEW.room_id;
    
    -- Count right swipes for this restaurant
    SELECT COUNT(*) INTO right_swipe_count
    FROM swipes
    WHERE room_id = NEW.room_id
      AND restaurant_id = NEW.restaurant_id
      AND direction = 'right';
    
    -- If all participants swiped right, create a match
    IF right_swipe_count = participant_count THEN
      INSERT INTO matches (room_id, restaurant_id)
      VALUES (NEW.room_id, NEW.restaurant_id)
      ON CONFLICT (room_id, restaurant_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check for matches after each swipe
CREATE TRIGGER check_match_trigger
AFTER INSERT ON swipes
FOR EACH ROW
EXECUTE FUNCTION check_for_match();
