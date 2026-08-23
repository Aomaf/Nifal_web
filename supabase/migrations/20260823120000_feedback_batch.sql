-- Feedback batch: commercial halls, negotiable pricing, map link.

-- 1) New property type: صالات تجارية.
--    ADD VALUE is append-only and must run outside a transaction block.
ALTER TYPE public.property_type ADD VALUE IF NOT EXISTS 'commercial_hall';

-- 2) Negotiable price flag + pasted Google Maps link.
--    location_lat/location_lng already exist; map_url keeps the original
--    pasted link so the admin can re-open exactly what was entered.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS map_url       TEXT;
