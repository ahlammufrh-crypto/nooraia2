-- Fix RLS policies to be more strict

-- Drop the overly permissive device management policy
DROP POLICY IF EXISTS "Lenders can manage their devices" ON public.devices;

-- Create stricter policies for devices
CREATE POLICY "Lenders can update and delete their own devices" 
  ON public.devices 
  FOR ALL 
  USING (auth.uid() = lender_id);

CREATE POLICY "Only users with lender role can insert devices" 
  ON public.devices 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = lender_id AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'lender')
  );

-- Drop the overly permissive bookings policy
DROP POLICY IF EXISTS "Tenants can create bookings" ON public.bookings;

-- Ensure only authenticated users can create bookings
CREATE POLICY "Authenticated users can create bookings" 
  ON public.bookings 
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = tenant_id
  );
