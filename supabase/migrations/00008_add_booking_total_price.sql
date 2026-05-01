-- Add total_price column to bookings table for tracking rental cost
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2);
