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
      feedback: {
        Row: {
          category: string | null
          created_at: string | null
          email: string | null
          id: string
          message: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string
        }
        Relationships: []
      }
      function_rate_limits: {
        Row: {
          function_name: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          function_name: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          function_name?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      pose_library: {
        Row: {
          base: string | null
          created_at: string | null
          difficulty_level: string | null
          family: string | null
          how_to_cue: string | null
          id: string
          intensity_level: number | null
          orientation: string | null
          pose_name: string
          purpose_value: string | null
          secondary_tags: string[] | null
          symmetry: string | null
          weight_bearing: string | null
        }
        Insert: {
          base?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          family?: string | null
          how_to_cue?: string | null
          id?: string
          intensity_level?: number | null
          orientation?: string | null
          pose_name: string
          purpose_value?: string | null
          secondary_tags?: string[] | null
          symmetry?: string | null
          weight_bearing?: string | null
        }
        Update: {
          base?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          family?: string | null
          how_to_cue?: string | null
          id?: string
          intensity_level?: number | null
          orientation?: string | null
          pose_name?: string
          purpose_value?: string | null
          secondary_tags?: string[] | null
          symmetry?: string | null
          weight_bearing?: string | null
        }
        Relationships: []
      }
      pose_media: {
        Row: {
          id: string
          image_url: string
          pose_name: string
        }
        Insert: {
          id?: string
          image_url: string
          pose_name: string
        }
        Update: {
          id?: string
          image_url?: string
          pose_name?: string
        }
        Relationships: []
      }
      saved_classes: {
        Row: {
          archived: boolean | null
          class_content: string | null
          class_length: number | null
          created_at: string | null
          id: string
          inspiration: string | null
          is_shared: boolean
          peak_pose: string | null
          share_token: string | null
          skill_level: string | null
          user_id: string | null
          yoga_style: string | null
        }
        Insert: {
          archived?: boolean | null
          class_content?: string | null
          class_length?: number | null
          created_at?: string | null
          id?: string
          inspiration?: string | null
          is_shared?: boolean
          peak_pose?: string | null
          share_token?: string | null
          skill_level?: string | null
          user_id?: string | null
          yoga_style?: string | null
        }
        Update: {
          archived?: boolean | null
          class_content?: string | null
          class_length?: number | null
          created_at?: string | null
          id?: string
          inspiration?: string | null
          is_shared?: boolean
          peak_pose?: string | null
          share_token?: string | null
          skill_level?: string | null
          user_id?: string | null
          yoga_style?: string | null
        }
        Relationships: []
      }
      shared_classes: {
        Row: {
          class_content: string
          class_length: number | null
          created_at: string
          id: string
          inspiration: string | null
          peak_pose: string | null
          saved_class_id: string | null
          share_token: string
          skill_level: string | null
          yoga_style: string | null
        }
        Insert: {
          class_content: string
          class_length?: number | null
          created_at?: string
          id?: string
          inspiration?: string | null
          peak_pose?: string | null
          saved_class_id?: string | null
          share_token?: string
          skill_level?: string | null
          yoga_style?: string | null
        }
        Update: {
          class_content?: string
          class_length?: number | null
          created_at?: string
          id?: string
          inspiration?: string | null
          peak_pose?: string | null
          saved_class_id?: string | null
          share_token?: string
          skill_level?: string | null
          yoga_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_classes_saved_class_id_fkey"
            columns: ["saved_class_id"]
            isOneToOne: false
            referencedRelation: "saved_classes"
            referencedColumns: ["id"]
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
