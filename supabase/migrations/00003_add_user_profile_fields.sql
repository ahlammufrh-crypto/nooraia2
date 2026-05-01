ALTER TABLE public.users
ADD COLUMN full_name TEXT,
ADD COLUMN bank_name TEXT,
ADD COLUMN iban TEXT,
ADD COLUMN notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN dark_mode BOOLEAN DEFAULT true;

-- Add INSERT policy so users can upsert their profile if it doesn't exist
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
