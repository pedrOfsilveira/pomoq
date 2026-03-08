export type EnergyLevel = 'green' | 'yellow' | 'red'

export interface Database {
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
          final_energy?: EnergyLevel | null
          notes?: string | null
          created_at?: string
        }
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
          created_at?: string
        }
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
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      energy_level: EnergyLevel
    }
  }
}
