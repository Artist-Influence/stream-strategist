// Core data types for Spotify Campaign Builder

export interface Vendor {
  id: string;
  name: string;
  max_daily_streams: number;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: string;
  vendor_id: string;
  name: string;
  url: string;
  genres: string[];
  avg_daily_streams: number;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  client: string;
  track_url: string;
  stream_goal: number;
  remaining_streams: number;
  budget: number;
  sub_genre: string;
  start_date: string;
  duration_days: number;
  status: 'draft' | 'active' | 'completed';
  selected_playlists: Playlist[];
  vendor_allocations: Record<string, number>;
  totals: {
    projected_streams: number;
  };
  created_at: string;
  updated_at: string;
}

export interface WeeklyUpdate {
  id: string;
  campaign_id: string;
  imported_on: string;
  streams: number;
  notes?: string;
  created_at: string;
}

export interface AllocationResult {
  playlist_id: string;
  allocation: number;
  vendor_id: string;
}

export interface AllocationInput {
  playlists: Playlist[];
  goal: number;
  vendorCaps: Record<string, number>;
  subGenre: string;
  durationDays: number;
}

// Navigation types
export type NavItem = {
  title: string;
  href: string;
  icon: string;
  description?: string;
  hotkey?: string;
};

// Filter types
export interface PlaylistFilters {
  search: string;
  genres: string[];
  vendors: string[];
  streamRange: [number, number];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

export interface CampaignFilters {
  search: string;
  status: string[];
  clients: string[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}