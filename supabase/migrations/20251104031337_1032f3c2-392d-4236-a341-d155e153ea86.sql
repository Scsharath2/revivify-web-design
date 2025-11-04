-- Add columns to store token request and response data
ALTER TABLE public.api_requests 
ADD COLUMN IF NOT EXISTS request_tokens jsonb,
ADD COLUMN IF NOT EXISTS response_tokens jsonb;