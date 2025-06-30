// Minimal Supabase Database types placeholder.
// Replace with generated types if you run `supabase gen types` in the future.
// Keeping the shape very loose to satisfy TypeScript while avoiding `any`.
// You can expand this interface with actual table definitions as needed.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  [schema: string]: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}
