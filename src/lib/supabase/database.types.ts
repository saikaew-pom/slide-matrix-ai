import type { Blueprint, BlueprintRequest } from "@/lib/blueprint-types";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProjectMaterialRow = {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  kind: string;
  size: number;
  provider: string | null;
  url: string | null;
  public_id: string | null;
  extraction_status: string | null;
  extracted_text: string | null;
  created_at: string;
};

export type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  deck_type: string;
  audience_role: string;
  communication_style: string;
  key_message: string;
  request_payload: BlueprintRequest;
  blueprint: Blueprint;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: Omit<ProjectRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProjectRow, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      project_materials: {
        Row: ProjectMaterialRow;
        Insert: Omit<ProjectMaterialRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ProjectMaterialRow, "id" | "project_id" | "user_id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
