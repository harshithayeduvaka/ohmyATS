
-- Drop existing policies that use 'public' role
DROP POLICY IF EXISTS "Users can view their own scan history" ON public.scan_history;
DROP POLICY IF EXISTS "Users can create their own scan history" ON public.scan_history;
DROP POLICY IF EXISTS "Users can delete their own scan history" ON public.scan_history;

-- Recreate with 'authenticated' role
CREATE POLICY "Users can view their own scan history"
ON public.scan_history FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scan history"
ON public.scan_history FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scan history"
ON public.scan_history FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan history"
ON public.scan_history FOR UPDATE TO authenticated
USING (auth.uid() = user_id);
