export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      campaign_creators: {
        Row: {
          approval_notes: string | null
          approval_status: string
          campaign_id: string
          created_at: string
          creator_id: string
          due_date: string | null
          expected_post_date: string | null
          id: string
          instagram_handle: string
          payment_notes: string | null
          payment_status: string
          post_status: string
          post_type: string
          posts_count: number
          rate: number
          updated_at: string
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: string
          campaign_id: string
          created_at?: string
          creator_id: string
          due_date?: string | null
          expected_post_date?: string | null
          id?: string
          instagram_handle: string
          payment_notes?: string | null
          payment_status?: string
          post_status?: string
          post_type?: string
          posts_count?: number
          rate?: number
          updated_at?: string
        }
        Update: {
          approval_notes?: string | null
          approval_status?: string
          campaign_id?: string
          created_at?: string
          creator_id?: string
          due_date?: string | null
          expected_post_date?: string | null
          id?: string
          instagram_handle?: string
          payment_notes?: string | null
          payment_status?: string
          post_status?: string
          post_type?: string
          posts_count?: number
          rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_posts: {
        Row: {
          campaign_id: string
          content_description: string | null
          created_at: string
          creator_id: string | null
          id: string
          instagram_handle: string
          post_type: string
          post_url: string
          posted_at: string | null
          status: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          content_description?: string | null
          created_at?: string
          creator_id?: string | null
          id?: string
          instagram_handle: string
          post_type?: string
          post_url: string
          posted_at?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          content_description?: string | null
          created_at?: string
          creator_id?: string | null
          id?: string
          instagram_handle?: string
          post_type?: string
          post_url?: string
          posted_at?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      campaign_submissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          campaign_name: string
          client_emails: string[]
          client_name: string
          created_at: string
          id: string
          notes: string | null
          price_paid: number
          rejection_reason: string | null
          salesperson: string
          start_date: string
          status: string
          stream_goal: number
          track_url: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_name: string
          client_emails: string[]
          client_name: string
          created_at?: string
          id?: string
          notes?: string | null
          price_paid: number
          rejection_reason?: string | null
          salesperson: string
          start_date: string
          status?: string
          stream_goal: number
          track_url: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_name?: string
          client_emails?: string[]
          client_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          price_paid?: number
          rejection_reason?: string | null
          salesperson?: string
          start_date?: string
          status?: string
          stream_goal?: number
          track_url?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          allocated_streams: number | null
          brand_name: string
          budget: number
          campaign_type: string
          client: string
          client_id: string | null
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
          public_access_enabled: boolean | null
          public_token: string | null
          remaining_streams: number
          results: Json | null
          salesperson: string | null
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
          client_id?: string | null
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
          public_access_enabled?: boolean | null
          public_token?: string | null
          remaining_streams?: number
          results?: Json | null
          salesperson?: string | null
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
          client_id?: string | null
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
          public_access_enabled?: boolean | null
          public_token?: string | null
          remaining_streams?: number
          results?: Json | null
          salesperson?: string | null
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
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_credits: {
        Row: {
          amount: number
          campaign_id: string | null
          client_id: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_credits_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_credits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contact_person: string | null
          created_at: string
          credit_balance: number | null
          emails: string[] | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          credit_balance?: number | null
          emails?: string[] | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          credit_balance?: number | null
          emails?: string[] | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
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
      post_analytics: {
        Row: {
          comments: number | null
          created_at: string
          engagement_rate: number | null
          id: string
          likes: number | null
          post_id: string
          recorded_at: string
          saves: number | null
          shares: number | null
          views: number | null
        }
        Insert: {
          comments?: number | null
          created_at?: string
          engagement_rate?: number | null
          id?: string
          likes?: number | null
          post_id: string
          recorded_at?: string
          saves?: number | null
          shares?: number | null
          views?: number | null
        }
        Update: {
          comments?: number | null
          created_at?: string
          engagement_rate?: number | null
          id?: string
          likes?: number | null
          post_id?: string
          recorded_at?: string
          saves?: number | null
          shares?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "campaign_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      salespeople: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          total_approved: number | null
          total_revenue: number | null
          total_submissions: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          total_approved?: number | null
          total_revenue?: number | null
          total_submissions?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          total_approved?: number | null
          total_revenue?: number | null
          total_submissions?: number | null
          updated_at?: string
        }
        Relationships: []
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_vendor_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      regenerate_campaign_public_token: {
        Args: { campaign_id: string }
        Returns: string
      }
      update_playlist_avg_streams: {
        Args: { playlist_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
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
    Enums: {
      app_role: ["admin", "manager", "user"],
    },
  },
} as const
