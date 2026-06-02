export type UserRole = "admin" | "member";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Expense {
  id: string;
  amount: number;
  category_id: string;
  description: string | null;
  expense_date: string;
  receipt_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithDetails extends Expense {
  category_name: string;
  category_icon: string;
  category_color: string;
  member_name: string;
  member_email: string;
}

export interface MonthlyBudget {
  id: string;
  month: number;
  year: number;
  budget_amount: number;
  created_at: string;
  updated_at: string;
}

export interface MonthlyCategoryTotal {
  month: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  total_amount: number;
  expense_count: number;
}

// AI parsing result from Claude
export interface ParsedExpense {
  amount: number;
  category: string;
  description: string;
}

// Form types
export interface ExpenseFormValues {
  amount: string;
  category_id: string;
  description: string;
  expense_date: string;
}

// Dashboard summary
export interface MonthSummary {
  totalSpent: number;
  budgetAmount: number | null;
  remainingBudget: number | null;
  expenseCount: number;
  categoryTotals: MonthlyCategoryTotal[];
  recentExpenses: ExpenseWithDetails[];
}
