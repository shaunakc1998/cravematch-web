-- FIX: Remove recursive RLS policies and replace with simpler ones
-- Run this in your Supabase SQL Editor

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view rooms they're in" ON rooms;
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON room_participants;

-- Create simpler, non-recursive policies for rooms
CREATE POLICY "Anyone can view rooms by code" ON rooms
  FOR SELECT USING (true);

-- Create simpler policy for room_participants  
CREATE POLICY "Anyone can view participants" ON room_participants
  FOR SELECT USING (true);

-- Note: These are more permissive but avoid the recursion issue.
-- In production, you'd want more restrictive policies.
