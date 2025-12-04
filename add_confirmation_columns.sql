-- Add confirmation columns to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS dj_confirmed_at timestamptz;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS client_confirmed_at timestamptz;

-- Optional: Add a comment
COMMENT ON COLUMN public.events.dj_confirmed_at IS 'Timestamp when DJ confirmed the event realization';
COMMENT ON COLUMN public.events.client_confirmed_at IS 'Timestamp when Client confirmed the event realization';
