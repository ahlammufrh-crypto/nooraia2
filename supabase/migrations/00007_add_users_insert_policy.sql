-- ============================================================
-- CRITICAL FIX: Add INSERT policy for public.users
-- 
-- ROOT CAUSE: RLS was enabled on public.users but only SELECT
-- and UPDATE policies existed. Without an INSERT policy, all
-- client-side inserts were silently blocked, so user rows were
-- never created after signup. This caused the role update to
-- affect 0 rows, making role selection appear broken.
-- ============================================================

-- Allow authenticated users to insert their own row
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also allow bookings to be updated by involved parties
CREATE POLICY "Involved users can update bookings"
  ON public.bookings
  FOR UPDATE
  USING (
    auth.uid() = tenant_id
    OR auth.uid() IN (SELECT lender_id FROM public.devices WHERE id = device_id)
  );
