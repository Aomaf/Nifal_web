ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS sold_percentage  NUMERIC(5,2)  CHECK (sold_percentage BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS handover_date    DATE,
  ADD COLUMN IF NOT EXISTS hero_video_url   TEXT,
  ADD COLUMN IF NOT EXISTS tags             TEXT[]        NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_archived      BOOLEAN       NOT NULL DEFAULT false;

-- Exclude archived properties from public listing
DROP POLICY IF EXISTS "properties_public_published" ON public.properties;
CREATE POLICY "properties_public_published" ON public.properties
  FOR SELECT TO anon, authenticated
  USING (is_published = true AND is_archived = false);

CREATE INDEX IF NOT EXISTS idx_properties_archived ON public.properties(is_archived);
