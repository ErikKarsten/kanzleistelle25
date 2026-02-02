export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          employer_id: string
          title: string
          description: string
          location: string
          employment_type: 'vollzeit' | 'teilzeit' | 'freelance' | 'praktikum'
          salary_min: number | null
          salary_max: number | null
          requirements: string[] | null
          benefits: string[] | null
          is_featured: boolean
          is_active: boolean
          expires_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          employer_id: string
          title: string
          description: string
          location: string
          employment_type: 'vollzeit' | 'teilzeit' | 'freelance' | 'praktikum'
          salary_min?: number | null
          salary_max?: number | null
          requirements?: string[] | null
          benefits?: string[] | null
          is_featured?: boolean
          is_active?: boolean
          expires_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          employer_id?: string
          title?: string
          description?: string
          location?: string
          employment_type?: 'vollzeit' | 'teilzeit' | 'freelance' | 'praktikum'
          salary_min?: number | null
          salary_max?: number | null
          requirements?: string[] | null
          benefits?: string[] | null
          is_featured?: boolean
          is_active?: boolean
          expires_at?: string | null
        }
      }
      applications: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          job_id: string
          applicant_id: string
          cover_letter: string | null
          resume_url: string | null
          status: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          job_id: string
          applicant_id: string
          cover_letter?: string | null
          resume_url?: string | null
          status?: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          job_id?: string
          applicant_id?: string
          cover_letter?: string | null
          resume_url?: string | null
          status?: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected'
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          bio: string | null
          company_name: string | null
          company_website: string | null
          is_employer: boolean
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          company_name?: string | null
          company_website?: string | null
          is_employer?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          company_name?: string | null
          company_website?: string | null
          is_employer?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      employment_type: 'vollzeit' | 'teilzeit' | 'freelance' | 'praktikum'
      application_status: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected'
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Job = Tables<'jobs'>
export type Application = Tables<'applications'>
export type Profile = Tables<'profiles'>
