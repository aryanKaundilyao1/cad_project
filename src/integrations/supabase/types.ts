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
      jas_lead_requests: {
        Row: {
          id: string
          query: string
          name: string | null
          company: string | null
          email: string | null
          phone: string | null
          user_id: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          query: string
          name?: string | null
          company?: string | null
          email?: string | null
          phone?: string | null
          user_id?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          query?: string
          name?: string | null
          company?: string | null
          email?: string | null
          phone?: string | null
          user_id?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      jas_companies: {
        Row: {
          id: string
          legal_name: string
          operating_name: string | null
          primary_domain: string | null
          universal_id: string | null
          headquarters_location_id: string | null
          primary_industry: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          legal_name: string
          operating_name?: string | null
          primary_domain?: string | null
          universal_id?: string | null
          headquarters_location_id?: string | null
          primary_industry?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          legal_name?: string
          operating_name?: string | null
          primary_domain?: string | null
          universal_id?: string | null
          headquarters_location_id?: string | null
          primary_industry?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jas_contacts: {
        Row: {
          contact_id: string
          company_id: string
          first_name: string | null
          last_name: string | null
          job_title: string | null
          seniority_level: string | null
          email: string | null
          phone: string | null
          linkedin_url: string | null
          is_primary: boolean | null
          verification_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          contact_id?: string
          company_id: string
          first_name?: string | null
          last_name?: string | null
          job_title?: string | null
          seniority_level?: string | null
          email?: string | null
          phone?: string | null
          linkedin_url?: string | null
          is_primary?: boolean | null
          verification_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          company_id?: string
          first_name?: string | null
          last_name?: string | null
          job_title?: string | null
          seniority_level?: string | null
          email?: string | null
          phone?: string | null
          linkedin_url?: string | null
          is_primary?: boolean | null
          verification_status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jas_opportunities: {
        Row: {
          opportunity_id: string
          company_id: string
          title: string
          type: string
          status: string
          budget: number | null
          currency: string | null
          publish_date: string | null
          deadline_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          opportunity_id?: string
          company_id: string
          title: string
          type: string
          status?: string
          budget?: number | null
          currency?: string | null
          publish_date?: string | null
          deadline_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          opportunity_id?: string
          company_id?: string
          title?: string
          type?: string
          status?: string
          budget?: number | null
          currency?: string | null
          publish_date?: string | null
          deadline_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jas_evidence_modules: {
        Row: {
          evidence_id: string
          entity_type: string
          entity_id: string
          source_id: string | null
          module_type: string
          raw_data: Json
          extracted_at: string | null
          created_at: string
        }
        Insert: {
          evidence_id?: string
          entity_type: string
          entity_id: string
          source_id?: string | null
          module_type: string
          raw_data?: Json
          extracted_at?: string | null
          created_at?: string
        }
        Update: {
          evidence_id?: string
          entity_type?: string
          entity_id?: string
          source_id?: string | null
          module_type?: string
          raw_data?: Json
          extracted_at?: string | null
          created_at?: string
        }
      }
      jas_sources: {
        Row: {
          source_id: string
          name: string
          type: string
          reliability_weight: number
          created_at: string
          updated_at: string
        }
        Insert: {
          source_id?: string
          name: string
          type: string
          reliability_weight?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          source_id?: string
          name?: string
          type?: string
          reliability_weight?: number
          created_at?: string
          updated_at?: string
        }
      }
      jas_scores: {
        Row: {
          score_id: string
          entity_type: string
          entity_id: string
          score_version: string
          total_score: number
          intent_score: number
          fit_score: number
          timing_score: number
          score_factors: Json | null
          scored_at: string
        }
        Insert: {
          score_id?: string
          entity_type: string
          entity_id: string
          score_version?: string
          total_score?: number
          intent_score?: number
          fit_score?: number
          timing_score?: number
          score_factors?: Json | null
          scored_at?: string
        }
        Update: {
          score_id?: string
          entity_type?: string
          entity_id?: string
          score_version?: string
          total_score?: number
          intent_score?: number
          fit_score?: number
          timing_score?: number
          score_factors?: Json | null
          scored_at?: string
        }
      }

      duplicate_registry: {
        Row: {
          id: string
          record_type: string
          raw_record_id: string
          existing_record_id: string
          confidence_score: number | null
          resolution_status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          record_type: string
          raw_record_id: string
          existing_record_id: string
          confidence_score?: number | null
          resolution_status?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          record_type?: string
          raw_record_id?: string
          existing_record_id?: string
          confidence_score?: number | null
          resolution_status?: string
          notes?: string | null
          created_at?: string
        }
      }
      import_jobs: {
        Row: {
          id: string
          source_id: string | null
          status: string
          rows_fetched: number | null
          rows_processed: number | null
          rows_valid: number | null
          rows_invalid: number | null
          rows_duplicate: number | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          source_id?: string | null
          status?: string
          rows_fetched?: number | null
          rows_processed?: number | null
          rows_valid?: number | null
          rows_invalid?: number | null
          rows_duplicate?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          source_id?: string | null
          status?: string
          rows_fetched?: number | null
          rows_processed?: number | null
          rows_valid?: number | null
          rows_invalid?: number | null
          rows_duplicate?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      import_logs: {
        Row: {
          id: string
          job_id: string | null
          level: string
          message: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          level: string
          message: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string | null
          level?: string
          message?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      raw_leads: {
        Row: {
          id: string
          job_id: string | null
          company_name: string
          phone: string | null
          email: string | null
          website: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          industry: string | null
          category: string | null
          raw_json: Json
          validation_status: string
          processing_errors: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          company_name: string
          phone?: string | null
          email?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          industry?: string | null
          category?: string | null
          raw_json: Json
          validation_status?: string
          processing_errors?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string | null
          company_name?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          industry?: string | null
          category?: string | null
          raw_json?: Json
          validation_status?: string
          processing_errors?: Json | null
          created_at?: string
        }
      }
      raw_projects: {
        Row: {
          id: string
          job_id: string | null
          project_name: string
          company_name: string | null
          location: string | null
          estimated_value: number | null
          project_stage: string | null
          source_url: string | null
          evidence: string | null
          raw_json: Json
          validation_status: string
          created_at: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          project_name: string
          company_name?: string | null
          location?: string | null
          estimated_value?: number | null
          project_stage?: string | null
          source_url?: string | null
          evidence?: string | null
          raw_json: Json
          validation_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string | null
          project_name?: string
          company_name?: string | null
          location?: string | null
          estimated_value?: number | null
          project_stage?: string | null
          source_url?: string | null
          evidence?: string | null
          raw_json?: Json
          validation_status?: string
          created_at?: string
        }
      }
      raw_tenders: {
        Row: {
          id: string
          job_id: string | null
          tender_title: string
          authority: string | null
          category: string | null
          location: string | null
          tender_value: number | null
          submission_date: string | null
          source_url: string | null
          raw_json: Json
          validation_status: string
          created_at: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          tender_title: string
          authority?: string | null
          category?: string | null
          location?: string | null
          tender_value?: number | null
          submission_date?: string | null
          source_url?: string | null
          raw_json: Json
          validation_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string | null
          tender_title?: string
          authority?: string | null
          category?: string | null
          location?: string | null
          tender_value?: number | null
          submission_date?: string | null
          source_url?: string | null
          raw_json?: Json
          validation_status?: string
          created_at?: string
        }
      }
      source_registry: {
        Row: {
          id: string
          name: string
          source_type: string
          status: string
          api_endpoint: string | null
          cron_schedule: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          source_type: string
          status?: string
          api_endpoint?: string | null
          cron_schedule?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          source_type?: string
          status?: string
          api_endpoint?: string | null
          cron_schedule?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          lead_id: string | null
          organizer_id: string | null
          attendee_id: string | null
          bid_id: string | null
          scheduled_at: string
          status: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lead_id?: string | null
          organizer_id?: string | null
          attendee_id?: string | null
          bid_id?: string | null
          scheduled_at: string
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string | null
          organizer_id?: string | null
          attendee_id?: string | null
          bid_id?: string | null
          scheduled_at?: string
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          }
        ]
      project_invites: {
        Row: {
          id: string
          project_id: string
          invited_by: string
          invited_email: string | null
          invite_token: string
          status: string | null
          created_at: string | null
          accepted_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          invited_by: string
          invited_email?: string | null
          invite_token?: string
          status?: string | null
          created_at?: string | null
          accepted_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          invited_by?: string
          invited_email?: string | null
          invite_token?: string
          status?: string | null
          created_at?: string | null
          accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_invites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: string | null
          joined_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: string | null
          joined_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: string | null
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          lead_id: string | null
          client_id: string | null
          title: string
          location: string | null
          budget: number | null
          description: string | null
          category: string | null
          status: string | null
          start_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lead_id?: string | null
          client_id?: string | null
          title: string
          location?: string | null
          budget?: number | null
          description?: string | null
          category?: string | null
          status?: string | null
          start_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string | null
          client_id?: string | null
          title?: string
          location?: string | null
          budget?: number | null
          description?: string | null
          category?: string | null
          status?: string | null
          start_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_vendors: {
        Row: {
          project_id: string
          vendor_id: string
          created_at: string | null
        }
        Insert: {
          project_id: string
          vendor_id: string
          created_at?: string | null
        }
        Update: {
          project_id?: string
          vendor_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_vendors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_phases: {
        Row: {
          id: string
          project_id: string | null
          title: string
          start_date: string | null
          end_date: string | null
          status: string | null
          order_index: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          title: string
          start_date?: string | null
          end_date?: string | null
          status?: string | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          title?: string
          start_date?: string | null
          end_date?: string | null
          status?: string | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      project_tasks: {
        Row: {
          id: string
          phase_id: string | null
          title: string
          is_completed: boolean | null
          assignee_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          phase_id?: string | null
          title: string
          is_completed?: boolean | null
          assignee_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          phase_id?: string | null
          title?: string
          is_completed?: boolean | null
          assignee_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_payments: {
        Row: {
          id: string
          project_id: string | null
          amount: number
          description: string | null
          date: string | null
          created_at: string | null
          paid_by: string | null
          payment_type: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          amount: number
          description?: string | null
          date?: string | null
          created_at?: string | null
          paid_by?: string | null
          payment_type?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          amount?: number
          description?: string | null
          date?: string | null
          created_at?: string | null
          paid_by?: string | null
          payment_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_payments_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          subscribed_at: string | null
        }
        Insert: {
          id?: string
          email: string
          subscribed_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          subscribed_at?: string | null
        }
        Relationships: []
      }
      project_materials: {
        Row: {
          id: string
          project_id: string | null
          name: string
          quantity: number
          cost: number
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          name: string
          quantity: number
          cost: number
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          name?: string
          quantity?: number
          cost?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      project_messages: {
        Row: {
          id: string
          project_id: string | null
          sender_id: string | null
          content: string
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          sender_id?: string | null
          content: string
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          sender_id?: string | null
          content?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      bids: {
        Row: {
          bid_amount: number
          bidder_id: string
          completion_time: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          lead_id: string
          proposal: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bid_amount: number
          bidder_id: string
          completion_time?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          proposal?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bid_amount?: number
          bidder_id?: string
          completion_time?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          proposal?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_primary: boolean | null
          lead_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          lead_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_images_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_pricing: {
        Row: {
          base_price: number | null
          created_at: string | null
          demand_multiplier: number | null
          final_price: number | null
          id: string
          lead_id: string | null
        }
        Insert: {
          base_price?: number | null
          created_at?: string | null
          demand_multiplier?: number | null
          final_price?: number | null
          id?: string
          lead_id?: string | null
        }
        Update: {
          base_price?: number | null
          created_at?: string | null
          demand_multiplier?: number | null
          final_price?: number | null
          id?: string
          lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_pricing_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_unlocks: {
        Row: {
          amount_paid: number
          company_id: string | null
          id: string
          lead_id: string | null
          unlocked_at: string | null
        }
        Insert: {
          amount_paid: number
          company_id?: string | null
          id?: string
          lead_id?: string | null
          unlocked_at?: string | null
        }
        Update: {
          amount_paid?: number
          company_id?: string | null
          id?: string
          lead_id?: string | null
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_unlocks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_unlocks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_leads: {
        Row: {
          id: string
          user_id: string
          lead_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          lead_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          lead_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          allow_bidding: boolean | null
          bid_deadline: string | null
          budget_max: number | null
          budget_min: number | null
          category: string | null
          crane_required: boolean | null
          created_at: string | null
          deposit_amount: number | null
          deposit_status: string | null
          description: string | null
          fire_compliance: string | null
          height: number | null
          id: string
          insulation: boolean | null
          is_premium: boolean | null
          is_tender: boolean | null
          is_verified: boolean | null
          land_ownership: string | null
          location: string
          max_bidders: number | null
          mezzanine: boolean | null
          plan_type: string | null
          premium_price: number | null
          project_type: string
          seller_id: string
          soil_condition: string | null
          span_width: number | null
          status: string | null
          technical_notes: string | null
          tender_end_date: string | null
          timeline: string | null
          title: string
          total_area: number | null
          updated_at: string | null
          urgency: string | null
          views: number | null
          source_type: string | null
          external_company_name: string | null
          external_contact_name: string | null
          external_phone: string | null
          external_email: string | null
          external_website: string | null
          industry_id: string | null
          company_size: string | null
          lead_source: string | null
          website: string | null
          decision_maker_name: string | null
          decision_maker_title: string | null
          // B2B directory columns (added by lead_import migration)
          company_name: string | null
          contact_name: string | null
          designation: string | null
          email: string | null
          phone: string | null
          whatsapp: string | null
          linkedin_url: string | null
          industry: string | null
          niche: string | null
          sub_niche: string | null
          business_type: string | null
          employee_count: string | null
          revenue_range: string | null
          funding_stage: string | null
          technologies: string | null
          country: string | null
          state: string | null
          city: string | null
          address: string | null
          tags: string[] | null
          source: string | null
          source_file: string | null
          verification_status: string | null
          intent_score: number | null
          ai_relevance_score: number | null
          uploaded_by: string | null
          upload_batch_id: string | null
          lead_status: string | null
          // Scoring columns (added by lead_quality migration)
          quality_score: number | null
          lead_score: number | null
          view_count: number | null
          unlock_count: number | null
          intent_level: string | null
          intent_type: string | null
          intent_reasons: any | null
          company_summary: string | null
          last_ai_analysis: string | null
          trust_score: number | null
          risk_score: number | null
          duplicate_status: string | null
          spam_flag: boolean | null
          ai_analysis: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          admin_notes: string | null
          // Lead number for display
          lead_number: number | null
          subcategory_id: string | null
          metadata: Json | null
        }
        Insert: {
          allow_bidding?: boolean | null
          bid_deadline?: string | null
          budget_max?: number | null
          budget_min?: number | null
          category?: string | null
          crane_required?: boolean | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_status?: string | null
          description?: string | null
          fire_compliance?: string | null
          height?: number | null
          id?: string
          insulation?: boolean | null
          is_premium?: boolean | null
          is_tender?: boolean | null
          is_verified?: boolean | null
          land_ownership?: string | null
          location: string
          max_bidders?: number | null
          mezzanine?: boolean | null
          plan_type?: string | null
          premium_price?: number | null
          project_type: string
          seller_id: string
          soil_condition?: string | null
          span_width?: number | null
          status?: string | null
          technical_notes?: string | null
          tender_end_date?: string | null
          timeline?: string | null
          title: string
          total_area?: number | null
          updated_at?: string | null
          urgency?: string | null
          views?: number | null
          source_type?: string | null
          external_company_name?: string | null
          external_contact_name?: string | null
          external_phone?: string | null
          external_email?: string | null
          external_website?: string | null
          industry_id?: string | null
          company_size?: string | null
          lead_source?: string | null
          website?: string | null
          decision_maker_name?: string | null
          decision_maker_title?: string | null
          company_name?: string | null
          contact_name?: string | null
          designation?: string | null
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          linkedin_url?: string | null
          industry?: string | null
          niche?: string | null
          sub_niche?: string | null
          business_type?: string | null
          employee_count?: string | null
          revenue_range?: string | null
          funding_stage?: string | null
          technologies?: string | null
          country?: string | null
          state?: string | null
          city?: string | null
          address?: string | null
          tags?: string[] | null
          source?: string | null
          source_file?: string | null
          verification_status?: string | null
          intent_score?: number | null
          ai_relevance_score?: number | null
          uploaded_by?: string | null
          upload_batch_id?: string | null
          lead_status?: string | null
          quality_score?: number | null
          lead_score?: number | null
          intent_level?: string | null
          intent_type?: string | null
          intent_reasons?: any | null
          company_summary?: string | null
          last_ai_analysis?: string | null
          trust_score?: number | null
          risk_score?: number | null
          duplicate_status?: string | null
          spam_flag?: boolean | null
          ai_analysis?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          admin_notes?: string | null
          lead_number?: number | null
          subcategory_id?: string | null
          metadata?: Json | null
        }
        Update: {
          allow_bidding?: boolean | null
          bid_deadline?: string | null
          budget_max?: number | null
          budget_min?: number | null
          category?: string | null
          crane_required?: boolean | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_status?: string | null
          description?: string | null
          fire_compliance?: string | null
          height?: number | null
          id?: string
          insulation?: boolean | null
          is_premium?: boolean | null
          is_tender?: boolean | null
          is_verified?: boolean | null
          land_ownership?: string | null
          location?: string
          max_bidders?: number | null
          mezzanine?: boolean | null
          plan_type?: string | null
          premium_price?: number | null
          project_type?: string
          seller_id?: string
          soil_condition?: string | null
          span_width?: number | null
          status?: string | null
          technical_notes?: string | null
          tender_end_date?: string | null
          timeline?: string | null
          title?: string
          total_area?: number | null
          updated_at?: string | null
          urgency?: string | null
          views?: number | null
          source_type?: string | null
          external_company_name?: string | null
          external_contact_name?: string | null
          external_phone?: string | null
          external_email?: string | null
          external_website?: string | null
          industry_id?: string | null
          company_size?: string | null
          lead_source?: string | null
          website?: string | null
          decision_maker_name?: string | null
          decision_maker_title?: string | null
          company_name?: string | null
          contact_name?: string | null
          designation?: string | null
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          linkedin_url?: string | null
          industry?: string | null
          niche?: string | null
          sub_niche?: string | null
          business_type?: string | null
          employee_count?: string | null
          revenue_range?: string | null
          funding_stage?: string | null
          technologies?: string | null
          country?: string | null
          state?: string | null
          city?: string | null
          address?: string | null
          tags?: string[] | null
          source?: string | null
          source_file?: string | null
          verification_status?: string | null
          intent_score?: number | null
          ai_relevance_score?: number | null
          uploaded_by?: string | null
          upload_batch_id?: string | null
          lead_status?: string | null
          quality_score?: number | null
          lead_score?: number | null
          intent_level?: string | null
          intent_type?: string | null
          intent_reasons?: any | null
          company_summary?: string | null
          last_ai_analysis?: string | null
          trust_score?: number | null
          risk_score?: number | null
          duplicate_status?: string | null
          spam_flag?: boolean | null
          ai_analysis?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          admin_notes?: string | null
          lead_number?: number | null
          subcategory_id?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          lead_id: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          lead_id?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          lead_id?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_cycle: string | null
          business_type: string | null
          certifications: string | null
          company_address: string | null
          company_name: string | null
          created_at: string | null
          description: string | null
          email: string
          full_name: string | null
          gst_number: string | null
          headquarters_location: string | null
          id: string
          is_verified: boolean | null
          monthly_unlocks_used: number
          next_plan: string | null
          pan_number: string | null
          phone: string | null
          portfolio_url: string | null
          rating: number | null
          subscription_expires_at: string | null
          subscription_plan: string | null
          total_reviews: number | null
          unlock_cycle_start: string | null
          updated_at: string | null
          user_id: string
          user_type: string
          years_experience: number | null
          years_operation: number | null
        }
        Insert: {
          avatar_url?: string | null
          billing_cycle?: string | null
          business_type?: string | null
          certifications?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          email: string
          full_name?: string | null
          gst_number?: string | null
          headquarters_location?: string | null
          id?: string
          is_verified?: boolean | null
          monthly_unlocks_used?: number
          next_plan?: string | null
          pan_number?: string | null
          phone?: string | null
          portfolio_url?: string | null
          rating?: number | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          total_reviews?: number | null
          unlock_cycle_start?: string | null
          updated_at?: string | null
          user_id: string
          user_type: string
          years_experience?: number | null
          years_operation?: number | null
        }
        Update: {
          avatar_url?: string | null
          billing_cycle?: string | null
          business_type?: string | null
          certifications?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string
          full_name?: string | null
          gst_number?: string | null
          headquarters_location?: string | null
          id?: string
          is_verified?: boolean | null
          monthly_unlocks_used?: number
          next_plan?: string | null
          pan_number?: string | null
          phone?: string | null
          portfolio_url?: string | null
          rating?: number | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          total_reviews?: number | null
          unlock_cycle_start?: string | null
          updated_at?: string | null
          user_id?: string
          user_type?: string
          years_experience?: number | null
          years_operation?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          billing_cycle: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          payment_id: string | null
          plan: string | null
          profile_id: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          billing_cycle?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          plan?: string | null
          profile_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          billing_cycle?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          plan?: string | null
          profile_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_ai_scores: {
        Row: {
          created_at: string | null
          final_score: number | null
          id: string
          lead_id: string | null
          portfolio_score: number | null
          price_score: number | null
          rating_score: number | null
          timeline_score: number | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          final_score?: number | null
          id?: string
          lead_id?: string | null
          portfolio_score?: number | null
          price_score?: number | null
          rating_score?: number | null
          timeline_score?: number | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          final_score?: number | null
          id?: string
          lead_id?: string | null
          portfolio_score?: number | null
          price_score?: number | null
          rating_score?: number | null
          timeline_score?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_ai_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_ai_scores_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_project_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vendor_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          project_location: string | null
          project_value: number | null
          title: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          project_location?: string | null
          project_value?: number | null
          title: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          project_location?: string | null
          project_value?: number | null
          title?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_projects_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_reviews: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          rating: number | null
          review: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          rating?: number | null
          review?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          rating?: number | null
          review?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_reviews_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_stats: {
        Row: {
          avg_rating: number | null
          completed_projects: number | null
          response_rate: number | null
          total_projects: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          avg_rating?: number | null
          completed_projects?: number | null
          response_rate?: number | null
          total_projects?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          avg_rating?: number | null
          completed_projects?: number | null
          response_rate?: number | null
          total_projects?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_stats_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_free_leads: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          lead_id: string | null
          max_free_unlocks: number | null
          unlocks_used: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          lead_id?: string | null
          max_free_unlocks?: number | null
          unlocks_used?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          lead_id?: string | null
          max_free_unlocks?: number | null
          unlocks_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_free_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_tracking: {
        Row: {
          id: string
          lead_id: string | null
          sender_id: string | null
          resend_id: string | null
          subject: string | null
          body: string | null
          status: string | null
          opened_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          lead_id?: string | null
          sender_id?: string | null
          resend_id?: string | null
          subject?: string | null
          body?: string | null
          status?: string | null
          opened_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string | null
          sender_id?: string | null
          resend_id?: string | null
          subject?: string | null
          body?: string | null
          status?: string | null
          opened_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_tracking_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      crm_leads: {
        Row: {
          id: string
          assigned_to: string | null
          assigned_by: string | null
          source_type: string
          source_origin: string | null
          name: string
          phone: string | null
          email: string | null
          company: string | null
          location: string | null
          requirement: string | null
          status: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          assigned_to?: string | null
          assigned_by?: string | null
          source_type: string
          source_origin?: string | null
          name: string
          phone?: string | null
          email?: string | null
          company?: string | null
          location?: string | null
          requirement?: string | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          assigned_to?: string | null
          assigned_by?: string | null
          source_type?: string
          source_origin?: string | null
          name?: string
          phone?: string | null
          email?: string | null
          company?: string | null
          location?: string | null
          requirement?: string | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      quota_tracking: {
        Row: {
          id: string
          user_id: string
          month: string
          plan_name: string | null
          quota_limit: number | null
          delivered: number | null
          extra_purchased: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          plan_name?: string | null
          quota_limit?: number | null
          delivered?: number | null
          extra_purchased?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          plan_name?: string | null
          quota_limit?: number | null
          delivered?: number | null
          extra_purchased?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quota_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      lead_logs: {
        Row: {
          id: string
          crm_lead_id: string | null
          action: string
          performed_by: string | null
          details: Record<string, any> | null
          created_at: string | null
        }
        Insert: {
          id?: string
          crm_lead_id?: string | null
          action: string
          performed_by?: string | null
          details?: Record<string, any> | null
          created_at?: string | null
        }
        Update: {
          id?: string
          crm_lead_id?: string | null
          action?: string
          performed_by?: string | null
          details?: Record<string, any> | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_logs_crm_lead_id_fkey"
            columns: ["crm_lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      industry_fields: {
        Row: {
          id: string
          industry_id: string
          field_name: string
          field_label: string
          field_type: string
          required: boolean | null
          display_order: number | null
          options: Json | null
          placeholder: string | null
          validation_rules: Json | null
          section_name: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          industry_id: string
          field_name: string
          field_label: string
          field_type: string
          required?: boolean | null
          display_order?: number | null
          options?: Json | null
          placeholder?: string | null
          validation_rules?: Json | null
          section_name?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          industry_id?: string
          field_name?: string
          field_label?: string
          field_type?: string
          required?: boolean | null
          display_order?: number | null
          options?: Json | null
          placeholder?: string | null
          validation_rules?: Json | null
          section_name?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "industry_fields_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          }
        ]
      }
      lead_entities: {
        Row: {
          id: string
          lead_id: string
          entity_type: string
          name: string | null
          address: string | null
          area: string | null
          contact_person: string | null
          designation: string | null
          mobile: string | null
          email: string | null
          office_email: string | null
          location: string | null
          district: string | null
          state: string | null
          pincode: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          entity_type: string
          name?: string | null
          address?: string | null
          area?: string | null
          contact_person?: string | null
          designation?: string | null
          mobile?: string | null
          email?: string | null
          office_email?: string | null
          location?: string | null
          district?: string | null
          state?: string | null
          pincode?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          entity_type?: string
          name?: string | null
          address?: string | null
          area?: string | null
          contact_person?: string | null
          designation?: string | null
          mobile?: string | null
          email?: string | null
          office_email?: string | null
          location?: string | null
          district?: string | null
          state?: string | null
          pincode?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_entities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          }
        ]
      }
      industries: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          color: string | null
          is_active: boolean | null
          display_order: number | null
          lead_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_active?: boolean | null
          display_order?: number | null
          lead_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_active?: boolean | null
          display_order?: number | null
          lead_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          is_active: boolean | null
          display_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          is_active?: boolean | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          is_active?: boolean | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      industry_categories: {
        Row: {
          id: string
          industry_id: string
          category_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          industry_id: string
          category_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          industry_id?: string
          category_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "industry_categories_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "industry_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
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
