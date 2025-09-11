// Core data types for Spotify Campaign Builder

export interface Vendor {
  id: string;
  name: string;
  max_daily_streams: number;
  cost_per_1k_streams?: number;
  max_concurrent_campaigns: number;
  is_active: boolean;
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
  follower_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  emails: string[];
  contact_person?: string;
  phone?: string;
  notes?: string;
  credit_balance: number;
  created_at: string;
  updated_at: string;
}

export interface ClientCredit {
  id: string;
  client_id: string;
  amount: number;
  reason?: string;
  campaign_id?: string;
  created_at: string;
}

export interface PlaylistWithStatus extends Playlist {
  status?: 'Pending' | 'Pitched' | 'Accepted' | 'Placed' | 'Rejected';
  placed_date?: string;
}

export interface Campaign {
  id: string;
  name: string;
  client: string;
  client_name?: string;
  client_id?: string;
  track_url: string;
  track_name?: string;
  stream_goal: number;
  remaining_streams: number;
  allocated_streams?: number;
  budget: number;
  sub_genre: string;
  sub_genres?: string[];
  start_date: string;
  duration_days: number;
  status: 'draft' | 'operator_review_complete' | 'built' | 'unreleased' | 'active' | 'paused' | 'completed' | 'cancelled';
  selected_playlists: PlaylistWithStatus[];
  vendor_allocations: Record<string, number>;
  totals: {
    projected_streams: number;
  };
  notes?: string;
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