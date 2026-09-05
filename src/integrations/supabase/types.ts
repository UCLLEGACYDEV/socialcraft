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
      academy_blog_posts: {
        Row: {
          author_id: string | null
          author_name: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          published_at: string | null
          sort_order: number | null
          tags: string[] | null
          thumbnail: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          sort_order?: number | null
          tags?: string[] | null
          thumbnail?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          sort_order?: number | null
          tags?: string[] | null
          thumbnail?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      academy_courses: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string
          duration: number | null
          id: string
          instructor: string | null
          is_active: boolean
          level: string | null
          sort_order: number | null
          tags: string[] | null
          thumbnail: string | null
          title: string
          tool_category: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description: string
          duration?: number | null
          id?: string
          instructor?: string | null
          is_active?: boolean
          level?: string | null
          sort_order?: number | null
          tags?: string[] | null
          thumbnail?: string | null
          title: string
          tool_category?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          duration?: number | null
          id?: string
          instructor?: string | null
          is_active?: boolean
          level?: string | null
          sort_order?: number | null
          tags?: string[] | null
          thumbnail?: string | null
          title?: string
          tool_category?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      academy_display_settings: {
        Row: {
          enabled: boolean
          id: string
          setting_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          id?: string
          setting_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          id?: string
          setting_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      academy_lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          module_id: string
          updated_at: string
          user_id: string
          watch_time: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          module_id: string
          updated_at?: string
          user_id: string
          watch_time?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          module_id?: string
          updated_at?: string
          user_id?: string
          watch_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_academy_lesson_progress_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_academy_lesson_progress_lesson"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_academy_lesson_progress_module"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_lessons: {
        Row: {
          additional_content: string | null
          attachments: Json | null
          content: string | null
          course_id: string
          created_at: string
          description: string
          duration: number | null
          id: string
          is_active: boolean
          module_id: string
          show_affiliate_button: boolean | null
          sort_order: number | null
          title: string
          type: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          additional_content?: string | null
          attachments?: Json | null
          content?: string | null
          course_id: string
          created_at?: string
          description: string
          duration?: number | null
          id?: string
          is_active?: boolean
          module_id: string
          show_affiliate_button?: boolean | null
          sort_order?: number | null
          title: string
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          additional_content?: string | null
          attachments?: Json | null
          content?: string | null
          course_id?: string
          created_at?: string
          description?: string
          duration?: number | null
          id?: string
          is_active?: boolean
          module_id?: string
          show_affiliate_button?: boolean | null
          sort_order?: number | null
          title?: string
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_academy_lessons_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_academy_lessons_module"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_academy_modules_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_progress: {
        Row: {
          completed_at: string | null
          completed_lessons: number | null
          course_id: string
          created_at: string
          id: string
          last_accessed_at: string | null
          progress_percentage: number | null
          started_at: string | null
          total_lessons: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_lessons?: number | null
          course_id: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          total_lessons?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_lessons?: number | null
          course_id?: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          total_lessons?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_academy_progress_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      activation_codes: {
        Row: {
          assigned_email: string | null
          assigned_first_name: string | null
          assigned_last_name: string | null
          bundle_id: string | null
          code: string
          code_type: string
          created_at: string
          created_by: string | null
          duration_days: number | null
          duration_type: string
          granted_roles: string[] | null
          id: string
          is_active: boolean
          max_uses: number
          notes: string | null
          product_id: string | null
          updated_at: string
          uses_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          assigned_email?: string | null
          assigned_first_name?: string | null
          assigned_last_name?: string | null
          bundle_id?: string | null
          code: string
          code_type: string
          created_at?: string
          created_by?: string | null
          duration_days?: number | null
          duration_type: string
          granted_roles?: string[] | null
          id?: string
          is_active?: boolean
          max_uses?: number
          notes?: string | null
          product_id?: string | null
          updated_at?: string
          uses_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          assigned_email?: string | null
          assigned_first_name?: string | null
          assigned_last_name?: string | null
          bundle_id?: string | null
          code?: string
          code_type?: string
          created_at?: string
          created_by?: string | null
          duration_days?: number | null
          duration_type?: string
          granted_roles?: string[] | null
          id?: string
          is_active?: boolean
          max_uses?: number
          notes?: string | null
          product_id?: string | null
          updated_at?: string
          uses_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activation_codes_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_codes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_codes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          resource_id: string | null
          resource_type: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          severity?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_blocked_dates: {
        Row: {
          admin_id: string
          created_at: string | null
          date: string
          id: string
          reason: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          date: string
          id?: string
          reason?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          date?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_blocked_dates_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "booking_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_custom_slots: {
        Row: {
          admin_id: string
          created_at: string | null
          date: string
          id: string
          slots: string[]
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          date: string
          id?: string
          slots: string[]
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          date?: string
          id?: string
          slots?: string[]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_custom_slots_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "booking_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_metrics: {
        Row: {
          created_at: string
          id: string
          metric_name: string
          metric_type: string
          metric_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_name: string
          metric_type?: string
          metric_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      admin_monthly_overrides: {
        Row: {
          admin_id: string
          created_at: string | null
          id: string
          schedule: Json
          updated_at: string | null
          year_month: string
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          id?: string
          schedule: Json
          updated_at?: string | null
          year_month: string
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          id?: string
          schedule?: Json
          updated_at?: string | null
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_monthly_overrides_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "booking_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          action_required: boolean
          action_url: string | null
          assigned_to: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          priority: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          action_required?: boolean
          action_url?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          priority?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          action_required?: boolean
          action_url?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          priority?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_weekly_schedules: {
        Row: {
          admin_id: string
          created_at: string | null
          day_of_week: string
          enabled: boolean | null
          id: string
          slots: string[] | null
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          day_of_week: string
          enabled?: boolean | null
          id?: string
          slots?: string[] | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          day_of_week?: string
          enabled?: boolean | null
          id?: string
          slots?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_weekly_schedules_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "booking_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_applications: {
        Row: {
          ablefy_affiliate_link: string | null
          applied_at: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          instagram_handle: string
          last_name: string | null
          marketing_rules_accepted: boolean | null
          marketing_rules_accepted_at: string | null
          marketing_rules_accepted_ip: string | null
          marketing_rules_version: string | null
          onboarding_completed: boolean | null
          phone_number: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          tiktok_handle: string | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          ablefy_affiliate_link?: string | null
          applied_at?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          instagram_handle: string
          last_name?: string | null
          marketing_rules_accepted?: boolean | null
          marketing_rules_accepted_at?: string | null
          marketing_rules_accepted_ip?: string | null
          marketing_rules_version?: string | null
          onboarding_completed?: boolean | null
          phone_number: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          tiktok_handle?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          ablefy_affiliate_link?: string | null
          applied_at?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          instagram_handle?: string
          last_name?: string | null
          marketing_rules_accepted?: boolean | null
          marketing_rules_accepted_at?: string | null
          marketing_rules_accepted_ip?: string | null
          marketing_rules_version?: string | null
          onboarding_completed?: boolean | null
          phone_number?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          tiktok_handle?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      affiliate_assets: {
        Row: {
          asset_type: string
          asset_url: string
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          asset_type: string
          asset_url: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          asset_type?: string
          asset_url?: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      affiliate_assignments: {
        Row: {
          affiliate_code: string
          affiliate_code_id: string
          assignment_method: string
          browser_fingerprint: string | null
          confidence_score: number | null
          created_at: string
          id: string
          metadata: Json | null
          session_id: string | null
          updated_at: string
          user_id: string
          visitor_ip: unknown
        }
        Insert: {
          affiliate_code: string
          affiliate_code_id: string
          assignment_method?: string
          browser_fingerprint?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          updated_at?: string
          user_id: string
          visitor_ip?: unknown
        }
        Update: {
          affiliate_code?: string
          affiliate_code_id?: string
          assignment_method?: string
          browser_fingerprint?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          updated_at?: string
          user_id?: string
          visitor_ip?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_assignments_affiliate_code_id_fkey"
            columns: ["affiliate_code_id"]
            isOneToOne: false
            referencedRelation: "affiliate_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_clicks: {
        Row: {
          affiliate_code: string
          affiliate_code_id: string
          clicked_at: string
          created_at: string
          id: string
          metadata: Json | null
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_ip: unknown
        }
        Insert: {
          affiliate_code: string
          affiliate_code_id: string
          clicked_at?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_ip?: unknown
        }
        Update: {
          affiliate_code?: string
          affiliate_code_id?: string
          clicked_at?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_ip?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_code_id_fkey"
            columns: ["affiliate_code_id"]
            isOneToOne: false
            referencedRelation: "affiliate_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_codes: {
        Row: {
          ablefy_affiliate_id: string | null
          affiliate_user_id: string | null
          affiliate_username: string
          click_count: number | null
          code: string
          commission_paid: number | null
          commission_pending: number | null
          commission_rate: number
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_payout_date: string | null
          max_uses: number | null
          payment_provider: string | null
          total_commission_earned: number | null
          total_gross_revenue: number | null
          updated_at: string
          uses_count: number
        }
        Insert: {
          ablefy_affiliate_id?: string | null
          affiliate_user_id?: string | null
          affiliate_username: string
          click_count?: number | null
          code: string
          commission_paid?: number | null
          commission_pending?: number | null
          commission_rate?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_payout_date?: string | null
          max_uses?: number | null
          payment_provider?: string | null
          total_commission_earned?: number | null
          total_gross_revenue?: number | null
          updated_at?: string
          uses_count?: number
        }
        Update: {
          ablefy_affiliate_id?: string | null
          affiliate_user_id?: string | null
          affiliate_username?: string
          click_count?: number | null
          code?: string
          commission_paid?: number | null
          commission_pending?: number | null
          commission_rate?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_payout_date?: string | null
          max_uses?: number | null
          payment_provider?: string | null
          total_commission_earned?: number | null
          total_gross_revenue?: number | null
          updated_at?: string
          uses_count?: number
        }
        Relationships: []
      }
      affiliate_feature_settings: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean
          feature_key: string
          id: string
          label: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean
          feature_key: string
          id?: string
          label?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean
          feature_key?: string
          id?: string
          label?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      affiliate_news: {
        Row: {
          author_id: string | null
          category: string
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_pinned: boolean
          is_published: boolean
          priority: number
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          is_published?: boolean
          priority?: number
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          is_published?: boolean
          priority?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_notifications: {
        Row: {
          affiliate_user_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: string
          read_at: string | null
          title: string
        }
        Insert: {
          affiliate_user_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          title: string
        }
        Update: {
          affiliate_user_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          title?: string
        }
        Relationships: []
      }
      affiliate_onboarding_content: {
        Row: {
          button_text: string | null
          content_body: string | null
          content_type: string
          content_url: string | null
          created_at: string | null
          created_by: string | null
          external_link: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          media_type: string | null
          media_url: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          button_text?: string | null
          content_body?: string | null
          content_type: string
          content_url?: string | null
          created_at?: string | null
          created_by?: string | null
          external_link?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          button_text?: string | null
          content_body?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          created_by?: string | null
          external_link?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      affiliate_onboarding_steps: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          step_key: string
          step_title: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          step_key: string
          step_title: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          step_key?: string
          step_title?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_payouts: {
        Row: {
          affiliate_code_id: string | null
          affiliate_user_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          payout_amount: number
          payout_method: string | null
          payout_reference: string | null
          payout_status: string | null
          processed_at: string | null
          updated_at: string
        }
        Insert: {
          affiliate_code_id?: string | null
          affiliate_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          payout_amount: number
          payout_method?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          processed_at?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_code_id?: string | null
          affiliate_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          payout_amount?: number
          payout_method?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          processed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_code_id_fkey"
            columns: ["affiliate_code_id"]
            isOneToOne: false
            referencedRelation: "affiliate_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_transactions: {
        Row: {
          affiliate_code_id: string | null
          affiliate_user_id: string | null
          commission_amount: number
          commission_rate: number
          commission_status: string | null
          created_at: string
          customer_user_id: string | null
          gross_amount: number
          id: string
          metadata: Json | null
          payment_provider: string
          processed_at: string | null
          transaction_id: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          affiliate_code_id?: string | null
          affiliate_user_id?: string | null
          commission_amount: number
          commission_rate: number
          commission_status?: string | null
          created_at?: string
          customer_user_id?: string | null
          gross_amount: number
          id?: string
          metadata?: Json | null
          payment_provider?: string
          processed_at?: string | null
          transaction_id: string
          transaction_type?: string
          updated_at?: string
        }
        Update: {
          affiliate_code_id?: string | null
          affiliate_user_id?: string | null
          commission_amount?: number
          commission_rate?: number
          commission_status?: string | null
          created_at?: string
          customer_user_id?: string | null
          gross_amount?: number
          id?: string
          metadata?: Json | null
          payment_provider?: string
          processed_at?: string | null
          transaction_id?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_transactions_affiliate_code_id_fkey"
            columns: ["affiliate_code_id"]
            isOneToOne: false
            referencedRelation: "affiliate_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_likes: {
        Row: {
          created_at: string
          id: string
          prompt_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt_id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_prompt_usage: {
        Row: {
          id: string
          metadata: Json | null
          prompt_id: string
          session_id: string | null
          used_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          prompt_id: string
          session_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          prompt_id?: string
          session_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_prompts: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_featured: boolean
          is_public: boolean
          likes_count: number
          tags: string[] | null
          title: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_featured?: boolean
          is_public?: boolean
          likes_count?: number
          tags?: string[] | null
          title: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_featured?: boolean
          is_public?: boolean
          likes_count?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      aiinfluence_assignments: {
        Row: {
          id: string
          influencer_id: string
          user_id: string
        }
        Insert: {
          id?: string
          influencer_id: string
          user_id: string
        }
        Update: {
          id?: string
          influencer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aiinfluence_assignments_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aiinfluence_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_users"
            referencedColumns: ["id"]
          },
        ]
      }
      aiinfluence_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          type: string
          user_email: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          type?: string
          user_email?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          type?: string
          user_email?: string | null
        }
        Relationships: []
      }
      aiinfluence_chat_messages: {
        Row: {
          channel_persona_id: string | null
          content: string
          created_at: string
          id: string
          receiver_id: string | null
          sender_id: string
        }
        Insert: {
          channel_persona_id?: string | null
          content: string
          created_at?: string
          id?: string
          receiver_id?: string | null
          sender_id: string
        }
        Update: {
          channel_persona_id?: string | null
          content?: string
          created_at?: string
          id?: string
          receiver_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aiinfluence_chat_messages_channel_persona_id_fkey"
            columns: ["channel_persona_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aiinfluence_chat_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aiinfluence_chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_users"
            referencedColumns: ["id"]
          },
        ]
      }
      aiinfluence_content_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          persona_id: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          persona_id?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          persona_id?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "aiinfluence_content_items_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      aiinfluence_earnings: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          date: string
          id: string
          influencer_id: string
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          influencer_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          influencer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "aiinfluence_earnings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "aiinfluence_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aiinfluence_earnings_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      aiinfluence_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          persona_id: string | null
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          persona_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          persona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aiinfluence_expenses_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      aiinfluence_influencers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          password: string | null
          phone: string | null
          preset_json: Json | null
          profile_picture: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          password?: string | null
          phone?: string | null
          preset_json?: Json | null
          profile_picture?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          password?: string | null
          phone?: string | null
          preset_json?: Json | null
          profile_picture?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      aiinfluence_payouts: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aiinfluence_payouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_users"
            referencedColumns: ["id"]
          },
        ]
      }
      aiinfluence_peak_times: {
        Row: {
          content_type: string
          day: string
          engagement_level: string | null
          id: string
          influencer_id: string
          platform: string
          times: string[] | null
        }
        Insert: {
          content_type?: string
          day?: string
          engagement_level?: string | null
          id?: string
          influencer_id: string
          platform: string
          times?: string[] | null
        }
        Update: {
          content_type?: string
          day?: string
          engagement_level?: string | null
          id?: string
          influencer_id?: string
          platform?: string
          times?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "aiinfluence_peak_times_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      aiinfluence_scripts: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          performance_rating: number
          persona_id: string | null
          title: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          performance_rating?: number
          persona_id?: string | null
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          performance_rating?: number
          persona_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "aiinfluence_scripts_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      aiinfluence_shifts: {
        Row: {
          created_at: string
          day: string
          end_time: string
          id: string
          notes: string | null
          persona_id: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          end_time: string
          id?: string
          notes?: string | null
          persona_id?: string | null
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          end_time?: string
          id?: string
          notes?: string | null
          persona_id?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aiinfluence_shifts_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aiinfluence_shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_users"
            referencedColumns: ["id"]
          },
        ]
      }
      aiinfluence_social_links: {
        Row: {
          id: string
          influencer_id: string
          platform: string
          url: string
        }
        Insert: {
          id?: string
          influencer_id: string
          platform: string
          url: string
        }
        Update: {
          id?: string
          influencer_id?: string
          platform?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "aiinfluence_social_links_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      aiinfluence_tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          persona_id: string | null
          priority: string
          status: string
          title: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          persona_id?: string | null
          priority?: string
          status?: string
          title: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          persona_id?: string | null
          priority?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "aiinfluence_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aiinfluence_tasks_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      aiinfluence_tickets: {
        Row: {
          admin_response: string | null
          assigned_to: string | null
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aiinfluence_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "aiinfluence_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aiinfluence_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_users"
            referencedColumns: ["id"]
          },
        ]
      }
      aiinfluence_users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          description: string | null
          email: string
          id: string
          last_active: string | null
          password: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          description?: string | null
          email: string
          id?: string
          last_active?: string | null
          password?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          description?: string | null
          email?: string
          id?: string
          last_active?: string | null
          password?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      aiinfluence_vault_items: {
        Row: {
          blob_url: string | null
          created_at: string
          expiration_date: string | null
          file_type: string | null
          id: string
          name: string
          parent_id: string | null
          size: string | null
          tags: string[] | null
          type: string
          watermarked: boolean
        }
        Insert: {
          blob_url?: string | null
          created_at?: string
          expiration_date?: string | null
          file_type?: string | null
          id?: string
          name: string
          parent_id?: string | null
          size?: string | null
          tags?: string[] | null
          type?: string
          watermarked?: boolean
        }
        Update: {
          blob_url?: string | null
          created_at?: string
          expiration_date?: string | null
          file_type?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          size?: string | null
          tags?: string[] | null
          type?: string
          watermarked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "aiinfluence_vault_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "aiinfluence_vault_items"
            referencedColumns: ["id"]
          },
        ]
      }
      app_courses: {
        Row: {
          category: string | null
          course_url: string | null
          created_at: string | null
          email: string | null
          expiry_date: string | null
          id: string
          login_url: string | null
          name: string
          notes: string | null
          password: string | null
          platform: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          visibility: string | null
          visible_to_members: string[] | null
          visible_to_roles: string[] | null
        }
        Insert: {
          category?: string | null
          course_url?: string | null
          created_at?: string | null
          email?: string | null
          expiry_date?: string | null
          id?: string
          login_url?: string | null
          name: string
          notes?: string | null
          password?: string | null
          platform?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
          visible_to_members?: string[] | null
          visible_to_roles?: string[] | null
        }
        Update: {
          category?: string | null
          course_url?: string | null
          created_at?: string | null
          email?: string | null
          expiry_date?: string | null
          id?: string
          login_url?: string | null
          name?: string
          notes?: string | null
          password?: string | null
          platform?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
          visible_to_members?: string[] | null
          visible_to_roles?: string[] | null
        }
        Relationships: []
      }
      app_profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          role: string
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      app_service_accounts: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          service_credentials: Json
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          visibility: string | null
          visible_to_members: string[] | null
          visible_to_roles: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          service_credentials?: Json
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
          visible_to_members?: string[] | null
          visible_to_roles?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          service_credentials?: Json
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
          visible_to_members?: string[] | null
          visible_to_roles?: string[] | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      app_social_accounts: {
        Row: {
          created_at: string | null
          id: string
          language: string | null
          name: string
          niches: string[] | null
          notes: string | null
          platform_credentials: Json
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          visibility: string | null
          visible_to_members: string[] | null
          visible_to_roles: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          language?: string | null
          name: string
          niches?: string[] | null
          notes?: string | null
          platform_credentials?: Json
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
          visible_to_members?: string[] | null
          visible_to_roles?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string | null
          name?: string
          niches?: string[] | null
          notes?: string | null
          platform_credentials?: Json
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
          visible_to_members?: string[] | null
          visible_to_roles?: string[] | null
        }
        Relationships: []
      }
      app_state: {
        Row: {
          created_at: string
          custom_shortcuts: Json | null
          dashboard_layout: Json | null
          favorite_pages: Json | null
          id: string
          recent_searches: Json | null
          updated_at: string
          user_id: string
          wishlist_items: Json | null
        }
        Insert: {
          created_at?: string
          custom_shortcuts?: Json | null
          dashboard_layout?: Json | null
          favorite_pages?: Json | null
          id?: string
          recent_searches?: Json | null
          updated_at?: string
          user_id: string
          wishlist_items?: Json | null
        }
        Update: {
          created_at?: string
          custom_shortcuts?: Json | null
          dashboard_layout?: Json | null
          favorite_pages?: Json | null
          id?: string
          recent_searches?: Json | null
          updated_at?: string
          user_id?: string
          wishlist_items?: Json | null
        }
        Relationships: []
      }
      availability: {
        Row: {
          available: boolean
          created_at: string
          date: string
          from_time: string
          id: string
          to_time: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          date: string
          from_time?: string
          id?: string
          to_time?: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          created_at?: string
          date?: string
          from_time?: string
          id?: string
          to_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      beta_feature_restrictions: {
        Row: {
          academy_disabled: boolean
          academy_expires_at: string | null
          created_at: string
          id: string
          mediathek_disabled: boolean
          mediathek_expires_at: string | null
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academy_disabled?: boolean
          academy_expires_at?: string | null
          created_at?: string
          id?: string
          mediathek_disabled?: boolean
          mediathek_expires_at?: string | null
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academy_disabled?: boolean
          academy_expires_at?: string | null
          created_at?: string
          id?: string
          mediathek_disabled?: boolean
          mediathek_expires_at?: string | null
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      beta_nda_acceptances: {
        Row: {
          accepted_at: string
          city: string | null
          country: string | null
          created_at: string
          document_title: string
          email: string
          first_name: string
          house_number: string | null
          id: string
          ip_address: string | null
          last_name: string
          nda_version: string
          phone: string
          postal_code: string | null
          street: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          city?: string | null
          country?: string | null
          created_at?: string
          document_title?: string
          email: string
          first_name: string
          house_number?: string | null
          id?: string
          ip_address?: string | null
          last_name: string
          nda_version?: string
          phone: string
          postal_code?: string | null
          street?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          city?: string | null
          country?: string | null
          created_at?: string
          document_title?: string
          email?: string
          first_name?: string
          house_number?: string | null
          id?: string
          ip_address?: string | null
          last_name?: string
          nda_version?: string
          phone?: string
          postal_code?: string | null
          street?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      booking_admins: {
        Row: {
          created_at: string | null
          description: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string | null
          role: string | null
          show_in_booking: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          role?: string | null
          show_in_booking?: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          role?: string | null
          show_in_booking?: boolean
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          accepted_refund_policy: boolean
          accepted_terms: boolean
          advisor_id: string | null
          booking_date: string
          booking_time: string
          confirmation_sent_at: string | null
          contacted: boolean | null
          created_at: string
          customer_id: string | null
          email: string
          first_name: string
          id: string
          instagram: string | null
          last_name: string
          notes: string | null
          occupation: string | null
          phone: string | null
          questions: string | null
          reminder_sent_at: string | null
          status: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          accepted_refund_policy?: boolean
          accepted_terms?: boolean
          advisor_id?: string | null
          booking_date: string
          booking_time: string
          confirmation_sent_at?: string | null
          contacted?: boolean | null
          created_at?: string
          customer_id?: string | null
          email: string
          first_name: string
          id?: string
          instagram?: string | null
          last_name: string
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          questions?: string | null
          reminder_sent_at?: string | null
          status?: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          accepted_refund_policy?: boolean
          accepted_terms?: boolean
          advisor_id?: string | null
          booking_date?: string
          booking_time?: string
          confirmation_sent_at?: string | null
          contacted?: boolean | null
          created_at?: string
          customer_id?: string | null
          email?: string
          first_name?: string
          id?: string
          instagram?: string | null
          last_name?: string
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          questions?: string | null
          reminder_sent_at?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "booking_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          sent_at: string | null
          status: string
          target_audience: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          sent_at?: string | null
          status?: string
          target_audience?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          sent_at?: string | null
          status?: string
          target_audience?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      category_tasks: {
        Row: {
          assigned_to: string | null
          category_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          sort_order: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "media_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          room_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          room_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          room_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      code_redemptions: {
        Row: {
          code_id: string
          id: string
          ip_address: string | null
          redeemed_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          code_id: string
          id?: string
          ip_address?: string | null
          redeemed_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          code_id?: string
          id?: string
          ip_address?: string | null
          redeemed_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "activation_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      community_chat_members_de: {
        Row: {
          display_name: string
          id: string
          is_online: boolean
          joined_at: string
          last_seen_at: string
          room_id: string
          user_id: string | null
          username: string
        }
        Insert: {
          display_name: string
          id?: string
          is_online?: boolean
          joined_at?: string
          last_seen_at?: string
          room_id: string
          user_id?: string | null
          username: string
        }
        Update: {
          display_name?: string
          id?: string
          is_online?: boolean
          joined_at?: string
          last_seen_at?: string
          room_id?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_chat_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "community_chat_rooms_de"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_chat_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_chat_members_en: {
        Row: {
          display_name: string
          id: string
          is_online: boolean
          joined_at: string
          last_seen_at: string
          room_id: string
          user_id: string | null
          username: string
        }
        Insert: {
          display_name: string
          id?: string
          is_online?: boolean
          joined_at?: string
          last_seen_at?: string
          room_id: string
          user_id?: string | null
          username: string
        }
        Update: {
          display_name?: string
          id?: string
          is_online?: boolean
          joined_at?: string
          last_seen_at?: string
          room_id?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_chat_members_en_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_chat_members_pl: {
        Row: {
          display_name: string
          id: string
          is_online: boolean
          joined_at: string
          last_seen_at: string
          room_id: string
          user_id: string | null
          username: string
        }
        Insert: {
          display_name: string
          id?: string
          is_online?: boolean
          joined_at?: string
          last_seen_at?: string
          room_id: string
          user_id?: string | null
          username: string
        }
        Update: {
          display_name?: string
          id?: string
          is_online?: boolean
          joined_at?: string
          last_seen_at?: string
          room_id?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_chat_members_pl_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_chat_messages_de: {
        Row: {
          content: string
          created_at: string
          display_name: string
          id: string
          message_type: string
          room_id: string
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          content: string
          created_at?: string
          display_name: string
          id?: string
          message_type?: string
          room_id: string
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string
          id?: string
          message_type?: string
          room_id?: string
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "community_chat_rooms_de"
            referencedColumns: ["id"]
          },
        ]
      }
      community_chat_messages_en: {
        Row: {
          content: string
          created_at: string
          display_name: string
          id: string
          message_type: string
          room_id: string
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          content: string
          created_at?: string
          display_name: string
          id?: string
          message_type?: string
          room_id: string
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string
          id?: string
          message_type?: string
          room_id?: string
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      community_chat_messages_pl: {
        Row: {
          content: string
          created_at: string
          display_name: string
          id: string
          message_type: string
          room_id: string
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          content: string
          created_at?: string
          display_name: string
          id?: string
          message_type?: string
          room_id: string
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string
          id?: string
          message_type?: string
          room_id?: string
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      community_chat_rooms_de: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_chat_rooms_en: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_chat_rooms_pl: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_wishlist: {
        Row: {
          admin_notes: string | null
          category: string
          comments_count: number | null
          created_at: string
          description: string
          estimated_effort: string | null
          id: string
          priority: string
          social_media_links: Json | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_has_voted: boolean | null
          user_id: string
          username: string | null
          votes: number
          votes_count: number | null
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          comments_count?: number | null
          created_at?: string
          description: string
          estimated_effort?: string | null
          id?: string
          priority?: string
          social_media_links?: Json | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_has_voted?: boolean | null
          user_id: string
          username?: string | null
          votes?: number
          votes_count?: number | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          comments_count?: number | null
          created_at?: string
          description?: string
          estimated_effort?: string | null
          id?: string
          priority?: string
          social_media_links?: Json | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_has_voted?: boolean | null
          user_id?: string
          username?: string | null
          votes?: number
          votes_count?: number | null
        }
        Relationships: []
      }
      contact_history: {
        Row: {
          contact_type: string
          created_at: string
          created_by: string | null
          customer_id: string
          description: string
          id: string
          subject: string | null
        }
        Insert: {
          contact_type: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          description: string
          id?: string
          subject?: string | null
        }
        Update: {
          contact_type?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string
          id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          message: string
          metadata: Json | null
          name: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          metadata?: Json | null
          name: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          metadata?: Json | null
          name?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_wishes: {
        Row: {
          admin_response: string | null
          course_id: string | null
          created_at: string
          description: string
          id: string
          module_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          votes: number
          wish_type: string
        }
        Insert: {
          admin_response?: string | null
          course_id?: string | null
          created_at?: string
          description: string
          id?: string
          module_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          votes?: number
          wish_type: string
        }
        Update: {
          admin_response?: string | null
          course_id?: string | null
          created_at?: string
          description?: string
          id?: string
          module_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          votes?: number
          wish_type?: string
        }
        Relationships: []
      }
      cookie_consents: {
        Row: {
          analytics_cookies: boolean
          consent_given: boolean
          consent_version: string | null
          created_at: string
          id: string
          ip_address: unknown
          marketing_cookies: boolean
          necessary_cookies: boolean
          session_id: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          analytics_cookies?: boolean
          consent_given?: boolean
          consent_version?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          marketing_cookies?: boolean
          necessary_cookies?: boolean
          session_id: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          analytics_cookies?: boolean
          consent_given?: boolean
          consent_version?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          marketing_cookies?: boolean
          necessary_cookies?: boolean
          session_id?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      course_feedback: {
        Row: {
          admin_notes: string | null
          category: string | null
          course_id: string
          course_title: string | null
          created_at: string | null
          feedback_type: string
          id: string
          lesson_id: string | null
          lesson_title: string | null
          message: string
          module_id: string | null
          module_title: string | null
          rating: number | null
          status: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          admin_notes?: string | null
          category?: string | null
          course_id: string
          course_title?: string | null
          created_at?: string | null
          feedback_type: string
          id?: string
          lesson_id?: string | null
          lesson_title?: string | null
          message: string
          module_id?: string | null
          module_title?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string | null
          course_id?: string
          course_title?: string | null
          created_at?: string | null
          feedback_type?: string
          id?: string
          lesson_id?: string | null
          lesson_title?: string | null
          message?: string
          module_id?: string | null
          module_title?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      crm_customers: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          last_activity_at: string | null
          lead_source: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          last_activity_at?: string | null
          lead_source?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          last_activity_at?: string | null
          lead_source?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_lead_products: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          product_id: string
          status: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          product_id: string
          status?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          product_id?: string
          status?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_products_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "webinar_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "crm_products"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          age: number | null
          budget: number
          calendar: string | null
          created_at: string
          id: string
          industry: string | null
          instagram: string | null
          page_path: string | null
          professional_status: string | null
          situation: string | null
          source: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          age?: number | null
          budget: number
          calendar?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          instagram?: string | null
          page_path?: string | null
          professional_status?: string | null
          situation?: string | null
          source?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          age?: number | null
          budget?: number
          calendar?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          instagram?: string | null
          page_path?: string | null
          professional_status?: string | null
          situation?: string | null
          source?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      crm_message_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          message: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          product_key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          product_key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          product_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_sources: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          source_key: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          source_key: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          source_key?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string
          first_name: string
          has_paid: boolean
          id: string
          instagram: string | null
          is_blocked: boolean
          last_name: string
          no_show_count: number
          notes: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          has_paid?: boolean
          id?: string
          instagram?: string | null
          is_blocked?: boolean
          last_name: string
          no_show_count?: number
          notes?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          has_paid?: boolean
          id?: string
          instagram?: string | null
          is_blocked?: boolean
          last_name?: string
          no_show_count?: number
          notes?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      demo_categories: {
        Row: {
          access_level: string | null
          classic_image: string | null
          content_type: string
          created_at: string
          created_by: string | null
          demo_path: string | null
          description: string | null
          direct_url: string | null
          fallback_image: string | null
          has_subcategories: boolean | null
          hero_image: string | null
          icon: string | null
          id: string
          image: string | null
          is_active: boolean
          is_locked: boolean | null
          item_count: number
          modern_image: string | null
          premium_path: string | null
          required_roles: string[] | null
          slug: string | null
          sort_order: number | null
          subcategory_count: number | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          access_level?: string | null
          classic_image?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          demo_path?: string | null
          description?: string | null
          direct_url?: string | null
          fallback_image?: string | null
          has_subcategories?: boolean | null
          hero_image?: string | null
          icon?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          is_locked?: boolean | null
          item_count?: number
          modern_image?: string | null
          premium_path?: string | null
          required_roles?: string[] | null
          slug?: string | null
          sort_order?: number | null
          subcategory_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          access_level?: string | null
          classic_image?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          demo_path?: string | null
          description?: string | null
          direct_url?: string | null
          fallback_image?: string | null
          has_subcategories?: boolean | null
          hero_image?: string | null
          icon?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          is_locked?: boolean | null
          item_count?: number
          modern_image?: string | null
          premium_path?: string | null
          required_roles?: string[] | null
          slug?: string | null
          sort_order?: number | null
          subcategory_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      demo_category_items: {
        Row: {
          button_text: string | null
          button_url: string | null
          category_id: string
          classic_image: string | null
          created_at: string
          description: string | null
          id: string
          image: string | null
          is_active: boolean | null
          is_coming_soon: boolean | null
          item_id: string
          link_type: string | null
          maintenance_message: string | null
          modern_image: string | null
          release_at: string | null
          required_roles: string[] | null
          s4_folder_path: string | null
          sort_order: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          button_text?: string | null
          button_url?: string | null
          category_id: string
          classic_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          item_id: string
          link_type?: string | null
          maintenance_message?: string | null
          modern_image?: string | null
          release_at?: string | null
          required_roles?: string[] | null
          s4_folder_path?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          button_text?: string | null
          button_url?: string | null
          category_id?: string
          classic_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          item_id?: string
          link_type?: string | null
          maintenance_message?: string | null
          modern_image?: string | null
          release_at?: string | null
          required_roles?: string[] | null
          s4_folder_path?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_category_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "demo_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_category_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "demo_items"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_items: {
        Row: {
          content_type: string
          created_at: string
          created_by: string | null
          description: string | null
          duration: number | null
          file_size: number | null
          id: string
          image: string | null
          is_active: boolean
          metadata: Json | null
          sort_order: number | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: number | null
          file_size?: number | null
          id?: string
          image?: string | null
          is_active?: boolean
          metadata?: Json | null
          sort_order?: number | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: number | null
          file_size?: number | null
          id?: string
          image?: string | null
          is_active?: boolean
          metadata?: Json | null
          sort_order?: number | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      dynamic_categories: {
        Row: {
          category_type: string
          content_type: string
          created_at: string
          created_by: string | null
          description: string | null
          download_items: Json
          id: string
          image: string | null
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category_type?: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_items?: Json
          id?: string
          image?: string | null
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category_type?: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_items?: Json
          id?: string
          image?: string | null
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          is_edited: boolean
          topic_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name: string
          content: string
          created_at?: string
          id?: string
          is_edited?: boolean
          topic_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          is_edited?: boolean
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies_en: {
        Row: {
          author_id: string | null
          author_name: string
          content: string
          created_at: string
          id: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          content: string
          created_at?: string
          id?: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_en_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics_en"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies_pl: {
        Row: {
          author_id: string | null
          author_name: string
          content: string
          created_at: string
          id: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          content: string
          created_at?: string
          id?: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_pl_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics_pl"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          author_id: string
          author_name: string
          category: string | null
          content: string
          created_at: string
          id: string
          is_locked: boolean
          is_pinned: boolean
          last_reply_at: string | null
          last_reply_author: string | null
          reply_count: number
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name: string
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string | null
          last_reply_author?: string | null
          reply_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string | null
          last_reply_author?: string | null
          reply_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      forum_topics_en: {
        Row: {
          author_id: string | null
          author_name: string
          category: string
          content: string
          created_at: string
          id: string
          is_locked: boolean
          is_pinned: boolean
          last_reply_at: string | null
          last_reply_author: string | null
          reply_count: number
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id?: string | null
          author_name: string
          category?: string
          content: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string | null
          last_reply_author?: string | null
          reply_count?: number
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string | null
          author_name?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string | null
          last_reply_author?: string | null
          reply_count?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      forum_topics_pl: {
        Row: {
          author_id: string | null
          author_name: string
          category: string
          content: string
          created_at: string
          id: string
          is_locked: boolean
          is_pinned: boolean
          last_reply_at: string | null
          last_reply_author: string | null
          reply_count: number
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id?: string | null
          author_name: string
          category?: string
          content: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string | null
          last_reply_author?: string | null
          reply_count?: number
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string | null
          author_name?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string | null
          last_reply_author?: string | null
          reply_count?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      hashtag_collection_likes: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_collection_likes_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "hashtag_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_collection_usage: {
        Row: {
          collection_id: string
          id: string
          metadata: Json | null
          session_id: string | null
          used_at: string
          user_id: string | null
        }
        Insert: {
          collection_id: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Update: {
          collection_id?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_collection_usage_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "hashtag_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_collections: {
        Row: {
          category: string
          created_at: string
          hashtags: string[]
          id: string
          is_public: boolean
          likes_count: number
          title: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          hashtags?: string[]
          id?: string
          is_public?: boolean
          likes_count?: number
          title: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          hashtags?: string[]
          id?: string
          is_public?: boolean
          likes_count?: number
          title?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      hashtag_collections_en: {
        Row: {
          category: string
          created_at: string
          description: string | null
          hashtags: string[]
          id: string
          is_public: boolean
          likes_count: number
          title: string
          updated_at: string
          usage_count: number
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          hashtags?: string[]
          id?: string
          is_public?: boolean
          likes_count?: number
          title: string
          updated_at?: string
          usage_count?: number
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          hashtags?: string[]
          id?: string
          is_public?: boolean
          likes_count?: number
          title?: string
          updated_at?: string
          usage_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      hashtag_collections_pl: {
        Row: {
          category: string
          created_at: string
          description: string | null
          hashtags: string[]
          id: string
          is_public: boolean
          likes_count: number
          title: string
          updated_at: string
          usage_count: number
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          hashtags?: string[]
          id?: string
          is_public?: boolean
          likes_count?: number
          title: string
          updated_at?: string
          usage_count?: number
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          hashtags?: string[]
          id?: string
          is_public?: boolean
          likes_count?: number
          title?: string
          updated_at?: string
          usage_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      kanban_configs: {
        Row: {
          category_id: string
          columns: Json
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          category_id: string
          columns?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          columns?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_configs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: true
            referencedRelation: "media_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_broadcast_campaigns: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          scheduled_at: string | null
          sender_id: string
          sent_at: string | null
          status: string
          target_audience: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          scheduled_at?: string | null
          sender_id: string
          sent_at?: string | null
          status?: string
          target_audience?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          scheduled_at?: string | null
          sender_id?: string
          sent_at?: string | null
          status?: string
          target_audience?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      launch_broadcast_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          opened_at: string | null
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_broadcast_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "launch_broadcast_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_sessions: {
        Row: {
          ended_at: string | null
          id: string
          metadata: Json | null
          room_id: string | null
          started_at: string | null
          status: string
          topic_id: string | null
          user_id: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          room_id?: string | null
          started_at?: string | null
          status?: string
          topic_id?: string | null
          user_id?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          room_id?: string | null
          started_at?: string | null
          status?: string
          topic_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_chat_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "live_chat_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_topics: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      market_research: {
        Row: {
          category: string
          conversions: number | null
          created_at: string
          engagement: number | null
          id: string
          insights: string
          is_active: boolean
          priority: string
          reach: number | null
          social_links: Json | null
          tags: string[] | null
          title: string
          trend: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          conversions?: number | null
          created_at?: string
          engagement?: number | null
          id?: string
          insights: string
          is_active?: boolean
          priority?: string
          reach?: number | null
          social_links?: Json | null
          tags?: string[] | null
          title: string
          trend?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          conversions?: number | null
          created_at?: string
          engagement?: number | null
          id?: string
          insights?: string
          is_active?: boolean
          priority?: string
          reach?: number | null
          social_links?: Json | null
          tags?: string[] | null
          title?: string
          trend?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      media_categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          last_updated_by: string | null
          name: string
          sort_order: number | null
          status: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_updated_by?: string | null
          name: string
          sort_order?: number | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_updated_by?: string | null
          name?: string
          sort_order?: number | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      media_files: {
        Row: {
          category_id: string | null
          created_at: string
          download_count: number | null
          file_path: string
          file_size: number
          filename: string
          id: string
          is_public: boolean | null
          metadata: Json | null
          mime_type: string
          original_name: string
          tags: string[] | null
          updated_at: string
          uploaded_by: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          download_count?: number | null
          file_path: string
          file_size: number
          filename: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          mime_type: string
          original_name: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          download_count?: number | null
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          mime_type?: string
          original_name?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_media_files_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "media_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      media_library_deletion_requests: {
        Row: {
          admin_note: string | null
          category_id: string | null
          category_slug: string | null
          category_title: string | null
          created_at: string
          deleted_at: string | null
          file_name: string
          file_path: string
          file_url: string | null
          id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          s4_folder_path: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          category_id?: string | null
          category_slug?: string | null
          category_title?: string | null
          created_at?: string
          deleted_at?: string | null
          file_name: string
          file_path: string
          file_url?: string | null
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          s4_folder_path: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          category_id?: string | null
          category_slug?: string | null
          category_title?: string | null
          created_at?: string
          deleted_at?: string | null
          file_name?: string
          file_path?: string
          file_url?: string | null
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          s4_folder_path?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      media_library_feedback: {
        Row: {
          admin_response: string | null
          category_id: string | null
          category_slug: string | null
          category_title: string | null
          created_at: string
          feedback_type: string
          id: string
          message: string
          responded_at: string | null
          responded_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category_id?: string | null
          category_slug?: string | null
          category_title?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          message: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category_id?: string | null
          category_slug?: string | null
          category_title?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          message?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      moderation_audit_log: {
        Row: {
          action_type: string
          actor_id: string | null
          actor_role: string
          can_restore: boolean | null
          created_at: string | null
          id: string
          metadata: Json | null
          reason: string | null
          restored_at: string | null
          restored_by: string | null
          target_content: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          actor_role: string
          can_restore?: boolean | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          restored_at?: string | null
          restored_by?: string | null
          target_content?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          actor_role?: string
          can_restore?: boolean | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          restored_at?: string | null
          restored_by?: string | null
          target_content?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      multilingual_templates: {
        Row: {
          button_text: string
          button_url: string | null
          category_image: string | null
          category_title: string
          created_at: string | null
          id: string
          is_active: boolean | null
          language_key: string
          language_title: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          button_text: string
          button_url?: string | null
          category_image?: string | null
          category_title: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language_key: string
          language_title: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          button_text?: string
          button_url?: string | null
          category_image?: string | null
          category_title?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language_key?: string
          language_title?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          marketing_emails: boolean
          new_content_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          marketing_emails?: boolean
          new_content_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          marketing_emails?: boolean
          new_content_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          profile_id: string
          reactions_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          profile_id: string
          reactions_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          profile_id?: string
          reactions_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "onboarding_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "onboarding_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "onboarding_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_comments_en: {
        Row: {
          author_id: string | null
          author_name: string
          content: string
          created_at: string
          id: string
          post_id: string
          reactions_count: number
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          reactions_count?: number
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          reactions_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_comments_en_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "onboarding_posts_en"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_comments_pl: {
        Row: {
          author_id: string | null
          author_name: string
          content: string
          created_at: string
          id: string
          post_id: string
          reactions_count: number
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          reactions_count?: number
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          reactions_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_comments_pl_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "onboarding_posts_pl"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          post_type: string
          profile_id: string
          reactions_count: number
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          post_type?: string
          profile_id: string
          reactions_count?: number
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          post_type?: string
          profile_id?: string
          reactions_count?: number
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "onboarding_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_posts_en: {
        Row: {
          author_id: string | null
          author_name: string
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          reactions_count: number
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          reactions_count?: number
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          reactions_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_posts_pl: {
        Row: {
          author_id: string | null
          author_name: string
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          reactions_count: number
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          reactions_count?: number
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          reactions_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_profiles: {
        Row: {
          achievements: string[] | null
          bio: string | null
          content_types: string[] | null
          created_at: string
          engagement: string | null
          experience: string
          followers: string | null
          goals: string | null
          icon: string | null
          id: string
          interests: string | null
          is_active: boolean
          last_active: string | null
          location: string | null
          name: string
          platform: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          achievements?: string[] | null
          bio?: string | null
          content_types?: string[] | null
          created_at?: string
          engagement?: string | null
          experience?: string
          followers?: string | null
          goals?: string | null
          icon?: string | null
          id?: string
          interests?: string | null
          is_active?: boolean
          last_active?: string | null
          location?: string | null
          name: string
          platform: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          achievements?: string[] | null
          bio?: string | null
          content_types?: string[] | null
          created_at?: string
          engagement?: string | null
          experience?: string
          followers?: string | null
          goals?: string | null
          icon?: string | null
          id?: string
          interests?: string | null
          is_active?: boolean
          last_active?: string | null
          location?: string | null
          name?: string
          platform?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      onboarding_reactions: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          profile_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          profile_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          profile_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "onboarding_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "onboarding_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "onboarding_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_categories: {
        Row: {
          access_level: string | null
          classic_image: string | null
          content_type: string
          created_at: string
          created_by: string | null
          demo_item_count: number
          demo_path: string | null
          description: string | null
          direct_url: string | null
          fallback_image: string | null
          has_subcategories: boolean | null
          hero_image: string | null
          icon: string | null
          id: string
          image: string | null
          is_active: boolean
          is_locked: boolean | null
          item_count: number
          modern_image: string | null
          parent_category_id: string | null
          premium_item_count: number
          premium_path: string | null
          required_roles: string[] | null
          s4_folder_path: string | null
          slug: string | null
          sort_order: number | null
          subcategory_count: number | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          access_level?: string | null
          classic_image?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          demo_item_count?: number
          demo_path?: string | null
          description?: string | null
          direct_url?: string | null
          fallback_image?: string | null
          has_subcategories?: boolean | null
          hero_image?: string | null
          icon?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          is_locked?: boolean | null
          item_count?: number
          modern_image?: string | null
          parent_category_id?: string | null
          premium_item_count?: number
          premium_path?: string | null
          required_roles?: string[] | null
          s4_folder_path?: string | null
          slug?: string | null
          sort_order?: number | null
          subcategory_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          access_level?: string | null
          classic_image?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          demo_item_count?: number
          demo_path?: string | null
          description?: string | null
          direct_url?: string | null
          fallback_image?: string | null
          has_subcategories?: boolean | null
          hero_image?: string | null
          icon?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          is_locked?: boolean | null
          item_count?: number
          modern_image?: string | null
          parent_category_id?: string | null
          premium_item_count?: number
          premium_path?: string | null
          required_roles?: string[] | null
          s4_folder_path?: string | null
          slug?: string | null
          sort_order?: number | null
          subcategory_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      premium_category_items: {
        Row: {
          button_text: string | null
          button_url: string | null
          category_id: string
          classic_image: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image: string | null
          is_active: boolean | null
          is_coming_soon: boolean | null
          link_type: string | null
          maintenance_message: string | null
          modern_image: string | null
          release_at: string | null
          required_roles: string[] | null
          s4_folder_path: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          button_text?: string | null
          button_url?: string | null
          category_id: string
          classic_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          link_type?: string | null
          maintenance_message?: string | null
          modern_image?: string | null
          release_at?: string | null
          required_roles?: string[] | null
          s4_folder_path?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Update: {
          button_text?: string | null
          button_url?: string | null
          category_id?: string
          classic_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          link_type?: string | null
          maintenance_message?: string | null
          modern_image?: string | null
          release_at?: string | null
          required_roles?: string[] | null
          s4_folder_path?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      premium_course_lessons: {
        Row: {
          additional_links: string | null
          course_id: string
          created_at: string
          description: string | null
          download_url: string | null
          embed_url: string | null
          id: string
          is_active: boolean
          maintenance_message: string | null
          module_id: string
          release_at: string | null
          show_affiliate_button: boolean | null
          sort_order: number | null
          text_content: string | null
          thumbnail: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          additional_links?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          download_url?: string | null
          embed_url?: string | null
          id?: string
          is_active?: boolean
          maintenance_message?: string | null
          module_id: string
          release_at?: string | null
          show_affiliate_button?: boolean | null
          sort_order?: number | null
          text_content?: string | null
          thumbnail?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          additional_links?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          download_url?: string | null
          embed_url?: string | null
          id?: string
          is_active?: boolean
          maintenance_message?: string | null
          module_id?: string
          release_at?: string | null
          show_affiliate_button?: boolean | null
          sort_order?: number | null
          text_content?: string | null
          thumbnail?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "premium_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "premium_course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          release_at: string | null
          sort_order: number | null
          thumbnail: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          release_at?: string | null
          sort_order?: number | null
          thumbnail?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          release_at?: string | null
          sort_order?: number | null
          thumbnail?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "premium_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_courses: {
        Row: {
          content_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          maintenance_message: string | null
          preview_video_url: string | null
          release_at: string | null
          slug: string
          sort_order: number | null
          thumbnail: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          maintenance_message?: string | null
          preview_video_url?: string | null
          release_at?: string | null
          slug: string
          sort_order?: number | null
          thumbnail?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          maintenance_message?: string | null
          preview_video_url?: string | null
          release_at?: string | null
          slug?: string
          sort_order?: number | null
          thumbnail?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      premium_items: {
        Row: {
          content_type: string
          created_at: string
          created_by: string | null
          description: string | null
          duration: number | null
          file_size: number | null
          file_url: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          sort_order: number | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: number | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          sort_order?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: number | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          sort_order?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      premium_lesson_attachments: {
        Row: {
          created_at: string | null
          download_url: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          lesson_id: string
          sort_order: number | null
          storage_path: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          download_url: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          lesson_id: string
          sort_order?: number | null
          storage_path: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          download_url?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          lesson_id?: string
          sort_order?: number | null
          storage_path?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_lesson_attachments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "premium_course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_lesson_beta_feedback: {
        Row: {
          course_id: string
          created_at: string
          feedback_text: string
          id: string
          lesson_id: string
          module_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          feedback_text: string
          id?: string
          lesson_id: string
          module_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          feedback_text?: string
          id?: string
          lesson_id?: string
          module_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_lesson_beta_feedback_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "premium_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_lesson_beta_feedback_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "premium_course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_lesson_beta_feedback_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "premium_course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          module_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          module_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          module_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "premium_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "premium_course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_lesson_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "premium_course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_lesson_review_marks: {
        Row: {
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          marked_by: string
          module_id: string
          note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          marked_by?: string
          module_id: string
          note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          marked_by?: string
          module_id?: string
          note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_lesson_review_marks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "premium_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_lesson_review_marks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "premium_course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_lesson_review_marks_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "premium_course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_module_notes: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          lesson_id: string | null
          module_id: string
          note: string
          status: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          lesson_id?: string | null
          module_id: string
          note: string
          status?: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lesson_id?: string | null
          module_id?: string
          note?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_module_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "premium_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_module_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "premium_course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_module_notes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "premium_course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_templates: {
        Row: {
          category_id: string
          created_at: string
          created_by: string | null
          description: string | null
          download_count: number | null
          file_url: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          preview_url: string | null
          sort_order: number | null
          tags: string[] | null
          template_type: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          preview_url?: string | null
          sort_order?: number | null
          tags?: string[] | null
          template_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          preview_url?: string | null
          sort_order?: number | null
          tags?: string[] | null
          template_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_bundles: {
        Row: {
          color_gradient: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          product_ids: string[]
          slug: string
          updated_at: string
        }
        Insert: {
          color_gradient?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          product_ids?: string[]
          slug: string
          updated_at?: string
        }
        Update: {
          color_gradient?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          product_ids?: string[]
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          access_url: string | null
          color_gradient: string | null
          created_at: string
          description: string | null
          external_type: string | null
          icon: string | null
          id: string
          is_active: boolean
          login_credentials: Json | null
          name: string
          product_type: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          access_url?: string | null
          color_gradient?: string | null
          created_at?: string
          description?: string | null
          external_type?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          login_credentials?: Json | null
          name: string
          product_type: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          access_url?: string | null
          color_gradient?: string | null
          created_at?: string
          description?: string | null
          external_type?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          login_credentials?: Json | null
          name?: string
          product_type?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          demo_expires_at: string | null
          documentation_access: boolean | null
          email: string | null
          first_name: string | null
          github_url: string | null
          house_number: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          linkedin_url: string | null
          payment_status: string | null
          phone: string | null
          postal_code: string | null
          role: string | null
          roles: string[] | null
          show_affiliate_welcome_popup: boolean | null
          state: string | null
          street: string | null
          street_address: string | null
          subscription: string | null
          terms_accepted: boolean | null
          twitter_url: string | null
          updated_at: string
          username: string | null
          website_url: string | null
          withdrawal_waiver_accepted: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          demo_expires_at?: string | null
          documentation_access?: boolean | null
          email?: string | null
          first_name?: string | null
          github_url?: string | null
          house_number?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          linkedin_url?: string | null
          payment_status?: string | null
          phone?: string | null
          postal_code?: string | null
          role?: string | null
          roles?: string[] | null
          show_affiliate_welcome_popup?: boolean | null
          state?: string | null
          street?: string | null
          street_address?: string | null
          subscription?: string | null
          terms_accepted?: boolean | null
          twitter_url?: string | null
          updated_at?: string
          username?: string | null
          website_url?: string | null
          withdrawal_waiver_accepted?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          demo_expires_at?: string | null
          documentation_access?: boolean | null
          email?: string | null
          first_name?: string | null
          github_url?: string | null
          house_number?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          linkedin_url?: string | null
          payment_status?: string | null
          phone?: string | null
          postal_code?: string | null
          role?: string | null
          roles?: string[] | null
          show_affiliate_welcome_popup?: boolean | null
          state?: string | null
          street?: string | null
          street_address?: string | null
          subscription?: string | null
          terms_accepted?: boolean | null
          twitter_url?: string | null
          updated_at?: string
          username?: string | null
          website_url?: string | null
          withdrawal_waiver_accepted?: boolean | null
        }
        Relationships: []
      }
      questions_chat_messages: {
        Row: {
          admin_reply: string | null
          admin_user_id: string | null
          admin_username: string | null
          category: string
          content: string
          created_at: string
          id: string
          priority: string
          replied_at: string | null
          status: string
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          admin_reply?: string | null
          admin_user_id?: string | null
          admin_username?: string | null
          category?: string
          content: string
          created_at?: string
          id?: string
          priority?: string
          replied_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          admin_reply?: string | null
          admin_user_id?: string | null
          admin_username?: string | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          priority?: string
          replied_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      rate_limit_attempts: {
        Row: {
          action: string
          attempt_count: number
          created_at: string
          id: string
          identifier: string
          updated_at: string
          window_start: string
        }
        Insert: {
          action: string
          attempt_count?: number
          created_at?: string
          id?: string
          identifier: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          action?: string
          attempt_count?: number
          created_at?: string
          id?: string
          identifier?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_earned: number | null
          created_at: string
          id: string
          is_active: boolean
          referral_date: string
          referred_email: string
          referred_user_id: string
          referred_user_subscription: string | null
          referred_username: string
          referrer_user_id: string
          referrer_username: string
          updated_at: string
        }
        Insert: {
          commission_earned?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          referral_date?: string
          referred_email: string
          referred_user_id: string
          referred_user_subscription?: string | null
          referred_username: string
          referrer_user_id: string
          referrer_username: string
          updated_at?: string
        }
        Update: {
          commission_earned?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          referral_date?: string
          referred_email?: string
          referred_user_id?: string
          referred_user_subscription?: string | null
          referred_username?: string
          referrer_user_id?: string
          referrer_username?: string
          updated_at?: string
        }
        Relationships: []
      }
      rosengarten_announcements: {
        Row: {
          button_text: string
          content: string
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          button_text?: string
          content?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          button_text?: string
          content?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      rosengarten_change_log: {
        Row: {
          created_at: string
          day: string | null
          field: string
          id: string
          new_value: string | null
          old_value: string | null
          week_start: string | null
        }
        Insert: {
          created_at?: string
          day?: string | null
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          week_start?: string | null
        }
        Update: {
          created_at?: string
          day?: string | null
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          week_start?: string | null
        }
        Relationships: []
      }
      rosengarten_contact_requests: {
        Row: {
          created_at: string
          desired_date: string
          desired_time: string | null
          email: string
          id: string
          message: string | null
          name: string
          persons: number
          phone: string | null
          status: string
        }
        Insert: {
          created_at?: string
          desired_date: string
          desired_time?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          persons: number
          phone?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          desired_date?: string
          desired_time?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          persons?: number
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      rosengarten_daily_specials: {
        Row: {
          created_at: string
          day: string
          description: string
          id: string
          is_fixed: boolean
          price: string | null
          sort_order: number
          weekly_plan_id: string
        }
        Insert: {
          created_at?: string
          day: string
          description: string
          id?: string
          is_fixed?: boolean
          price?: string | null
          sort_order?: number
          weekly_plan_id: string
        }
        Update: {
          created_at?: string
          day?: string
          description?: string
          id?: string
          is_fixed?: boolean
          price?: string | null
          sort_order?: number
          weekly_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rosengarten_daily_specials_weekly_plan_id_fkey"
            columns: ["weekly_plan_id"]
            isOneToOne: false
            referencedRelation: "rosengarten_weekly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      rosengarten_menu_categories: {
        Row: {
          created_at: string
          icon_name: string
          id: string
          name: string
          note: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_name?: string
          id?: string
          name: string
          note?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_name?: string
          id?: string
          name?: string
          note?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      rosengarten_menu_items: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          price: string | null
          prices: Json | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: string | null
          prices?: Json | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: string | null
          prices?: Json | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rosengarten_menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "rosengarten_menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rosengarten_visits: {
        Row: {
          created_at: string
          id: string
          path: string
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
        }
        Relationships: []
      }
      rosengarten_weekly_plans: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: []
      }
      s4_folder_thumbnails: {
        Row: {
          created_at: string
          folder_path: string
          id: string
          thumbnail_url: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          folder_path: string
          id?: string
          thumbnail_url: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          folder_path?: string
          id?: string
          thumbnail_url?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource: string
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource: string
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource?: string
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      social_media_posts: {
        Row: {
          comments: number
          created_at: string
          description: string | null
          expires_at: string
          id: string
          images: string[] | null
          is_active: boolean
          likes: number
          platform: string
          url: string | null
          user_id: string
          username: string
          views: string
        }
        Insert: {
          comments?: number
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          images?: string[] | null
          is_active?: boolean
          likes?: number
          platform: string
          url?: string | null
          user_id: string
          username: string
          views?: string
        }
        Update: {
          comments?: number
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          images?: string[] | null
          is_active?: boolean
          likes?: number
          platform?: string
          url?: string | null
          user_id?: string
          username?: string
          views?: string
        }
        Relationships: []
      }
      social_media_posts_en: {
        Row: {
          content: string
          created_at: string
          expires_at: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          is_active: boolean
          performance_score: number | null
          platform: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          performance_score?: number | null
          platform: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          performance_score?: number | null
          platform?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      social_media_posts_pl: {
        Row: {
          content: string
          created_at: string
          expires_at: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          is_active: boolean
          performance_score: number | null
          platform: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          performance_score?: number | null
          platform: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          performance_score?: number | null
          platform?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      social_media_profiles: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          is_public: boolean
          name: string
          platforms: string[]
          profile_image: string | null
          updated_at: string
          urls: Json | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          id?: string
          is_public?: boolean
          name: string
          platforms?: string[]
          profile_image?: string | null
          updated_at?: string
          urls?: Json | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          name?: string
          platforms?: string[]
          profile_image?: string | null
          updated_at?: string
          urls?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          ablefy_customer_id: string | null
          ablefy_session_id: string | null
          created_at: string
          email: string
          id: string
          payment_provider: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ablefy_customer_id?: string | null
          ablefy_session_id?: string | null
          created_at?: string
          email: string
          id?: string
          payment_provider?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ablefy_customer_id?: string | null
          ablefy_session_id?: string | null
          created_at?: string
          email?: string
          id?: string
          payment_provider?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_ticket_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      support_ticket_responses: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          is_internal: boolean
          metadata: Json | null
          response_type: string
          ticket_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          metadata?: Json | null
          response_type?: string
          ticket_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          metadata?: Json | null
          response_type?: string
          ticket_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_responses_en: {
        Row: {
          content: string
          created_at: string
          id: string
          is_staff_response: boolean
          ticket_id: string
          user_id: string | null
          username: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_staff_response?: boolean
          ticket_id: string
          user_id?: string | null
          username: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_staff_response?: boolean
          ticket_id?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_responses_en_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets_en"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_responses_pl: {
        Row: {
          content: string
          created_at: string
          id: string
          is_staff_response: boolean
          ticket_id: string
          user_id: string | null
          username: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_staff_response?: boolean
          ticket_id: string
          user_id?: string | null
          username: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_staff_response?: boolean
          ticket_id?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_responses_pl_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets_pl"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category_id: string | null
          closed_at: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          last_response_at: string | null
          metadata: Json | null
          priority: string
          resolved_at: string | null
          response_count: number
          status: string
          tags: string[] | null
          ticket_number: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category_id?: string | null
          closed_at?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          last_response_at?: string | null
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          response_count?: number
          status?: string
          tags?: string[] | null
          ticket_number: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category_id?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          last_response_at?: string | null
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          response_count?: number
          status?: string
          tags?: string[] | null
          ticket_number?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "support_ticket_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets_en: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          last_response_at: string | null
          priority: string
          response_count: number
          status: string
          subject: string
          ticket_number: string | null
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          last_response_at?: string | null
          priority?: string
          response_count?: number
          status?: string
          subject: string
          ticket_number?: string | null
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          last_response_at?: string | null
          priority?: string
          response_count?: number
          status?: string
          subject?: string
          ticket_number?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      support_tickets_pl: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          last_response_at: string | null
          priority: string
          response_count: number
          status: string
          subject: string
          ticket_number: string | null
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          last_response_at?: string | null
          priority?: string
          response_count?: number
          status?: string
          subject: string
          ticket_number?: string | null
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          last_response_at?: string | null
          priority?: string
          response_count?: number
          status?: string
          subject?: string
          ticket_number?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      system_health_metrics: {
        Row: {
          category: string | null
          created_at: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string
          metric_value: number
          recorded_at: string
          status: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit?: string
          metric_value: number
          recorded_at?: string
          status?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string
          metric_value?: number
          recorded_at?: string
          status?: string
        }
        Relationships: []
      }
      ucl_chat_members_de: {
        Row: {
          display_name: string
          id: string
          is_online: boolean
          joined_at: string
          last_seen_at: string
          room_id: string
          user_id: string | null
          username: string
        }
        Insert: {
          display_name: string
          id?: string
          is_online?: boolean
          joined_at?: string
          last_seen_at?: string
          room_id: string
          user_id?: string | null
          username: string
        }
        Update: {
          display_name?: string
          id?: string
          is_online?: boolean
          joined_at?: string
          last_seen_at?: string
          room_id?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      ucl_chat_members_en: {
        Row: {
          display_name: string
          id: string
          is_online: boolean
          joined_at: string
          last_seen_at: string
          room_id: string
          user_id: string | null
          username: string
        }
        Insert: {
          display_name: string
          id?: string
          is_online?: boolean
          joined_at?: string
          last_seen_at?: string
          room_id: string
          user_id?: string | null
          username: string
        }
        Update: {
          display_name?: string
          id?: string
          is_online?: boolean
          joined_at?: string
          last_seen_at?: string
          room_id?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      ucl_chat_members_pl: {
        Row: {
          display_name: string
          id: string
          is_online: boolean
          joined_at: string
          last_seen_at: string
          room_id: string
          user_id: string | null
          username: string
        }
        Insert: {
          display_name: string
          id?: string
          is_online?: boolean
          joined_at?: string
          last_seen_at?: string
          room_id: string
          user_id?: string | null
          username: string
        }
        Update: {
          display_name?: string
          id?: string
          is_online?: boolean
          joined_at?: string
          last_seen_at?: string
          room_id?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      ucl_chat_messages_de: {
        Row: {
          content: string
          created_at: string
          display_name: string
          id: string
          message_type: string
          room_id: string
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          content: string
          created_at?: string
          display_name: string
          id?: string
          message_type?: string
          room_id: string
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string
          id?: string
          message_type?: string
          room_id?: string
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      ucl_chat_messages_en: {
        Row: {
          content: string
          created_at: string
          display_name: string
          id: string
          message_type: string
          room_id: string
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          content: string
          created_at?: string
          display_name: string
          id?: string
          message_type?: string
          room_id: string
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string
          id?: string
          message_type?: string
          room_id?: string
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      ucl_chat_messages_pl: {
        Row: {
          content: string
          created_at: string
          display_name: string
          id: string
          message_type: string
          room_id: string
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          content: string
          created_at?: string
          display_name: string
          id?: string
          message_type?: string
          room_id: string
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string
          id?: string
          message_type?: string
          room_id?: string
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      ucl_chat_rooms_de: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      ucl_chat_rooms_en: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      ucl_chat_rooms_pl: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      ucl_news: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          priority: number
          published_at: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name: string
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          priority?: number
          published_at?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          priority?: number
          published_at?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      uclcrmvertrieb_academy_lessons: {
        Row: {
          content: string | null
          created_at: string
          files: Json
          id: string
          module_id: string
          sort_order: number
          title: string
          type: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          files?: Json
          id?: string
          module_id: string
          sort_order?: number
          title: string
          type?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          files?: Json
          id?: string
          module_id?: string
          sort_order?: number
          title?: string
          type?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uclcrmvertrieb_academy_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "uclcrmvertrieb_academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      uclcrmvertrieb_academy_modules: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      uclcrmvertrieb_academy_progress: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uclcrmvertrieb_academy_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "uclcrmvertrieb_academy_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      uclcrmvertrieb_calendar_events: {
        Row: {
          color: string | null
          company: string | null
          contact: string | null
          created_at: string | null
          created_by: string | null
          done: boolean | null
          event_date: string
          event_time: string | null
          id: string
          is_task: boolean | null
          title: string
          type: string | null
        }
        Insert: {
          color?: string | null
          company?: string | null
          contact?: string | null
          created_at?: string | null
          created_by?: string | null
          done?: boolean | null
          event_date: string
          event_time?: string | null
          id?: string
          is_task?: boolean | null
          title: string
          type?: string | null
        }
        Update: {
          color?: string | null
          company?: string | null
          contact?: string | null
          created_at?: string | null
          created_by?: string | null
          done?: boolean | null
          event_date?: string
          event_time?: string | null
          id?: string
          is_task?: boolean | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      uclcrmvertrieb_lead_activities: {
        Row: {
          author: string | null
          created_at: string
          id: string
          lead_id: string
          text: string
          type: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          id?: string
          lead_id: string
          text: string
          type: string
        }
        Update: {
          author?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          text?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "uclcrmvertrieb_lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "uclcrmvertrieb_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      uclcrmvertrieb_lead_notes: {
        Row: {
          author: string | null
          created_at: string
          id: string
          lead_id: string
          text: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          id?: string
          lead_id: string
          text: string
        }
        Update: {
          author?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "uclcrmvertrieb_lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "uclcrmvertrieb_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      uclcrmvertrieb_leads: {
        Row: {
          ansprechpartner: string | null
          branche: string | null
          created_at: string
          created_by: string | null
          email: string | null
          firma: string | null
          id: string
          name: string
          paket: string | null
          status: string
          telefon: string | null
          updated_at: string
          website: string | null
          zugewiesen: string | null
        }
        Insert: {
          ansprechpartner?: string | null
          branche?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          firma?: string | null
          id?: string
          name: string
          paket?: string | null
          status?: string
          telefon?: string | null
          updated_at?: string
          website?: string | null
          zugewiesen?: string | null
        }
        Update: {
          ansprechpartner?: string | null
          branche?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          firma?: string | null
          id?: string
          name?: string
          paket?: string | null
          status?: string
          telefon?: string | null
          updated_at?: string
          website?: string | null
          zugewiesen?: string | null
        }
        Relationships: []
      }
      uclcrmvertrieb_notifications: {
        Row: {
          created_at: string
          firma: string | null
          id: string
          lead_id: string | null
          lead_name: string | null
          message: string
          read: boolean
          target: string
          target_user: string | null
          type: string
          vertriebler: string | null
        }
        Insert: {
          created_at?: string
          firma?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          message: string
          read?: boolean
          target: string
          target_user?: string | null
          type: string
          vertriebler?: string | null
        }
        Update: {
          created_at?: string
          firma?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          message?: string
          read?: boolean
          target?: string
          target_user?: string | null
          type?: string
          vertriebler?: string | null
        }
        Relationships: []
      }
      uclcrmvertrieb_pakete: {
        Row: {
          beschreibung: string | null
          created_at: string
          features: string[]
          id: string
          name: string
          preis: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          beschreibung?: string | null
          created_at?: string
          features?: string[]
          id?: string
          name: string
          preis?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          beschreibung?: string | null
          created_at?: string
          features?: string[]
          id?: string
          name?: string
          preis?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      uclcrmvertrieb_scripts: {
        Row: {
          category: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      uclcrmvertrieb_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      uclcrmvertrieb_user_roles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      uclcrmvertrieb_users: {
        Row: {
          active: boolean | null
          affiliate_link: string | null
          approved: boolean
          branchen: string[] | null
          created_at: string
          email: string
          firma: string | null
          id: string
          max_leads: number | null
          name: string
        }
        Insert: {
          active?: boolean | null
          affiliate_link?: string | null
          approved?: boolean
          branchen?: string[] | null
          created_at?: string
          email: string
          firma?: string | null
          id: string
          max_leads?: number | null
          name: string
        }
        Update: {
          active?: boolean | null
          affiliate_link?: string | null
          approved?: boolean
          branchen?: string[] | null
          created_at?: string
          email?: string
          firma?: string | null
          id?: string
          max_leads?: number | null
          name?: string
        }
        Relationships: []
      }
      ui_preferences: {
        Row: {
          created_at: string
          design_preference: string | null
          id: string
          mobile_admin_access: boolean | null
          sidebar_collapsed: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          design_preference?: string | null
          id?: string
          mobile_admin_access?: boolean | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          design_preference?: string | null
          id?: string
          mobile_admin_access?: boolean | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          account_type: string
          created_at: string
          email: string
          id: string
          is_primary: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type: string
          created_at?: string
          email: string
          id?: string
          is_primary?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          created_at?: string
          email?: string
          id?: string
          is_primary?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_agreements: {
        Row: {
          agreed_at: string
          agreement_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          agreed_at?: string
          agreement_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          agreed_at?: string
          agreement_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_auth_settings: {
        Row: {
          created_at: string
          id: string
          login_history: Json | null
          remember_me: boolean
          security_questions: Json | null
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          login_history?: Json | null
          remember_me?: boolean
          security_questions?: Json | null
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          login_history?: Json | null
          remember_me?: boolean
          security_questions?: Json | null
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_inbox_messages: {
        Row: {
          content: string
          created_at: string
          from_display_name: string
          from_user_id: string | null
          id: string
          is_archived: boolean
          is_read: boolean
          metadata: Json | null
          priority: string
          subject: string
          to_user_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          from_display_name: string
          from_user_id?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          metadata?: Json | null
          priority?: string
          subject: string
          to_user_id?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_display_name?: string
          from_user_id?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          metadata?: Json | null
          priority?: string
          subject?: string
          to_user_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_inbox_replies: {
        Row: {
          content: string
          created_at: string
          from_display_name: string
          from_user_id: string | null
          id: string
          message_id: string
        }
        Insert: {
          content: string
          created_at?: string
          from_display_name: string
          from_user_id?: string | null
          id?: string
          message_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_display_name?: string
          from_user_id?: string | null
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inbox_replies_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "user_inbox_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inbox_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      user_invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          download_url: string | null
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          metadata: Json | null
          paid_at: string | null
          payment_method_id: string | null
          payment_provider: string
          provider_invoice_id: string | null
          provider_payment_intent_id: string | null
          status: string
          subscription_history_id: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          download_url?: string | null
          due_date: string
          id?: string
          invoice_date?: string
          invoice_number: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method_id?: string | null
          payment_provider?: string
          provider_invoice_id?: string | null
          provider_payment_intent_id?: string | null
          status?: string
          subscription_history_id?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          download_url?: string | null
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method_id?: string | null
          payment_provider?: string
          provider_invoice_id?: string | null
          provider_payment_intent_id?: string | null
          status?: string
          subscription_history_id?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invoices_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "user_payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invoices_subscription_history_id_fkey"
            columns: ["subscription_history_id"]
            isOneToOne: false
            referencedRelation: "user_subscription_history"
            referencedColumns: ["id"]
          },
        ]
      }
      user_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          priority: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      user_payment_methods: {
        Row: {
          billing_address: Json | null
          billing_email: string | null
          billing_name: string | null
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last_four: string | null
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          metadata: Json | null
          method_type: string
          payment_provider: string
          provider_payment_method_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          billing_email?: string | null
          billing_name?: string | null
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last_four?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          metadata?: Json | null
          method_type: string
          payment_provider?: string
          provider_payment_method_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          billing_email?: string | null
          billing_name?: string | null
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last_four?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          metadata?: Json | null
          method_type?: string
          payment_provider?: string
          provider_payment_method_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          permission_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          permission_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          permission_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          design_preference: string | null
          id: string
          language: string | null
          mobile_admin_access: boolean | null
          notifications: Json | null
          preferences: Json | null
          sidebar_collapsed: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          design_preference?: string | null
          id?: string
          language?: string | null
          mobile_admin_access?: boolean | null
          notifications?: Json | null
          preferences?: Json | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          design_preference?: string | null
          id?: string
          language?: string | null
          mobile_admin_access?: boolean | null
          notifications?: Json | null
          preferences?: Json | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_product_access: {
        Row: {
          access_type: string
          created_at: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          granted_via_code_id: string | null
          id: string
          is_active: boolean
          notes: string | null
          product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_type: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          granted_via_code_id?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_type?: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          granted_via_code_id?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_product_access_granted_via_code_id_fkey"
            columns: ["granted_via_code_id"]
            isOneToOne: false
            referencedRelation: "activation_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_product_access_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_product_access_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile_extensions: {
        Row: {
          address: string | null
          bio: string | null
          city: string | null
          country: string
          created_at: string
          id: string
          phone: string | null
          postal_code: string | null
          terms_agreed: boolean
          updated_at: string
          user_id: string
          website: string | null
          withdrawal_waived: boolean
        }
        Insert: {
          address?: string | null
          bio?: string | null
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          phone?: string | null
          postal_code?: string | null
          terms_agreed?: boolean
          updated_at?: string
          user_id: string
          website?: string | null
          withdrawal_waived?: boolean
        }
        Update: {
          address?: string | null
          bio?: string | null
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          phone?: string | null
          postal_code?: string | null
          terms_agreed?: boolean
          updated_at?: string
          user_id?: string
          website?: string | null
          withdrawal_waived?: boolean
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          admin_notes: string | null
          attachments: Json | null
          category: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_user_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          attachments?: Json | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_user_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_user_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_security_events: {
        Row: {
          created_at: string
          device_info: Json | null
          event_description: string
          event_type: string
          id: string
          ip_address: unknown
          is_suspicious: boolean
          location: Json | null
          metadata: Json | null
          risk_level: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          event_description: string
          event_type: string
          id?: string
          ip_address?: unknown
          is_suspicious?: boolean
          location?: Json | null
          metadata?: Json | null
          risk_level?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          event_description?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          is_suspicious?: boolean
          location?: Json | null
          metadata?: Json | null
          risk_level?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          last_activity: string
          session_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_activity?: string
          session_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_activity?: string
          session_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_logout: boolean
          created_at: string
          email_notifications: boolean
          id: string
          language: string
          marketing_emails: boolean
          newsletter_subscription: boolean
          push_notifications: boolean
          session_timeout_minutes: number
          theme: string
          timezone: string
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_logout?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          language?: string
          marketing_emails?: boolean
          newsletter_subscription?: boolean
          push_notifications?: boolean
          session_timeout_minutes?: number
          theme?: string
          timezone?: string
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_logout?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          language?: string
          marketing_emails?: boolean
          newsletter_subscription?: boolean
          push_notifications?: boolean
          session_timeout_minutes?: number
          theme?: string
          timezone?: string
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_strikes: {
        Row: {
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          issued_by: string
          reason: string
          revoked_at: string | null
          revoked_by: string | null
          strike_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          issued_by: string
          reason: string
          revoked_at?: string | null
          revoked_by?: string | null
          strike_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          issued_by?: string
          reason?: string
          revoked_at?: string | null
          revoked_by?: string | null
          strike_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscription_history: {
        Row: {
          amount: number
          auto_renew: boolean
          billing_cycle: string
          created_at: string
          currency: string
          ended_at: string | null
          id: string
          metadata: Json | null
          payment_method_id: string | null
          payment_provider: string
          plan_name: string
          provider_subscription_id: string | null
          started_at: string
          status: string
          subscription_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          auto_renew?: boolean
          billing_cycle: string
          created_at?: string
          currency?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          payment_method_id?: string | null
          payment_provider?: string
          plan_name: string
          provider_subscription_id?: string | null
          started_at: string
          status?: string
          subscription_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auto_renew?: boolean
          billing_cycle?: string
          created_at?: string
          currency?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          payment_method_id?: string | null
          payment_provider?: string
          plan_name?: string
          provider_subscription_id?: string | null
          started_at?: string
          status?: string
          subscription_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscription_history_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "user_payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          billing_cycle: string
          category: string
          cost: number
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          next_billing_date: string | null
          notes: string | null
          service_type: string
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          billing_cycle: string
          category: string
          cost: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          next_billing_date?: string | null
          notes?: string | null
          service_type?: string
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          billing_cycle?: string
          category?: string
          cost?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          next_billing_date?: string | null
          notes?: string | null
          service_type?: string
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      user_suspensions: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          issued_by: string
          lifted_at: string | null
          lifted_by: string | null
          reason: string
          start_date: string
          suspension_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          issued_by: string
          lifted_at?: string | null
          lifted_by?: string | null
          reason: string
          start_date?: string
          suspension_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          issued_by?: string
          lifted_at?: string | null
          lifted_by?: string | null
          reason?: string
          start_date?: string
          suspension_type?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_configs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          provider: string
          secret_key: string | null
          updated_at: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          provider: string
          secret_key?: string | null
          updated_at?: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          provider?: string
          secret_key?: string | null
          updated_at?: string
          webhook_url?: string
        }
        Relationships: []
      }
      webinar_leads: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          metadata: Json | null
          notes: string | null
          phone: string | null
          source_id: string | null
          status: string | null
          updated_at: string | null
          webinar_date: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          source_id?: string | null
          status?: string | null
          updated_at?: string | null
          webinar_date?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          source_id?: string | null
          status?: string | null
          updated_at?: string | null
          webinar_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webinar_leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "crm_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          admin_id: string | null
          content: string
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "booking_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          wishlist_item_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          wishlist_item_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          wishlist_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_comments_wishlist_item_id_fkey"
            columns: ["wishlist_item_id"]
            isOneToOne: false
            referencedRelation: "community_wishlist"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: string
          user_id: string
          wishlist_item_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          user_id: string
          wishlist_item_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          user_id?: string
          wishlist_item_id?: string
        }
        Relationships: []
      }
      wishlist_votes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          wishlist_item_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          wishlist_item_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          wishlist_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_votes_wishlist_item_id_fkey"
            columns: ["wishlist_item_id"]
            isOneToOne: false
            referencedRelation: "community_wishlist"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_confirmations: {
        Row: {
          acknowledged_at: string | null
          admin_notes: string | null
          admin_processed_at: string | null
          admin_processed_by: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          city: string | null
          confirmed_at: string | null
          country: string | null
          created_at: string
          document_version: string | null
          email: string | null
          first_name: string | null
          house_number: string | null
          id: string
          ip_address: unknown
          last_name: string | null
          metadata: Json | null
          phone: string | null
          postal_code: string | null
          previous_role: string | null
          previous_subscription: string | null
          status: string
          street: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
          video_completed_at: string | null
          video_watch_duration: number | null
          video_watched: boolean | null
        }
        Insert: {
          acknowledged_at?: string | null
          admin_notes?: string | null
          admin_processed_at?: string | null
          admin_processed_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          city?: string | null
          confirmed_at?: string | null
          country?: string | null
          created_at?: string
          document_version?: string | null
          email?: string | null
          first_name?: string | null
          house_number?: string | null
          id?: string
          ip_address?: unknown
          last_name?: string | null
          metadata?: Json | null
          phone?: string | null
          postal_code?: string | null
          previous_role?: string | null
          previous_subscription?: string | null
          status?: string
          street?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
          video_completed_at?: string | null
          video_watch_duration?: number | null
          video_watched?: boolean | null
        }
        Update: {
          acknowledged_at?: string | null
          admin_notes?: string | null
          admin_processed_at?: string | null
          admin_processed_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          city?: string | null
          confirmed_at?: string | null
          country?: string | null
          created_at?: string
          document_version?: string | null
          email?: string | null
          first_name?: string | null
          house_number?: string | null
          id?: string
          ip_address?: unknown
          last_name?: string | null
          metadata?: Json | null
          phone?: string | null
          postal_code?: string | null
          previous_role?: string | null
          previous_subscription?: string | null
          status?: string
          street?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
          video_completed_at?: string | null
          video_watch_duration?: number | null
          video_watched?: boolean | null
        }
        Relationships: []
      }
      xboard_configs: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      products_public: {
        Row: {
          color_gradient: string | null
          created_at: string | null
          description: string | null
          external_type: string | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          product_type: string | null
          slug: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color_gradient?: string | null
          created_at?: string | null
          description?: string | null
          external_type?: string | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          product_type?: string | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color_gradient?: string | null
          created_at?: string | null
          description?: string | null
          external_type?: string | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          product_type?: string | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_affiliate_with_confidence: {
        Args: {
          p_browser_fingerprint?: string
          p_session_id?: string
          p_user_id: string
          p_visitor_ip?: unknown
        }
        Returns: Json
      }
      can_access_affiliate: { Args: { _user_id: string }; Returns: boolean }
      can_moderate: { Args: { _user_id: string }; Returns: boolean }
      can_moderate_community: { Args: { _user_id: string }; Returns: boolean }
      check_login_rate_limit: {
        Args: {
          client_ip?: unknown
          max_attempts?: number
          user_email: string
          window_minutes?: number
        }
        Returns: boolean
      }
      check_password_reset_rate_limit: {
        Args: {
          client_ip?: unknown
          max_attempts?: number
          user_email: string
          window_minutes?: number
        }
        Returns: boolean
      }
      check_user_email_verification: {
        Args: { user_email: string }
        Returns: {
          email: string
          email_confirmed_at: string
          is_verified: boolean
          profile_active: boolean
          profile_exists: boolean
          profile_username: string
          user_id: string
        }[]
      }
      cleanup_expired_social_posts: { Args: never; Returns: Json }
      cleanup_old_rate_limit_records: { Args: never; Returns: undefined }
      create_default_user_settings: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      deactivate_outdated_premium_categories: { Args: never; Returns: number }
      email_has_account_type: {
        Args: { p_account_type: string; p_email: string }
        Returns: boolean
      }
      find_user_by_email_or_username: {
        Args: { identifier: string }
        Returns: {
          email: string
          user_id: string
          username: string
        }[]
      }
      generate_invoice_number: { Args: never; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      get_admin_by_user_id: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          description: string
          email: string
          id: string
          is_active: boolean
          name: string
          role: string
          user_id: string
        }[]
      }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_affiliate_stats: {
        Args: { affiliate_user_id: string }
        Returns: {
          conversion_rate: number
          paid_commission: number
          pending_commission: number
          this_month_earnings: number
          total_earned: number
          total_transactions: number
        }[]
      }
      get_primary_account_type: { Args: { p_user_id: string }; Returns: string }
      get_profiles_brief: {
        Args: { _ids: string[] }
        Returns: {
          email: string
          first_name: string
          id: string
          last_name: string
          username: string
        }[]
      }
      get_public_advisors: {
        Args: never
        Returns: {
          description: string
          id: string
          name: string
          role: string
        }[]
      }
      get_public_usernames: {
        Args: { ids?: string[] }
        Returns: {
          id: string
          username: string
        }[]
      }
      get_ucl_community_count: { Args: never; Returns: number }
      get_user_account_types: { Args: { p_user_id: string }; Returns: string[] }
      get_user_auth_status: { Args: { user_uuid: string }; Returns: Json }
      get_user_permissions_list: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_user_subscription_status: {
        Args: { p_user_id: string }
        Returns: Json
      }
      has_any_role: {
        Args: { _roles: string[]; _user_id: string }
        Returns: boolean
      }
      has_beta_access: { Args: { _user_id: string }; Returns: boolean }
      has_exclusive_affiliate_access: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_exclusive_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_lite_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_ucl_community_access: { Args: { _user_id: string }; Returns: boolean }
      increment_affiliate_clicks: {
        Args: { p_affiliate_code_id: string }
        Returns: undefined
      }
      increment_commission_pending: {
        Args: { amount: number; code_id: string }
        Returns: number
      }
      increment_total_commission: {
        Args: { amount: number; code_id: string }
        Returns: number
      }
      is_admin_or_ceo: { Args: { _user_id: string }; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_app_admin: { Args: never; Returns: boolean }
      is_booking_admin: { Args: { _user_id: string }; Returns: boolean }
      is_community_manager: { Args: { _user_id: string }; Returns: boolean }
      is_premium_user: { Args: { _user_id: string }; Returns: boolean }
      log_admin_activity: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_severity?: string
        }
        Returns: undefined
      }
      log_password_reset_attempt: {
        Args: {
          attempt_success?: boolean
          client_ip?: unknown
          user_email: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource: string
          p_severity?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      log_user_activity: {
        Args: {
          p_action: string
          p_details?: string
          p_resource_id?: string
          p_resource_type?: string
        }
        Returns: undefined
      }
      lookup_email_by_username: {
        Args: { input_username: string }
        Returns: {
          email: string
          email_verified: boolean
          is_active: boolean
          role: string
          user_id: string
          username: string
        }[]
      }
      sync_premium_categories_from_config: { Args: never; Returns: undefined }
      uclcrmvertrieb_has_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      update_user_roles: {
        Args: { p_primary_role?: string; p_roles: string[]; p_user_id: string }
        Returns: Json
      }
      verify_admin_password: {
        Args: { p_email: string; p_password: string }
        Returns: boolean
      }
      verify_user_password: {
        Args: { p_email: string; p_password: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "ceo"
        | "moderator"
        | "affiliate"
        | "user"
        | "basic"
        | "lite"
        | "ucl_community"
        | "community_manager"
        | "beta_user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "admin",
        "ceo",
        "moderator",
        "affiliate",
        "user",
        "basic",
        "lite",
        "ucl_community",
        "community_manager",
        "beta_user",
      ],
    },
  },
} as const
