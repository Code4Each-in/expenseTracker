-- Milk rate configuration: current rate + full history
CREATE TABLE milk_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_per_liter NUMERIC(8, 2) NOT NULL CHECK (rate_per_liter > 0),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default rate ₹75/L (effective from start of 2024 so it covers all historical entries)
INSERT INTO
  milk_config (rate_per_liter, effective_from)
VALUES
  (75.00, '2024-01-01');

-- Daily household milk consumption entries
CREATE TABLE milk_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL,
  quantity_liters NUMERIC(6, 2) NOT NULL CHECK (quantity_liters > 0),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX milk_entries_date_idx ON milk_entries (entry_date);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_milk_entries_updated_at () RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER milk_entries_updated_at BEFORE UPDATE ON milk_entries FOR EACH ROW
EXECUTE FUNCTION update_milk_entries_updated_at ();

-- Enable RLS
ALTER TABLE milk_config ENABLE ROW LEVEL SECURITY;

ALTER TABLE milk_entries ENABLE ROW LEVEL SECURITY;

-- milk_config policies: any authenticated user can read; only admins can write
CREATE POLICY "Authenticated users can read milk config" ON milk_config FOR
SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "Admins can insert milk config" ON milk_config FOR INSERT TO authenticated
WITH
  CHECK (public.is_admin ());

CREATE POLICY "Admins can update milk config" ON milk_config FOR
UPDATE TO authenticated USING (public.is_admin ())
WITH
  CHECK (public.is_admin ());

CREATE POLICY "Admins can delete milk config" ON milk_config FOR DELETE TO authenticated USING (public.is_admin ());

-- milk_entries policies: any authenticated user can read/insert/update; only admins can delete
CREATE POLICY "Authenticated users can read milk entries" ON milk_entries FOR
SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can insert milk entries" ON milk_entries FOR INSERT TO authenticated
WITH
  CHECK (auth.uid () = created_by);

CREATE POLICY "Authenticated users can update milk entries" ON milk_entries FOR
UPDATE TO authenticated USING (TRUE)
WITH
  CHECK (TRUE);

CREATE POLICY "Admins can delete milk entries" ON milk_entries FOR DELETE TO authenticated USING (public.is_admin ());
