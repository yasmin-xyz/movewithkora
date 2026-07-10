ALTER TABLE public.saved_classes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.saved_classes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_classes TO authenticated;
GRANT ALL ON public.saved_classes TO service_role;

DROP POLICY IF EXISTS "Users can view their own saved classes" ON public.saved_classes;
CREATE POLICY "Users can view their own saved classes"
ON public.saved_classes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own saved classes" ON public.saved_classes;
CREATE POLICY "Users can insert their own saved classes"
ON public.saved_classes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own saved classes" ON public.saved_classes;
CREATE POLICY "Users can update their own saved classes"
ON public.saved_classes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved classes" ON public.saved_classes;
CREATE POLICY "Users can delete their own saved classes"
ON public.saved_classes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);