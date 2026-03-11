export type EnergyLevel = 'green' | 'yellow' | 'red'
export type ErrorReason = 'attention' | 'content_gap' | 'interpretation'

export interface ErrorReviewRecord {
  questionIndex: number
  errorReason: ErrorReason
  contentNote?: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          default_questions_per_block: number
          default_disciplines: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          default_questions_per_block?: number
          default_disciplines?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          default_questions_per_block?: number
          default_disciplines?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          ended_at: string | null
          total_questions: number
          total_correct: number
          total_cycles: number
          total_answer_duration_seconds: number
          final_energy: EnergyLevel | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          ended_at?: string | null
          total_questions?: number
          total_correct?: number
          total_cycles?: number
          total_answer_duration_seconds?: number
          final_energy?: EnergyLevel | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          started_at?: string
          ended_at?: string | null
          total_questions?: number
          total_correct?: number
          total_cycles?: number
          total_answer_duration_seconds?: number
          final_energy?: EnergyLevel | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'study_sessions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      cycles: {
        Row: {
          id: string
          session_id: string
          cycle_number: number
          discipline: string
          questions_target: number
          questions_done: number
          questions_correct: number
          energy_before: EnergyLevel | null
          energy_after: EnergyLevel | null
          started_at: string
          ended_at: string | null
          break_duration_seconds: number
          answer_duration_seconds: number
          error_reviews: ErrorReviewRecord[] | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          cycle_number: number
          discipline: string
          questions_target?: number
          questions_done?: number
          questions_correct?: number
          energy_before?: EnergyLevel | null
          energy_after?: EnergyLevel | null
          started_at?: string
          ended_at?: string | null
          break_duration_seconds?: number
          answer_duration_seconds?: number
          error_reviews?: ErrorReviewRecord[] | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          cycle_number?: number
          discipline?: string
          questions_target?: number
          questions_done?: number
          questions_correct?: number
          energy_before?: EnergyLevel | null
          energy_after?: EnergyLevel | null
          started_at?: string
          ended_at?: string | null
          break_duration_seconds?: number
          answer_duration_seconds?: number
          error_reviews?: ErrorReviewRecord[] | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cycles_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'study_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      energy_checkins: {
        Row: {
          id: string
          user_id: string
          session_id: string
          cycle_id: string | null
          energy_level: EnergyLevel
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          cycle_id?: string | null
          energy_level: EnergyLevel
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          cycle_id?: string | null
          energy_level?: EnergyLevel
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'energy_checkins_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'study_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'energy_checkins_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
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
      energy_level: EnergyLevel
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
