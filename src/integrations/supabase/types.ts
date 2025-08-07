export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          allocated_streams: number | null
          brand_name: string
          budget: number
          campaign_type: string
          client: string
          client_name: string | null
          content_types: string[]
          created_at: string
          creator_count: number
          daily_streams: number | null
          description: string | null
          duration_days: number
          id: string
          music_genres: string[]
          name: string
          post_types: string[]
          remaining_streams: number
          results: Json | null
          selected_creators: Json | null
          selected_playlists: Json
          source: string
          start_date: string
          status: string
          stream_goal: number
          sub_genre: string
          sub_genres: string[] | null
          territory_preferences: string[]
          totals: Json | null
          track_name: string | null
          track_url: string
          updated_at: string
          vendor_allocations: Json
          weekly_streams: number | null
        }
        Insert: {
          allocated_streams?: number | null
          brand_name: string
          budget: number
          campaign_type?: string
          client?: string
          client_name?: string | null
          content_types?: string[]
          created_at?: string
          creator_count?: number
          daily_streams?: number | null
          description?: string | null
          duration_days?: number
          id?: string
          music_genres?: string[]
          name: string
          post_types?: string[]
          remaining_streams?: number
          results?: Json | null
          selected_creators?: Json | null
          selected_playlists?: Json
          source?: string
          start_date?: string
          status?: string
          stream_goal?: number
          sub_genre?: string
          sub_genres?: string[] | null
          territory_preferences?: string[]
          totals?: Json | null
          track_name?: string | null
          track_url?: string
          updated_at?: string
          vendor_allocations?: Json
          weekly_streams?: number | null
        }
        Update: {
          allocated_streams?: number | null
          brand_name?: string
          budget?: number
          campaign_type?: string
          client?: string
          client_name?: string | null
          content_types?: string[]
          created_at?: string
          creator_count?: number
          daily_streams?: number | null
          description?: string | null
          duration_days?: number
          id?: string
          music_genres?: string[]
          name?: string
          post_types?: string[]
          remaining_streams?: number
          results?: Json | null
          selected_creators?: Json | null
          selected_playlists?: Json
          source?: string
          start_date?: string
          status?: string
          stream_goal?: number
          sub_genre?: string
          sub_genres?: string[] | null
          territory_preferences?: string[]
          totals?: Json | null
          track_name?: string | null
          track_url?: string
          updated_at?: string
          vendor_allocations?: Json
          weekly_streams?: number | null
        }
        Relationships: []
      }
      creators: {
        Row: {
          audience_territories: string[]
          avg_performance_score: number | null
          base_country: string
          campaign_fit_score: number | null
          carousel_rate: number | null
          content_types: string[]
          created_at: string
          email: string | null
          engagement_rate: number
          followers: number
          id: string
          instagram_handle: string
          median_views_per_video: number
          music_genres: string[]
          reel_rate: number | null
          story_rate: number | null
          updated_at: string
        }
        Insert: {
          audience_territories?: string[]
          avg_performance_score?: number | null
          base_country: string
          campaign_fit_score?: number | null
          carousel_rate?: number | null
          content_types?: string[]
          created_at?: string
          email?: string | null
          engagement_rate?: number
          followers?: number
          id?: string
          instagram_handle: string
          median_views_per_video?: number
          music_genres?: string[]
          reel_rate?: number | null
          story_rate?: number | null
          updated_at?: string
        }
        Update: {
          audience_territories?: string[]
          avg_performance_score?: number | null
          base_country?: string
          campaign_fit_score?: number | null
          carousel_rate?: number | null
          content_types?: string[]
          created_at?: string
          email?: string | null
          engagement_rate?: number
          followers?: number
          id?: string
          instagram_handle?: string
          median_views_per_video?: number
          music_genres?: string[]
          reel_rate?: number | null
          story_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      performance_entries: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          daily_streams: number
          date_recorded: string | null
          id: string
          playlist_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          daily_streams: number
          date_recorded?: string | null
          id?: string
          playlist_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          daily_streams?: number
          date_recorded?: string | null
          id?: string
          playlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_entries_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          avg_daily_streams: number
          created_at: string
          follower_count: number | null
          genres: string[]
          id: string
          name: string
          updated_at: string
          url: string
          vendor_id: string
        }
        Insert: {
          avg_daily_streams?: number
          created_at?: string
          follower_count?: number | null
          genres?: string[]
          id?: string
          name: string
          updated_at?: string
          url: string
          vendor_id: string
        }
        Update: {
          avg_daily_streams?: number
          created_at?: string
          follower_count?: number | null
          genres?: string[]
          id?: string
          name?: string
          updated_at?: string
          url?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          cost_per_1k_streams: number | null
          created_at: string
          id: string
          max_concurrent_campaigns: number
          max_daily_streams: number
          name: string
          updated_at: string
        }
        Insert: {
          cost_per_1k_streams?: number | null
          created_at?: string
          id?: string
          max_concurrent_campaigns?: number
          max_daily_streams?: number
          name: string
          updated_at?: string
        }
        Update: {
          cost_per_1k_streams?: number | null
          created_at?: string
          id?: string
          max_concurrent_campaigns?: number
          max_daily_streams?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      weekly_updates: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          imported_on: string
          notes: string | null
          streams: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          imported_on?: string
          notes?: string | null
          streams?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          imported_on?: string
          notes?: string | null
          streams?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_updates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_spotify_token: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_playlist_avg_streams: {
        Args: { playlist_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
