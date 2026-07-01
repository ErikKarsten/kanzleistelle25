-- Allow recommendations without a Supabase user account (manual matches)
ALTER TABLE public.recommendations ALTER COLUMN applicant_user_id DROP NOT NULL;
