-- clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'individual' CHECK (type IN ('individual','company','foundation','group')),
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT,
  stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead','prospect','active','negotiation','closed','lost')),
  source TEXT,
  interest_type TEXT,
  budget NUMERIC,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  assigned_to UUID,
  next_followup_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
DROP POLICY IF EXISTS "clients_manage" ON clients;
CREATE POLICY "clients_manage" ON clients
  FOR ALL TO authenticated
  USING (public.can_manage_properties(auth.uid()))
  WITH CHECK (public.can_manage_properties(auth.uid()));

-- leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','lost')),
  assigned_to UUID,
  converted_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
DROP POLICY IF EXISTS "leads_manage" ON leads;
CREATE POLICY "leads_manage" ON leads
  FOR ALL TO authenticated
  USING (public.can_manage_properties(auth.uid()))
  WITH CHECK (public.can_manage_properties(auth.uid()));

-- units table
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor INTEGER,
  area_sqm NUMERIC,
  bedrooms SMALLINT,
  bathrooms SMALLINT,
  status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant','rented','under_maintenance')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;
DROP POLICY IF EXISTS "units_manage" ON units;
CREATE POLICY "units_manage" ON units
  FOR ALL TO authenticated
  USING (public.can_manage_properties(auth.uid()))
  WITH CHECK (public.can_manage_properties(auth.uid()));

-- tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  national_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
DROP POLICY IF EXISTS "tenants_manage" ON tenants;
CREATE POLICY "tenants_manage" ON tenants
  FOR ALL TO authenticated
  USING (public.can_manage_properties(auth.uid()))
  WITH CHECK (public.can_manage_properties(auth.uid()));

-- rental_contracts table
CREATE TABLE IF NOT EXISTS rental_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount NUMERIC NOT NULL,
  payment_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly','quarterly','biannual','annual')),
  deposit_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','expired','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT end_after_start CHECK (end_date > start_date)
);
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rental_contracts TO authenticated;
GRANT ALL ON public.rental_contracts TO service_role;
DROP POLICY IF EXISTS "rental_contracts_manage" ON rental_contracts;
CREATE POLICY "rental_contracts_manage" ON rental_contracts
  FOR ALL TO authenticated
  USING (public.can_manage_properties(auth.uid()))
  WITH CHECK (public.can_manage_properties(auth.uid()));
