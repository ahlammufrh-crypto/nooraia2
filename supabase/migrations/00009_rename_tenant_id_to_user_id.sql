-- Rename tenant_id to user_id in bookings table to match user requirements
ALTER TABLE public.bookings RENAME COLUMN tenant_id TO user_id;

-- Update RLS policies to use the new column name
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings 
FOR SELECT USING (
  auth.uid() = user_id 
  OR auth.uid() IN (SELECT lender_id FROM public.devices WHERE id = device_id)
);

DROP POLICY IF EXISTS "Tenants can create bookings" ON public.bookings;
CREATE POLICY "Tenants can create bookings" ON public.bookings 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
CREATE POLICY "Authenticated users can create bookings" 
  ON public.bookings 
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings"
  ON public.bookings
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT lender_id FROM public.devices WHERE id = device_id)
  );

DROP POLICY IF EXISTS "Involved users can update bookings" ON public.bookings;
CREATE POLICY "Involved users can update bookings"
  ON public.bookings
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT lender_id FROM public.devices WHERE id = device_id)
  );
