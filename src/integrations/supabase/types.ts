export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          type: "individual" | "company" | "foundation" | "group";
          phone: string;
          email: string | null;
          city: string | null;
          stage: "lead" | "prospect" | "active" | "negotiation" | "closed" | "lost";
          source: string | null;
          interest_type: string | null;
          budget: number | null;
          rating: number | null;
          assigned_to: string | null;
          next_followup_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: "individual" | "company" | "foundation" | "group";
          phone: string;
          email?: string | null;
          city?: string | null;
          stage?: "lead" | "prospect" | "active" | "negotiation" | "closed" | "lost";
          source?: string | null;
          interest_type?: string | null;
          budget?: number | null;
          rating?: number | null;
          assigned_to?: string | null;
          next_followup_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: "individual" | "company" | "foundation" | "group";
          phone?: string;
          email?: string | null;
          city?: string | null;
          stage?: "lead" | "prospect" | "active" | "negotiation" | "closed" | "lost";
          source?: string | null;
          interest_type?: string | null;
          budget?: number | null;
          rating?: number | null;
          assigned_to?: string | null;
          next_followup_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      client_activities: {
        Row: {
          id: string;
          client_id: string;
          type:
            | "call"
            | "meeting"
            | "whatsapp"
            | "email"
            | "visit"
            | "note"
            | "stage_change"
            | "lead_converted";
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          type:
            | "call"
            | "meeting"
            | "whatsapp"
            | "email"
            | "visit"
            | "note"
            | "stage_change"
            | "lead_converted";
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          type?:
            | "call"
            | "meeting"
            | "whatsapp"
            | "email"
            | "visit"
            | "note"
            | "stage_change"
            | "lead_converted";
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          contract_id: string;
          amount: number;
          due_date: string;
          period_start: string;
          period_end: string;
          status: "pending" | "paid" | "overdue" | "partially_paid" | "cancelled";
          payment_method: string | null;
          payment_date: string | null;
          payment_receipt_url: string | null;
          amount_paid: number;
          notes: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          amount: number;
          due_date: string;
          period_start: string;
          period_end: string;
          status?: "pending" | "paid" | "overdue" | "partially_paid" | "cancelled";
          payment_method?: string | null;
          payment_date?: string | null;
          payment_receipt_url?: string | null;
          amount_paid?: number;
          notes?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          amount?: number;
          due_date?: string;
          period_start?: string;
          period_end?: string;
          status?: "pending" | "paid" | "overdue" | "partially_paid" | "cancelled";
          payment_method?: string | null;
          payment_date?: string | null;
          payment_receipt_url?: string | null;
          amount_paid?: number;
          notes?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoice_activities: {
        Row: {
          id: string;
          invoice_id: string;
          type: "payment" | "reminder_sent" | "note" | "status_change";
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          type: "payment" | "reminder_sent" | "note" | "status_change";
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          type?: "payment" | "reminder_sent" | "note" | "status_change";
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      maintenance_requests: {
        Row: {
          id: string;
          unit_id: string | null;
          property_id: string | null;
          tenant_id: string | null;
          category: "ac" | "electrical" | "plumbing" | "carpentry" | "painting" | "other";
          priority: "high" | "medium" | "low";
          title: string;
          description: string | null;
          status: "new" | "in_progress" | "closed" | "reopened";
          technician_name: string | null;
          estimated_cost: number | null;
          actual_cost: number | null;
          assigned_at: string | null;
          closed_at: string | null;
          closure_notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          unit_id?: string | null;
          property_id?: string | null;
          tenant_id?: string | null;
          category: "ac" | "electrical" | "plumbing" | "carpentry" | "painting" | "other";
          priority?: "high" | "medium" | "low";
          title: string;
          description?: string | null;
          status?: "new" | "in_progress" | "closed" | "reopened";
          technician_name?: string | null;
          estimated_cost?: number | null;
          actual_cost?: number | null;
          assigned_at?: string | null;
          closed_at?: string | null;
          closure_notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          unit_id?: string | null;
          property_id?: string | null;
          tenant_id?: string | null;
          category?: "ac" | "electrical" | "plumbing" | "carpentry" | "painting" | "other";
          priority?: "high" | "medium" | "low";
          title?: string;
          description?: string | null;
          status?: "new" | "in_progress" | "closed" | "reopened";
          technician_name?: string | null;
          estimated_cost?: number | null;
          actual_cost?: number | null;
          assigned_at?: string | null;
          closed_at?: string | null;
          closure_notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      system_settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_value: Json | null;
          new_value: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      owners: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          national_id: string | null;
          notes: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          national_id?: string | null;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          national_id?: string | null;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          property_id: string | null;
          notes: string | null;
          status: "new" | "contacted" | "qualified" | "converted" | "lost";
          assigned_to: string | null;
          converted_client_id: string | null;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          property_id?: string | null;
          notes?: string | null;
          status?: "new" | "contacted" | "qualified" | "converted" | "lost";
          assigned_to?: string | null;
          converted_client_id?: string | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          property_id?: string | null;
          notes?: string | null;
          status?: "new" | "contacted" | "qualified" | "converted" | "lost";
          assigned_to?: string | null;
          converted_client_id?: string | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          is_active: boolean;
          last_login_at: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          is_active?: boolean;
          last_login_at?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          last_login_at?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          area_sqm: number | null;
          bathrooms: number | null;
          bedrooms: number | null;
          city: string;
          created_at: string;
          description: string | null;
          district: string | null;
          handover_date: string | null;
          hero_video_url: string | null;
          id: string;
          is_archived: boolean;
          is_featured: boolean;
          is_published: boolean;
          leads_count: number;
          list_date: string | null;
          location_lat: number | null;
          location_lng: number | null;
          owner_id: string | null;
          price: number;
          purpose: Database["public"]["Enums"]["property_purpose"];
          rega_ad_code: string | null;
          sold_percentage: number | null;
          status: Database["public"]["Enums"]["property_status"];
          tags: string[];
          title: string;
          type: Database["public"]["Enums"]["property_type"];
          updated_at: string;
          views_count: number;
        };
        Insert: {
          area_sqm?: number | null;
          bathrooms?: number | null;
          bedrooms?: number | null;
          city: string;
          created_at?: string;
          description?: string | null;
          district?: string | null;
          handover_date?: string | null;
          hero_video_url?: string | null;
          id?: string;
          is_archived?: boolean;
          is_featured?: boolean;
          is_published?: boolean;
          leads_count?: number;
          list_date?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          owner_id?: string | null;
          price?: number;
          purpose: Database["public"]["Enums"]["property_purpose"];
          rega_ad_code?: string | null;
          sold_percentage?: number | null;
          status?: Database["public"]["Enums"]["property_status"];
          tags?: string[];
          title: string;
          type: Database["public"]["Enums"]["property_type"];
          updated_at?: string;
          views_count?: number;
        };
        Update: {
          area_sqm?: number | null;
          bathrooms?: number | null;
          bedrooms?: number | null;
          city?: string;
          created_at?: string;
          description?: string | null;
          district?: string | null;
          handover_date?: string | null;
          hero_video_url?: string | null;
          id?: string;
          is_archived?: boolean;
          is_featured?: boolean;
          is_published?: boolean;
          leads_count?: number;
          list_date?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          owner_id?: string | null;
          price?: number;
          purpose?: Database["public"]["Enums"]["property_purpose"];
          rega_ad_code?: string | null;
          sold_percentage?: number | null;
          status?: Database["public"]["Enums"]["property_status"];
          tags?: string[];
          title?: string;
          type?: Database["public"]["Enums"]["property_type"];
          updated_at?: string;
          views_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "owners";
            referencedColumns: ["id"];
          },
        ];
      };
      property_amenities: {
        Row: {
          amenity_icon: string | null;
          amenity_name: string;
          created_at: string;
          id: string;
          property_id: string;
        };
        Insert: {
          amenity_icon?: string | null;
          amenity_name: string;
          created_at?: string;
          id?: string;
          property_id: string;
        };
        Update: {
          amenity_icon?: string | null;
          amenity_name?: string;
          created_at?: string;
          id?: string;
          property_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_amenities_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      property_images: {
        Row: {
          created_at: string;
          id: string;
          image_url: string;
          is_primary: boolean;
          property_id: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url: string;
          is_primary?: boolean;
          property_id: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string;
          is_primary?: boolean;
          property_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      rental_contracts: {
        Row: {
          id: string;
          unit_id: string;
          tenant_id: string;
          start_date: string;
          end_date: string;
          rent_amount: number;
          payment_frequency: "monthly" | "quarterly" | "biannual" | "annual";
          deposit_amount: number | null;
          status: "draft" | "active" | "expired" | "cancelled";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          unit_id: string;
          tenant_id: string;
          start_date: string;
          end_date: string;
          rent_amount: number;
          payment_frequency?: "monthly" | "quarterly" | "biannual" | "annual";
          deposit_amount?: number | null;
          status?: "draft" | "active" | "expired" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          unit_id?: string;
          tenant_id?: string;
          start_date?: string;
          end_date?: string;
          rent_amount?: number;
          payment_frequency?: "monthly" | "quarterly" | "biannual" | "annual";
          deposit_amount?: number | null;
          status?: "draft" | "active" | "expired" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tenants: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          national_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          national_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          national_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          property_id: string;
          unit_number: string;
          floor: number | null;
          area_sqm: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          status: "vacant" | "rented" | "under_maintenance";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          unit_number: string;
          floor?: number | null;
          area_sqm?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          status?: "vacant" | "rented" | "under_maintenance";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          unit_number?: string;
          floor?: number | null;
          area_sqm?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          status?: "vacant" | "rented" | "under_maintenance";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_manage_properties: { Args: { _user_id: string }; Returns: boolean };
      has_any_role: { Args: { _user_id: string }; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role:
        | "super_admin"
        | "sales_manager"
        | "sales"
        | "property_manager"
        | "accountant"
        | "marketing";
      property_purpose: "sale" | "rent";
      property_status: "available" | "sold" | "rented" | "reserved";
      property_type:
        | "villa"
        | "apartment"
        | "office"
        | "shop"
        | "industrial"
        | "residential_land"
        | "commercial_land"
        | "industrial_land"
        | "building";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "sales_manager",
        "sales",
        "property_manager",
        "accountant",
        "marketing",
      ],
      property_purpose: ["sale", "rent"],
      property_status: ["available", "sold", "rented", "reserved"],
      property_type: [
        "villa",
        "apartment",
        "office",
        "shop",
        "industrial",
        "residential_land",
        "commercial_land",
        "industrial_land",
        "building",
      ],
    },
  },
} as const;
