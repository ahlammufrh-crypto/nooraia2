-- Add JSONB fields to support orchestration configs and connection info

ALTER TABLE public.devices
ADD COLUMN IF NOT EXISTS docker_config JSONB;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS connection_details JSONB;
