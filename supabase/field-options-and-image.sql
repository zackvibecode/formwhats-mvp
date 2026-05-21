-- =========================================================================
-- FormWhats: dropdown options + per-field image URL
-- =========================================================================
-- Adds two columns to public.form_fields:
--   * options_json -- JSONB array of option labels for dropdown fields.
--                    Defaults to '[]' so non-dropdown rows stay valid.
--   * image_url    -- optional URL string shown above the field label on
--                    the public form. Pasted by the form owner; no upload.
--
-- Safe to run multiple times. Uses `if not exists` so re-applying does not
-- error or destroy existing data.
-- =========================================================================

alter table public.form_fields
add column if not exists options_json jsonb default '[]'::jsonb;

alter table public.form_fields
add column if not exists image_url text;

-- (Optional) ensure the default applies to existing rows that were created
-- before this column existed. JSONB default is per-row at insert time, so
-- backfill nulls just in case.
update public.form_fields
set options_json = '[]'::jsonb
where options_json is null;
