/**
 * Database row types for FormWhats.
 *
 * These mirror the columns defined in `supabase/schema.sql`.
 * Update both files together whenever the schema changes.
 */

// Field types supported in the form builder UI.
export type FormFieldType =
  | "short_text"
  | "long_text"
  | "phone"
  | "email"
  | "number"
  | "date"
  | "dropdown";

// `forms` table row.
export type Form = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  whatsapp_number: string;
  is_active: boolean;
  // FK to auth.users.id (added by `supabase/auth-user-ownership.sql`).
  // Nullable to accommodate legacy rows created before the migration.
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

// `form_fields` table row.
export type FormField = {
  id: string;
  form_id: string;
  label: string;
  field_key: string;
  // Stored as text in Postgres, narrowed by the app layer.
  field_type: FormFieldType;
  required: boolean;
  sort_order: number;
  created_at: string;
};

// `responses` table row.
export type Response = {
  id: string;
  form_id: string;
  // Customer answers keyed by field id, stored as JSONB.
  data_json: Record<string, string>;
  whatsapp_message: string | null;
  submitted_at: string;
};
