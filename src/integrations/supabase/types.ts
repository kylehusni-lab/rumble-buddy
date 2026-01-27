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
        ]
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
            foreignKeyName: "rumble_numbers_party_code_fkey"
            columns: ["party_code"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
