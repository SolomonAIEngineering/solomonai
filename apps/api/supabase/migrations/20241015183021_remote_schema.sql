ALTER TABLE public.bank_connections
ADD COLUMN IF NOT EXISTS error_details TEXT,
ADD COLUMN IF NOT EXISTS error_retries INTEGER,
ADD COLUMN IF NOT EXISTS last_cursor_sync TEXT;