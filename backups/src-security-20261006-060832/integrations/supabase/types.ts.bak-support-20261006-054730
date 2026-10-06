export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_content: {
        Row: {
          key: string;
          content: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          content: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          content?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      conversations: {
        Row: {
          created_at: string;
          id: string;
          office_id: string;
          property_id: string | null;
          request_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          office_id: string;
          property_id?: string | null;
          request_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          office_id?: string;
          property_id?: string | null;
          request_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "property_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          created_at: string;
          id: string;
          property_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          property_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          property_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      follows: {
        Row: {
          created_at: string;
          id: string;
          notify: boolean;
          office_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notify?: boolean;
          office_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notify?: boolean;
          office_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
      governorates: {
        Row: {
          banner_url: string | null;
          code: string;
          created_at: string;
          id: string;
          is_active: boolean;
          name_ar: string;
          name_en: string | null;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          banner_url?: string | null;
          code: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name_ar: string;
          name_en?: string | null;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          banner_url?: string | null;
          code?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name_ar?: string;
          name_en?: string | null;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      device_tokens: {
        Row: {
          created_at: string;
          id: string;
          platform: string;
          token: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          platform?: string;
          token: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          platform?: string;
          token?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      conversation_blocks: {
        Row: {
          conversation_id: string;
          blocker_id: string;
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          conversation_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_blocks_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          body: string | null;
          conversation_id: string;
          created_at: string;
          id: string;
          image_url: string | null;
          read_at: string | null;
          sender_id: string;
        };
        Insert: {
          body?: string | null;
          conversation_id: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          read_at?: string | null;
          sender_id: string;
        };
        Update: {
          body?: string | null;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          read_at?: string | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      neighborhoods: {
        Row: {
          created_at: string;
          governorate_id: string;
          id: string;
          is_active: boolean;
          name_ar: string;
        };
        Insert: {
          created_at?: string;
          governorate_id: string;
          id?: string;
          is_active?: boolean;
          name_ar: string;
        };
        Update: {
          created_at?: string;
          governorate_id?: string;
          id?: string;
          is_active?: boolean;
          name_ar?: string;
        };
        Relationships: [
          {
            foreignKeyName: "neighborhoods_governorate_id_fkey";
            columns: ["governorate_id"];
            isOneToOne: false;
            referencedRelation: "governorates";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          is_read: boolean;
          link: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          link?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          link?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      office_offers: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          notes: string | null;
          office_id: string;
          price: number | null;
          property_id: string | null;
          request_id: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          notes?: string | null;
          office_id: string;
          price?: number | null;
          property_id?: string | null;
          request_id: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          notes?: string | null;
          office_id?: string;
          price?: number | null;
          property_id?: string | null;
          request_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "office_offers_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "office_offers_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "office_offers_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "property_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      office_plan_events: {
        Row: {
          action: string;
          created_at: string;
          expires_at: string | null;
          id: string;
          note: string | null;
          office_id: string;
          plan: Database["public"]["Enums"]["office_plan"];
        };
        Insert: {
          action: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          note?: string | null;
          office_id: string;
          plan: Database["public"]["Enums"]["office_plan"];
        };
        Update: {
          action?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          note?: string | null;
          office_id?: string;
          plan?: Database["public"]["Enums"]["office_plan"];
        };
        Relationships: [
          {
            foreignKeyName: "office_plan_events_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
      office_reviews: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          office_id: string;
          rating: number;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          office_id: string;
          rating: number;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          office_id?: string;
          rating?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "office_reviews_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
      office_staff: {
        Row: {
          can_add_listing: boolean;
          can_edit_own_listings: boolean;
          can_update_requests: boolean;
          can_view_requests: boolean;
          created_at: string;
          email: string | null;
          id: string;
          is_active: boolean;
          job_title: string | null;
          name: string;
          office_id: string;
          phone: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          can_add_listing?: boolean;
          can_edit_own_listings?: boolean;
          can_update_requests?: boolean;
          can_view_requests?: boolean;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          job_title?: string | null;
          name: string;
          office_id: string;
          phone?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          can_add_listing?: boolean;
          can_edit_own_listings?: boolean;
          can_update_requests?: boolean;
          can_view_requests?: boolean;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          job_title?: string | null;
          name?: string;
          office_id?: string;
          phone?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "office_staff_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
      offices: {
        Row: {
          address: string | null;
          commercial_register: string | null;
          created_at: string;
          description: string | null;
          email: string | null;
          experience_years: number;
          fal_license_number: string | null;
          fal_license_url: string | null;
          governorate_id: string | null;
          id: string;
          is_deleted: boolean;
          latitude: number | null;
          license_expiry: string | null;
          license_number: string | null;
          logo_url: string | null;
          longitude: number | null;
          manager_name: string | null;
          name: string;
          owner_id: string;
          phone: string | null;
          plan: Database["public"]["Enums"]["office_plan"];
          plan_expires_at: string | null;
          plan_started_at: string;
          rating_avg: number;
          real_estate_license_url: string | null;
          rejection_reason: string | null;
          reviews_count: number;
          updated_at: string;
          verification_status: Database["public"]["Enums"]["verification_status"];
          whatsapp: string | null;
          working_hours: string | null;
        };
        Insert: {
          address?: string | null;
          commercial_register?: string | null;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          experience_years?: number;
          fal_license_number?: string | null;
          fal_license_url?: string | null;
          governorate_id?: string | null;
          id?: string;
          is_deleted?: boolean;
          latitude?: number | null;
          license_expiry?: string | null;
          license_number?: string | null;
          logo_url?: string | null;
          longitude?: number | null;
          manager_name?: string | null;
          name: string;
          owner_id: string;
          phone?: string | null;
          plan?: Database["public"]["Enums"]["office_plan"];
          plan_expires_at?: string | null;
          plan_started_at?: string;
          rating_avg?: number;
          real_estate_license_url?: string | null;
          rejection_reason?: string | null;
          reviews_count?: number;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
          whatsapp?: string | null;
          working_hours?: string | null;
        };
        Update: {
          address?: string | null;
          commercial_register?: string | null;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          experience_years?: number;
          fal_license_number?: string | null;
          fal_license_url?: string | null;
          governorate_id?: string | null;
          id?: string;
          is_deleted?: boolean;
          latitude?: number | null;
          license_expiry?: string | null;
          license_number?: string | null;
          logo_url?: string | null;
          longitude?: number | null;
          manager_name?: string | null;
          name?: string;
          owner_id?: string;
          phone?: string | null;
          plan?: Database["public"]["Enums"]["office_plan"];
          plan_expires_at?: string | null;
          plan_started_at?: string;
          rating_avg?: number;
          real_estate_license_url?: string | null;
          rejection_reason?: string | null;
          reviews_count?: number;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
          whatsapp?: string | null;
          working_hours?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "offices_governorate_id_fkey";
            columns: ["governorate_id"];
            isOneToOne: false;
            referencedRelation: "governorates";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          governorate_id: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          governorate_id?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          governorate_id?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_governorate_id_fkey";
            columns: ["governorate_id"];
            isOneToOne: false;
            referencedRelation: "governorates";
            referencedColumns: ["id"];
          },
        ];
      };
      properties: {
        Row: {
          age_years: number | null;
          agent_id: string | null;
          area: number;
          bathrooms: number | null;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          facing: string | null;
          favorites_count: number;
          governorate_id: string;
          id: string;
          images_count: number;
          is_deleted: boolean;
          is_featured: boolean;
          is_published: boolean;
          kind: Database["public"]["Enums"]["property_kind"];
          latitude: number | null;
          listing: Database["public"]["Enums"]["listing_type"];
          longitude: number | null;
          neighborhood: string;
          office_id: string;
          price: number;
          property_number: string;
          rent_period: string;
          rooms: number | null;
          state: Database["public"]["Enums"]["property_state"];
          street_width: number | null;
          title: string;
          updated_at: string;
          video_url: string | null;
          views_count: number;
        };
        Insert: {
          age_years?: number | null;
          agent_id?: string | null;
          area: number;
          bathrooms?: number | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          facing?: string | null;
          favorites_count?: number;
          governorate_id: string;
          id?: string;
          images_count?: number;
          is_deleted?: boolean;
          is_featured?: boolean;
          is_published?: boolean;
          kind: Database["public"]["Enums"]["property_kind"];
          latitude?: number | null;
          listing: Database["public"]["Enums"]["listing_type"];
          longitude?: number | null;
          neighborhood: string;
          office_id: string;
          price: number;
          property_number: string;
          rent_period?: string;
          rooms?: number | null;
          state?: Database["public"]["Enums"]["property_state"];
          street_width?: number | null;
          title: string;
          updated_at?: string;
          video_url?: string | null;
          views_count?: number;
        };
        Update: {
          age_years?: number | null;
          agent_id?: string | null;
          area?: number;
          bathrooms?: number | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          facing?: string | null;
          favorites_count?: number;
          governorate_id?: string;
          id?: string;
          images_count?: number;
          is_deleted?: boolean;
          is_featured?: boolean;
          is_published?: boolean;
          kind?: Database["public"]["Enums"]["property_kind"];
          latitude?: number | null;
          listing?: Database["public"]["Enums"]["listing_type"];
          longitude?: number | null;
          neighborhood?: string;
          office_id?: string;
          price?: number;
          property_number?: string;
          rent_period?: string;
          rooms?: number | null;
          state?: Database["public"]["Enums"]["property_state"];
          street_width?: number | null;
          title?: string;
          updated_at?: string;
          video_url?: string | null;
          views_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "office_staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "properties_governorate_id_fkey";
            columns: ["governorate_id"];
            isOneToOne: false;
            referencedRelation: "governorates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "properties_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
      property_images: {
        Row: {
          created_at: string;
          id: string;
          property_id: string;
          sort_order: number;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          property_id: string;
          sort_order?: number;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          property_id?: string;
          sort_order?: number;
          url?: string;
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
      property_inquiries: {
        Row: {
          assigned_agent_id: string | null;
          contact_name: string;
          contact_phone: string | null;
          created_at: string;
          id: string;
          message: string | null;
          office_id: string;
          office_note: string | null;
          property_id: string;
          status: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assigned_agent_id?: string | null;
          contact_name: string;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          message?: string | null;
          office_id: string;
          office_note?: string | null;
          property_id: string;
          status?: string;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_agent_id?: string | null;
          contact_name?: string;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          message?: string | null;
          office_id?: string;
          office_note?: string | null;
          property_id?: string;
          status?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_inquiries_assigned_agent_id_fkey";
            columns: ["assigned_agent_id"];
            isOneToOne: false;
            referencedRelation: "office_staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_inquiries_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_inquiries_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      property_requests: {
        Row: {
          area_min: number | null;
          attachment_url: string | null;
          budget_max: number | null;
          budget_min: number | null;
          created_at: string;
          description: string;
          expires_at: string;
          governorate_id: string;
          id: string;
          kind: Database["public"]["Enums"]["property_kind"];
          listing: Database["public"]["Enums"]["listing_type"];
          neighborhood: string | null;
          status: Database["public"]["Enums"]["request_status"];
          updated_at: string;
          user_id: string;
          views_count: number;
        };
        Insert: {
          area_min?: number | null;
          attachment_url?: string | null;
          budget_max?: number | null;
          budget_min?: number | null;
          created_at?: string;
          description: string;
          expires_at?: string;
          governorate_id: string;
          id?: string;
          kind: Database["public"]["Enums"]["property_kind"];
          listing: Database["public"]["Enums"]["listing_type"];
          neighborhood?: string | null;
          status?: Database["public"]["Enums"]["request_status"];
          updated_at?: string;
          user_id: string;
          views_count?: number;
        };
        Update: {
          area_min?: number | null;
          attachment_url?: string | null;
          budget_max?: number | null;
          budget_min?: number | null;
          created_at?: string;
          description?: string;
          expires_at?: string;
          governorate_id?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["property_kind"];
          listing?: Database["public"]["Enums"]["listing_type"];
          neighborhood?: string | null;
          status?: Database["public"]["Enums"]["request_status"];
          updated_at?: string;
          user_id?: string;
          views_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "property_requests_governorate_id_fkey";
            columns: ["governorate_id"];
            isOneToOne: false;
            referencedRelation: "governorates";
            referencedColumns: ["id"];
          },
        ];
      };
      property_views: {
        Row: {
          created_at: string;
          id: string;
          property_id: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          property_id: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          property_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          office_id: string | null;
          property_id: string | null;
          reason: string;
          reporter_id: string;
          resolved: boolean;
        };
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          office_id?: string | null;
          property_id?: string | null;
          reason: string;
          reporter_id: string;
          resolved?: boolean;
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          office_id?: string | null;
          property_id?: string | null;
          reason?: string;
          reporter_id?: string;
          resolved?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "reports_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_searches: {
        Row: {
          created_at: string;
          filters: Json;
          id: string;
          name: string;
          notify: boolean;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          filters?: Json;
          id?: string;
          name: string;
          notify?: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          filters?: Json;
          id?: string;
          name?: string;
          notify?: boolean;
          user_id?: string;
        };
        Relationships: [];
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
      viewing_bookings: {
        Row: {
          created_at: string;
          id: string;
          office_id: string;
          office_note: string | null;
          property_id: string;
          status: Database["public"]["Enums"]["booking_status"];
          updated_at: string;
          user_id: string;
          visit_date: string;
          visit_time: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          office_id: string;
          office_note?: string | null;
          property_id: string;
          status?: Database["public"]["Enums"]["booking_status"];
          updated_at?: string;
          user_id: string;
          visit_date: string;
          visit_time: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          office_id?: string;
          office_note?: string | null;
          property_id?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          updated_at?: string;
          user_id?: string;
          visit_date?: string;
          visit_time?: string;
        };
        Relationships: [
          {
            foreignKeyName: "viewing_bookings_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "viewing_bookings_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      complete_signup: {
        Args: {
          _full_name: string;
          _governorate_id: string;
          _office?: Json;
          _phone: string;
          _role: string;
        };
        Returns: undefined;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: never; Returns: boolean };
      my_office_id: { Args: never; Returns: string };
      office_effective_plan: {
        Args: { _office_id: string };
        Returns: Database["public"]["Enums"]["office_plan"];
      };
      office_has_contact: {
        Args: { _office_id: string; _user_id: string };
        Returns: boolean;
      };
      office_member_office_id: { Args: never; Returns: string };
      set_office_plan: { Args: { _plan: string }; Returns: undefined };
      admin_set_office_plan: {
        Args: { _office_id: string; _plan: string; _days?: number };
        Returns: undefined;
      };
      admin_delete_user: {
        Args: { _user_id: string };
        Returns: undefined;
      };
      request_pro_upgrade: { Args: Record<string, never>; Returns: undefined };
      staff_can: { Args: { _flag: string }; Returns: boolean };
    };
    Enums: {
      app_role: "individual" | "office" | "admin";
      booking_status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
      listing_type: "sale" | "rent";
      office_plan: "free" | "pro";
      property_kind: "land" | "villa" | "apartment" | "farm" | "rest_house" | "building" | "shop";
      property_state: "available" | "reserved" | "sold" | "rented";
      request_status: "active" | "expired" | "cancelled" | "fulfilled";
      verification_status: "pending" | "verified" | "rejected";
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["individual", "office", "admin"],
      booking_status: ["pending", "accepted", "rejected", "completed", "cancelled"],
      listing_type: ["sale", "rent"],
      office_plan: ["free", "pro"],
      property_kind: ["land", "villa", "apartment", "farm", "rest_house", "building", "shop"],
      property_state: ["available", "reserved", "sold", "rented"],
      request_status: ["active", "expired", "cancelled", "fulfilled"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const;
