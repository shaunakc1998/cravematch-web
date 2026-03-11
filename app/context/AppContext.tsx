"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Restaurant } from "../data/restaurants";
import { MatchResult } from "../lib/algorithm";

export type TabType = "discover" | "matches" | "group";

export interface SessionFilters {
  radius: number; // miles: 1-20
  priceLevels: number[]; // [1,2,3,4] — which price levels to include
  dietary: string[]; // ["Vegan Options", "Halal", etc.]
  openNow: boolean;
}

export interface GroupSession {
  isActive: boolean;
  roomCode: string;
  participants: { id: string; name: string; avatar: string; isHost: boolean }[];
}

export interface MatchedRestaurant extends Restaurant {
  isGroupMatch: boolean;
  matchedWith?: string;
}

interface AppContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  matches: MatchedRestaurant[];
  addMatch: (restaurant: Restaurant, isGroupMatch?: boolean, matchedWith?: string) => void;
  removeMatch: (restaurantId: string) => void;
  likeCount: number;
  incrementLikeCount: () => void;
  resetLikeCount: () => void;
  // Group session state
  groupSession: GroupSession | null;
  startGroupSession: (session: GroupSession) => void;
  endGroupSession: () => void;
  // Session filters
  filters: SessionFilters;
  setFilters: (filters: SessionFilters) => void;
  // Group swiping state
  sessionSwipes: Record<string, Record<string, boolean>>;
  setSessionSwipes: (swipes: Record<string, Record<string, boolean>>) => void;
  sessionResults: MatchResult[] | null;
  setSessionResults: (results: MatchResult[] | null) => void;
}

const DEFAULT_FILTERS: SessionFilters = {
  radius: 5,
  priceLevels: [1, 2, 3, 4],
  dietary: [],
  openNow: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>("discover");
  const [matches, setMatches] = useState<MatchedRestaurant[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [groupSession, setGroupSession] = useState<GroupSession | null>(null);
  const [filters, setFilters] = useState<SessionFilters>(DEFAULT_FILTERS);
  const [sessionSwipes, setSessionSwipes] = useState<Record<string, Record<string, boolean>>>({});
  const [sessionResults, setSessionResults] = useState<MatchResult[] | null>(null);

  const addMatch = (
    restaurant: Restaurant,
    isGroupMatch: boolean = false,
    matchedWith?: string
  ) => {
    setMatches((prev) => {
      if (prev.some((r) => r.id === restaurant.id)) {
        return prev;
      }
      const matchedRestaurant: MatchedRestaurant = {
        ...restaurant,
        isGroupMatch,
        matchedWith,
      };
      return [matchedRestaurant, ...prev];
    });
  };

  const removeMatch = (restaurantId: string) => {
    setMatches((prev) => prev.filter((r) => r.id !== restaurantId));
  };

  const incrementLikeCount = () => {
    setLikeCount((prev) => prev + 1);
  };

  const resetLikeCount = () => {
    setLikeCount(0);
  };

  const startGroupSession = (session: GroupSession) => {
    setGroupSession(session);
    setActiveTab("discover");
  };

  const endGroupSession = () => {
    setGroupSession(null);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        matches,
        addMatch,
        removeMatch,
        likeCount,
        incrementLikeCount,
        resetLikeCount,
        groupSession,
        startGroupSession,
        endGroupSession,
        filters,
        setFilters,
        sessionSwipes,
        setSessionSwipes,
        sessionResults,
        setSessionResults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
