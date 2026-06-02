-- ============================================================
-- Family Expense Tracker - Initial Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (mirrors auth.users, auto-created via trigger)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member'
                CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'member')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  icon        TEXT NOT NULL DEFAULT '📦',
  color       TEXT NOT NULL DEFAULT '#6B7280',
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount       NUMERIC(12, 2) NOT NULL CONSTRAINT expenses_amount_positive CHECK (amount > 0),
  category_id  UUID NOT NULL REFERENCES public.categories(id),
  description  TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url  TEXT,
  created_by   UUID NOT NULL REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monthly Budgets
CREATE TABLE IF NOT EXISTS public.monthly_budgets (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month          INTEGER NOT NULL CONSTRAINT monthly_budgets_month_check CHECK (month BETWEEN 1 AND 12),
  year           INTEGER NOT NULL CONSTRAINT monthly_budgets_year_check CHECK (year >= 2020),
  budget_amount  NUMERIC(12, 2) NOT NULL CONSTRAINT monthly_budgets_amount_positive CHECK (budget_amount > 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (month, year)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS expenses_created_by_idx    ON public.expenses (created_by);
CREATE INDEX IF NOT EXISTS expenses_category_id_idx   ON public.expenses (category_id);
CREATE INDEX IF NOT EXISTS expenses_expense_date_idx  ON public.expenses (expense_date DESC);
CREATE INDEX IF NOT EXISTS expenses_created_at_idx    ON public.expenses (created_at DESC);

-- ============================================================
-- SEED DEFAULT CATEGORIES
-- ============================================================

INSERT INTO public.categories (name, icon, color, sort_order) VALUES
  ('Food',          '🍞', '#F59E0B', 1),
  ('Fuel',          '⛽', '#EF4444', 2),
  ('Medical',       '💊', '#EC4899', 3),
  ('Shopping',      '🛒', '#8B5CF6', 4),
  ('Utilities',     '⚡', '#3B82F6', 5),
  ('Education',     '📚', '#10B981', 6),
  ('Travel',        '✈️', '#06B6D4', 7),
  ('Entertainment', '🎬', '#F97316', 8),
  ('Other',         '📦', '#6B7280', 9)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- First user becomes admin
  SELECT CASE WHEN COUNT(*) = 0 THEN 'admin' ELSE 'member' END
  INTO user_role
  FROM public.profiles;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    user_role
  );

  RETURN NEW;
END;
$$;

-- Fire handle_new_user after every new auth.users row
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on expenses
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER monthly_budgets_updated_at
  BEFORE UPDATE ON public.monthly_budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

-- Helper: is the calling user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ---------- profiles ----------
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_trigger"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- ---------- categories ----------
CREATE POLICY "categories_select_active"
  ON public.categories FOR SELECT
  USING (active = TRUE OR public.is_admin());

CREATE POLICY "categories_all_admin"
  ON public.categories FOR ALL
  USING (public.is_admin());

-- ---------- expenses ----------
CREATE POLICY "expenses_select"
  ON public.expenses FOR SELECT
  USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "expenses_insert"
  ON public.expenses FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "expenses_update"
  ON public.expenses FOR UPDATE
  USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "expenses_delete"
  ON public.expenses FOR DELETE
  USING (created_by = auth.uid() OR public.is_admin());

-- ---------- monthly_budgets ----------
CREATE POLICY "budgets_select_authenticated"
  ON public.monthly_budgets FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "budgets_all_admin"
  ON public.monthly_budgets FOR ALL
  USING (public.is_admin());

-- ============================================================
-- STORAGE BUCKET FOR RECEIPTS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  FALSE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "receipts_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "receipts_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND (
      auth.uid()::TEXT = (storage.foldername(name))[1]
      OR public.is_admin()
    )
  );

CREATE POLICY "receipts_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND (
      auth.uid()::TEXT = (storage.foldername(name))[1]
      OR public.is_admin()
    )
  );

-- ============================================================
-- VIEWS (convenient for queries)
-- ============================================================

-- Expenses with category and user info joined
CREATE OR REPLACE VIEW public.expenses_with_details AS
SELECT
  e.id,
  e.amount,
  e.description,
  e.expense_date,
  e.receipt_url,
  e.created_by,
  e.created_at,
  e.updated_at,
  c.id          AS category_id,
  c.name        AS category_name,
  c.icon        AS category_icon,
  c.color       AS category_color,
  p.full_name   AS member_name,
  p.email       AS member_email
FROM public.expenses e
JOIN public.categories c ON c.id = e.category_id
JOIN public.profiles   p ON p.id = e.created_by;

-- Monthly spending summary per category
CREATE OR REPLACE VIEW public.monthly_category_totals AS
SELECT
  DATE_TRUNC('month', expense_date)::DATE AS month,
  category_id,
  c.name  AS category_name,
  c.icon  AS category_icon,
  c.color AS category_color,
  SUM(amount)   AS total_amount,
  COUNT(*)      AS expense_count
FROM public.expenses e
JOIN public.categories c ON c.id = e.category_id
GROUP BY 1, 2, 3, 4, 5;
