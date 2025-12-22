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
      activity_schedules: {
        Row: {
          child_id: string
          created_at: string
          duration: number
          end_date: string | null
          family_id: string
          id: string
          location: string | null
          recurring_days: number[] | null
          recurring_rule: string | null
          start_date: string
          time: string
          title_en: string
          title_ru: string
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          duration?: number
          end_date?: string | null
          family_id: string
          id?: string
          location?: string | null
          recurring_days?: number[] | null
          recurring_rule?: string | null
          start_date?: string
          time: string
          title_en: string
          title_ru: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          duration?: number
          end_date?: string | null
          family_id?: string
          id?: string
          location?: string | null
          recurring_days?: number[] | null
          recurring_rule?: string | null
          start_date?: string
          time?: string
          title_en?: string
          title_ru?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_schedules_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_schedules_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          avatar_url: string | null
          balance: number
          created_at: string
          family_id: string
          id: string
          language_preference: string | null
          linked_user_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          family_id: string
          id?: string
          language_preference?: string | null
          linked_user_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          family_id?: string
          id?: string
          language_preference?: string | null
          linked_user_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          currency_name: string | null
          default_language: string | null
          id: string
          name: string
          owner_user_id: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_name?: string | null
          default_language?: string | null
          id?: string
          name?: string
          owner_user_id: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_name?: string | null
          default_language?: string | null
          id?: string
          name?: string
          owner_user_id?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      job_board_items: {
        Row: {
          active: boolean
          availability: string | null
          available_count: number | null
          created_at: string
          description_en: string | null
          description_ru: string | null
          family_id: string
          icon: string | null
          id: string
          reward_amount: number
          title_en: string
          title_ru: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          availability?: string | null
          available_count?: number | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          family_id: string
          icon?: string | null
          id?: string
          reward_amount: number
          title_en: string
          title_ru: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          availability?: string | null
          available_count?: number | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          family_id?: string
          icon?: string | null
          id?: string
          reward_amount?: number
          title_en?: string
          title_ru?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_board_items_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      job_claims: {
        Row: {
          child_id: string
          claimed_at: string
          created_at: string
          id: string
          job_board_item_id: string
          linked_task_instance_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          child_id: string
          claimed_at?: string
          created_at?: string
          id?: string
          job_board_item_id: string
          linked_task_instance_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          claimed_at?: string
          created_at?: string
          id?: string
          job_board_item_id?: string
          linked_task_instance_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_claims_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_claims_job_board_item_id_fkey"
            columns: ["job_board_item_id"]
            isOneToOne: false
            referencedRelation: "job_board_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_claims_linked_task_instance_id_fkey"
            columns: ["linked_task_instance_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          family_id: string
          id: string
          message_en: string | null
          message_ru: string | null
          read_at: string | null
          recipient_child_id: string | null
          recipient_type: string
          title_en: string
          title_ru: string
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          family_id: string
          id?: string
          message_en?: string | null
          message_ru?: string | null
          read_at?: string | null
          recipient_child_id?: string | null
          recipient_type?: string
          title_en: string
          title_ru: string
          type: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          family_id?: string
          id?: string
          message_en?: string | null
          message_ru?: string | null
          read_at?: string | null
          recipient_child_id?: string | null
          recipient_type?: string
          title_en?: string
          title_ru?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_child_id_fkey"
            columns: ["recipient_child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          language_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          language_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          language_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          child_id: string
          created_at: string
          family_id: string
          id: string
          price_at_purchase: number
          status: string
          store_item_id: string | null
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          family_id: string
          id?: string
          price_at_purchase: number
          status?: string
          store_item_id?: string | null
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          family_id?: string
          id?: string
          price_at_purchase?: number
          status?: string
          store_item_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_store_item_id_fkey"
            columns: ["store_item_id"]
            isOneToOne: false
            referencedRelation: "store_items"
            referencedColumns: ["id"]
          },
        ]
      }
      store_items: {
        Row: {
          active: boolean
          created_at: string
          description_en: string | null
          description_ru: string | null
          family_id: string
          id: string
          image_url: string | null
          name_en: string
          name_ru: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          family_id: string
          id?: string
          image_url?: string | null
          name_en: string
          name_ru: string
          price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          family_id?: string
          id?: string
          image_url?: string | null
          name_en?: string
          name_ru?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_items_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      task_instances: {
        Row: {
          cancellation_scope: string | null
          child_id: string
          completed_at: string | null
          created_at: string
          due_datetime: string
          id: string
          reward_granted: boolean
          state: string
          template_id: string
          updated_at: string
        }
        Insert: {
          cancellation_scope?: string | null
          child_id: string
          completed_at?: string | null
          created_at?: string
          due_datetime: string
          id?: string
          reward_granted?: boolean
          state?: string
          template_id: string
          updated_at?: string
        }
        Update: {
          cancellation_scope?: string | null
          child_id?: string
          completed_at?: string | null
          created_at?: string
          due_datetime?: string
          id?: string
          reward_granted?: boolean
          state?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_instances_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_step_completions: {
        Row: {
          completed_at: string
          id: string
          step_id: string
          task_instance_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          step_id: string
          task_instance_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          step_id?: string
          task_instance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_step_completions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "task_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_step_completions_task_instance_id_fkey"
            columns: ["task_instance_id"]
            isOneToOne: false
            referencedRelation: "task_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      task_steps: {
        Row: {
          bonus_amount: number | null
          bonus_hidden: boolean | null
          created_at: string
          due_date: string | null
          duration_minutes: number | null
          id: string
          order_index: number
          template_id: string
          title_en: string
          title_ru: string
        }
        Insert: {
          bonus_amount?: number | null
          bonus_hidden?: boolean | null
          created_at?: string
          due_date?: string | null
          duration_minutes?: number | null
          id?: string
          order_index?: number
          template_id: string
          title_en: string
          title_ru: string
        }
        Update: {
          bonus_amount?: number | null
          bonus_hidden?: boolean | null
          created_at?: string
          due_date?: string | null
          duration_minutes?: number | null
          id?: string
          order_index?: number
          template_id?: string
          title_en?: string
          title_ru?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          child_id: string | null
          created_at: string
          description_en: string | null
          description_ru: string | null
          end_date: string | null
          end_time: string | null
          family_id: string
          icon: string | null
          id: string
          one_time_date: string | null
          recurring_days: number[] | null
          recurring_rule: string | null
          recurring_time: string | null
          reward_amount: number
          start_date: string
          status: string
          task_category: string
          task_type: string
          title_en: string
          title_ru: string
          updated_at: string
        }
        Insert: {
          child_id?: string | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          end_date?: string | null
          end_time?: string | null
          family_id: string
          icon?: string | null
          id?: string
          one_time_date?: string | null
          recurring_days?: number[] | null
          recurring_rule?: string | null
          recurring_time?: string | null
          reward_amount?: number
          start_date?: string
          status?: string
          task_category?: string
          task_type?: string
          title_en: string
          title_ru: string
          updated_at?: string
        }
        Update: {
          child_id?: string | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          end_date?: string | null
          end_time?: string | null
          family_id?: string
          icon?: string | null
          id?: string
          one_time_date?: string | null
          recurring_days?: number[] | null
          recurring_rule?: string | null
          recurring_time?: string | null
          reward_amount?: number
          start_date?: string
          status?: string
          task_category?: string
          task_type?: string
          title_en?: string
          title_ru?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          child_id: string
          created_at: string
          family_id: string
          id: string
          note: string | null
          source: string | null
          source_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          child_id: string
          created_at?: string
          family_id: string
          id?: string
          note?: string | null
          source?: string | null
          source_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          child_id?: string
          created_at?: string
          family_id?: string
          id?: string
          note?: string | null
          source?: string | null
          source_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          child_id: string
          created_at: string
          id: string
          store_item_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          store_item_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          store_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_store_item_id_fkey"
            columns: ["store_item_id"]
            isOneToOne: false
            referencedRelation: "store_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_child_family_id: { Args: { _user_id: string }; Returns: string }
      get_user_family_id: { Args: { _user_id: string }; Returns: string }
      is_child_in_family: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      is_family_member: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      is_family_owner: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "parent" | "child"
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
      app_role: ["parent", "child"],
    },
  },
} as const
