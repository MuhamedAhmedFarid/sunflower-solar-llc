
import { createClient } from '@supabase/supabase-js';
import { Client, Candidate, Recruiter } from '../types';

// Provided Supabase project credentials
const supabaseUrl = 'https://yabolqusdeqmwjwxdvsp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhYm9scXVzZGVxbXdqd3hkdnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTkxMDYsImV4cCI6MjA4MzI5NTEwNn0.Q5TJ1jt-jeRuI2PBAH7MEMPfVI2CVIj8ojMpYzfJgTI';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Define a type for the Supabase client that reflects our database schema.
// This provides type safety and autocompletion for database operations.
export type SupabaseClient = ReturnType<typeof createClient<Database>>;

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'candidates' | 'access_code' | 'recruiters'>;
        Update: Partial<Omit<Client, 'id' | 'candidates' | 'access_code' | 'recruiters'>>;
      };
      candidates: {
        Row: Candidate;
        Insert: Omit<Candidate, 'id' | 'created_at'>;
        Update: Partial<Omit<Candidate, 'id' | 'created_at'>>;
      };
      recruiters: {
        Row: Recruiter;
        Insert: Omit<Recruiter, 'id' | 'created_at'>;
        Update: Partial<Omit<Recruiter, 'id' | 'created_at'>>;
      };
      recruiter_clients: {
        Row: { recruiter_id: string; client_id: string };
        Insert: { recruiter_id: string; client_id: string };
      }
    };
    Enums: {
        candidate_status: 'Pending' | 'Texted' | 'Shortlisted' | 'Interview' | 'Interviewed' | 'Rejected' | 'Probation' | 'Training';
    }
  };
}