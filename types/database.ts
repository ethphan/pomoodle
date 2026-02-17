export type SessionStatus = 'created' | 'running' | 'paused' | 'completed' | 'canceled';

export type PomodoroSessionRow = {
  id: string;
  user_id: string;
  title: string;
  planned_duration_sec: number;
  status: SessionStatus;
  started_at: string | null;
  last_resumed_at: string | null;
  paused_total_sec: number;
  completed_at: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      pomodoro_sessions: {
        Row: PomodoroSessionRow;
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          planned_duration_sec?: number;
          status?: SessionStatus;
          started_at?: string | null;
          last_resumed_at?: string | null;
          paused_total_sec?: number;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          planned_duration_sec?: number;
          status?: SessionStatus;
          started_at?: string | null;
          last_resumed_at?: string | null;
          paused_total_sec?: number;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          timezone: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          timezone?: string;
        };
        Update: {
          display_name?: string | null;
          timezone?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
