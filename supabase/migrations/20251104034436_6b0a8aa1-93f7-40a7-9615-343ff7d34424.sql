-- Add request_message and response_message columns to api_requests table
ALTER TABLE public.api_requests 
ADD COLUMN request_message TEXT,
ADD COLUMN response_message TEXT;

-- Add index for better search performance
CREATE INDEX idx_api_requests_request_message ON public.api_requests USING gin(to_tsvector('english', request_message));
CREATE INDEX idx_api_requests_response_message ON public.api_requests USING gin(to_tsvector('english', response_message));