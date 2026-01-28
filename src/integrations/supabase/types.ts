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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      match_results: {
        Row: {
          id: string
          match_id: string
          party_code: string
          result: string
          scored_at: string
        }
        Insert: {
          id?: string
          match_id: string
          party_code: string
          result: string
          scored_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          party_code?: string
          result?: string
          scored_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_results_party_code_fkey"
            columns: ["party_code"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "match_results_party_code_fkey"
            columns: ["party_code"]
            isOneToOne: false
            referencedRelation: "parties_public"
            referencedColumns: ["code"]
          },
        ]
      }
      parties: {
        Row: {
          code: string
          created_at: string
          event_started_at: string | null
          host_pin: string | null
          host_session_id: string
          mens_rumble_entrants: Json
          status: string
          womens_rumble_entrants: Json
        }
        Insert: {
          code: string
          created_at?: string
          event_started_at?: string | null
          host_pin?: string | null
          host_session_id: string
          mens_rumble_entrants?: Json
          status?: string
          womens_rumble_entrants?: Json
        }
        Update: {
          code?: string
          created_at?: string
          event_started_at?: string | null
          host_pin?: string | null
          host_session_id?: string
          mens_rumble_entrants?: Json
          status?: string
          womens_rumble_entrants?: Json
        }
        Relationships: []
      }
      picks: {
        Row: {
          created_at: string
          id: string
          match_id: string
          player_id: string
          points_awarded: number | null
          prediction: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          player_id: string
          points_awarded?: number | null
          prediction: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          player_id?: string
          points_awarded?: number | null
          prediction?: string
        }
        Relationships: [
          {
            foreignKeyName: "picks_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picks_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players_public"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      players: {
        Row: {
          display_name: string
          email: string
          id: string
          joined_at: string
          party_code: string
          points: number
          session_id: string
        }
        Insert: {
          display_name: string
          email: string
          id?: string
          joined_at?: string
          party_code: string
          points?: number
          session_id: string
        }
        Update: {
          display_name?: string
          email?: string
          id?: string
          joined_at?: string
          party_code?: string
          points?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_party_code_fkey"
            columns: ["party_code"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "players_party_code_fkey"
            columns: ["party_code"]
            isOneToOne: false
            referencedRelation: "parties_public"
            referencedColumns: ["code"]
          },
        ]
      }
      rumble_numbers: {
        Row: {
          assigned_to_player_id: string | null
          eliminated_by_number: number | null
          elimination_timestamp: string | null
          entry_timestamp: string | null
          id: string
          number: number
          party_code: string
          rumble_type: string
          wrestler_name: string | null
        }
        Insert: {
          assigned_to_player_id?: string | null
          eliminated_by_number?: number | null
          elimination_timestamp?: string | null
          entry_timestamp?: string | null
          id?: string
          number: number
          party_code: string
          rumble_type: string
          wrestler_name?: string | null
        }
        Update: {
          assigned_to_player_id?: string | null
          eliminated_by_number?: number | null
          elimination_timestamp?: string | null
          entry_timestamp?: string | null
          id?: string
          number?: number
          party_code?: string
          rumble_type?: string
          wrestler_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rumble_numbers_assigned_to_player_id_fkey"
            columns: ["assigned_to_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rumble_numbers_assigned_to_player_id_fkey"
            columns: ["assigned_to_player_id"]
            isOneToOne: false
            referencedRelation: "players_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rumble_numbers_party_code_fkey"
            columns: ["party_code"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "rumble_numbers_party_code_fkey"
            columns: ["party_code"]
            isOneToOne: false
            referencedRelation: "parties_public"
            referencedColumns: ["code"]
          },
        ]
      }
      solo_picks: {
        Row: {
          created_at: string
          id: string
          match_id: string
          prediction: string
          solo_player_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          prediction: string
          solo_player_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          prediction?: string
          solo_player_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solo_picks_solo_player_id_fkey"
            columns: ["solo_player_id"]
            isOneToOne: false
            referencedRelation: "solo_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solo_picks_solo_player_id_fkey"
            columns: ["solo_player_id"]
            isOneToOne: false
            referencedRelation: "solo_players_public"
            referencedColumns: ["id"]
          },
        ]
      }
      solo_players: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          pin: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          id?: string
          pin: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          pin?: string
          updated_at?: string
        }
        Relationships: []
      }
      solo_results: {
        Row: {
          id: string
          match_id: string
          result: string
          scored_at: string
          solo_player_id: string
        }
        Insert: {
          id?: string
          match_id: string
          result: string
          scored_at?: string
          solo_player_id: string
        }
        Update: {
          id?: string
          match_id?: string
          result?: string
          scored_at?: string
          solo_player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solo_results_solo_player_id_fkey"
            columns: ["solo_player_id"]
            isOneToOne: false
            referencedRelation: "solo_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solo_results_solo_player_id_fkey"
            columns: ["solo_player_id"]
            isOneToOne: false
            referencedRelation: "solo_players_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      parties_public: {
        Row: {
          code: string | null
          created_at: string | null
          event_started_at: string | null
          mens_rumble_entrants: Json | null
          status: string | null
          womens_rumble_entrants: Json | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          event_started_at?: string | null
          mens_rumble_entrants?: Json | null
          status?: string | null
          womens_rumble_entrants?: Json | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          event_started_at?: string | null
          mens_rumble_entrants?: Json | null
          status?: string | null
          womens_rumble_entrants?: Json | null
        }
        Relationships: []
      }
      players_public: {
        Row: {
          display_name: string | null
          id: string | null
          joined_at: string | null
          party_code: string | null
          points: number | null
        }
        Insert: {
          display_name?: string | null
          id?: string | null
          joined_at?: string | null
          party_code?: string | null
          points?: number | null
        }
        Update: {
          display_name?: string | null
          id?: string | null
          joined_at?: string | null
          party_code?: string | null
          points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_party_code_fkey"
            columns: ["party_code"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "players_party_code_fkey"
            columns: ["party_code"]
            isOneToOne: false
            referencedRelation: "parties_public"
            referencedColumns: ["code"]
          },
        ]
      }
      solo_players_public: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      lookup_player_by_email: {
        Args: { p_email: string; p_party_code: string }
        Returns: {
          display_name: string
          id: string
        }[]
      }
      register_solo_player: {
        Args: { p_display_name: string; p_email: string; p_pin: string }
        Returns: {
          created_at: string
          display_name: string
          error_message: string
          id: string
          success: boolean
        }[]
      }
      set_host_pin: {
        Args: { p_party_code: string; p_pin: string }
        Returns: boolean
      }
      verify_host_pin: {
        Args: { p_party_code: string; p_pin: string }
        Returns: {
          has_pin: boolean
          valid: boolean
        }[]
      }
      verify_solo_login: {
        Args: { p_email: string; p_pin: string }
        Returns: {
          created_at: string
          display_name: string
          id: string
          valid: boolean
        }[]
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
