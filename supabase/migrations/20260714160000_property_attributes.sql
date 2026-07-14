-- Type-specific property fields.
-- 1) Flexible JSONB bag for attributes that vary by property type
--    (street_width, halls, floor_level, ac_system, master_rooms, ...).
--    Core fields (area_sqm, price, bedrooms, bathrooms, ...) stay as real columns.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2) New property types (aqar.fm taxonomy). ADD VALUE is append-only and
--    must run outside a transaction block; each is idempotent.
ALTER TYPE public.property_type ADD VALUE IF NOT EXISTS 'floor';
ALTER TYPE public.property_type ADD VALUE IF NOT EXISTS 'istiraha';
ALTER TYPE public.property_type ADD VALUE IF NOT EXISTS 'chalet';
ALTER TYPE public.property_type ADD VALUE IF NOT EXISTS 'house';
ALTER TYPE public.property_type ADD VALUE IF NOT EXISTS 'farm';
