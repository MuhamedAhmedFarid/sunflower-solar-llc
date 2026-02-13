-- Migration script to add new fields to hour_log_entries table
-- Run this in your Supabase SQL editor

-- Add new columns to hour_log_entries table
ALTER TABLE public.hour_log_entries
ADD COLUMN IF NOT EXISTS active_hours NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS number_of_sets INT DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS balance_paid NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS sets_added INT DEFAULT 0 NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.hour_log_entries.active_hours IS 'Total active hours at the time of this entry.';
COMMENT ON COLUMN public.hour_log_entries.number_of_sets IS 'Total number of sets at the time of this entry.';
COMMENT ON COLUMN public.hour_log_entries.balance_paid IS 'Balance paid amount for this entry.';
COMMENT ON COLUMN public.hour_log_entries.sets_added IS 'Sets added in this entry only (for payment: sets_added * 5).';

-- Update existing entries with default values (optional - only if you have existing data)
-- UPDATE public.hour_log_entries
-- SET active_hours = COALESCE((SELECT active_hours FROM public.candidates WHERE id = candidate_id), 0),
--     number_of_sets = COALESCE((SELECT number_of_sets FROM public.candidates WHERE id = candidate_id), 0)
-- WHERE active_hours = 0 AND number_of_sets = 0;
