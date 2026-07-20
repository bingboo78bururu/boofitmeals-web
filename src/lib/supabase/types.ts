export type UserRole = "member" | "coach" | "admin";
export type MealType = "breakfast" | "lunch" | "dinner";
export type GoalUnit = "body_fat_pct" | "weight_kg";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          name: string;
          class_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          name: string;
          class_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          name?: string;
          class_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          member_id: string;
          unit: GoalUnit;
          current_value: number | null;
          target_value: number | null;
          target_date: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          unit?: GoalUnit;
          current_value?: number | null;
          target_value?: number | null;
          target_date?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          unit?: GoalUnit;
          current_value?: number | null;
          target_value?: number | null;
          target_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      body_logs: {
        Row: {
          id: string;
          member_id: string;
          log_date: string;
          weight_kg: number | null;
          body_fat_pct: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          log_date: string;
          weight_kg?: number | null;
          body_fat_pct?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          log_date?: string;
          weight_kg?: number | null;
          body_fat_pct?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      coach_assignments: {
        Row: {
          member_id: string;
          coach_id: string;
          created_at: string;
        };
        Insert: {
          member_id: string;
          coach_id: string;
          created_at?: string;
        };
        Update: {
          member_id?: string;
          coach_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      missions: {
        Row: {
          id: string;
          member_id: string;
          mission_date: string;
          meal_type: MealType;
          note: string | null;
          photo_url: string | null;
          ai_score: number | null;
          ai_score_reason: string | null;
          coach_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          mission_date: string;
          meal_type?: MealType;
          note?: string | null;
          photo_url?: string | null;
          ai_score?: number | null;
          ai_score_reason?: string | null;
          coach_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          mission_date?: string;
          meal_type?: MealType;
          note?: string | null;
          photo_url?: string | null;
          ai_score?: number | null;
          ai_score_reason?: string | null;
          coach_score?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          mission_id: string;
          coach_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          coach_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          coach_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      name_taken: {
        Args: { check_name: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
