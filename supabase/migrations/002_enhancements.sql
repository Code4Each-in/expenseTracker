-- ============================================================
-- Family Expense Tracker - Enhancement Migration
-- Run this in your Supabase SQL Editor AFTER 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- 1. PRIVATE EXPENSES — add is_private column
-- ============================================================

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast private/non-private filtering
CREATE INDEX IF NOT EXISTS expenses_is_private_idx ON public.expenses (is_private);

-- ============================================================
-- 2. UPDATE RLS POLICIES FOR EXPENSES
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;

-- SELECT: members see only their own non-private; admins see everything
CREATE POLICY "expenses_select"
  ON public.expenses FOR SELECT
  USING (
    (NOT is_private AND created_by = auth.uid())
    OR public.is_admin()
  );

-- INSERT: members can only create non-private; admins can set either
CREATE POLICY "expenses_insert"
  ON public.expenses FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND (NOT is_private OR public.is_admin())
  );

-- UPDATE: members can update their own non-private; admins can update any
CREATE POLICY "expenses_update"
  ON public.expenses FOR UPDATE
  USING (
    (NOT is_private AND created_by = auth.uid())
    OR public.is_admin()
  );

-- DELETE: same as update
CREATE POLICY "expenses_delete"
  ON public.expenses FOR DELETE
  USING (
    (NOT is_private AND created_by = auth.uid())
    OR public.is_admin()
  );

-- ============================================================
-- 3. RECREATE VIEWS WITH security_invoker = true
--    This ensures RLS on the underlying tables is respected
--    by the calling user's context, not the view owner's.
-- ============================================================

DROP VIEW IF EXISTS public.expenses_with_details;
DROP VIEW IF EXISTS public.monthly_category_totals;

CREATE VIEW public.expenses_with_details
WITH (security_invoker = true)
AS
SELECT
  e.id,
  e.amount,
  e.description,
  e.expense_date,
  e.receipt_url,
  e.created_by,
  e.is_private,
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

CREATE VIEW public.monthly_category_totals
WITH (security_invoker = true)
AS
SELECT
  DATE_TRUNC('month', expense_date)::DATE AS month,
  is_private,
  category_id,
  c.name  AS category_name,
  c.icon  AS category_icon,
  c.color AS category_color,
  SUM(amount)   AS total_amount,
  COUNT(*)      AS expense_count
FROM public.expenses e
JOIN public.categories c ON c.id = e.category_id
GROUP BY 1, 2, 3, 4, 5, 6;

-- ============================================================
-- 4. ADD BLINKIT CATEGORY
-- ============================================================

INSERT INTO public.categories (name, icon, color, sort_order)
VALUES ('Blinkit', '🛍️', '#FBBF24', 10)
ON CONFLICT (name) DO NOTHING;
