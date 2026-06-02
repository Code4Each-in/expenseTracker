"use client";

import { useState, useMemo } from "react";
import { useExpenses } from "@/lib/hooks/use-expenses";
import { useProfile } from "@/lib/hooks/use-profile";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Loader2 } from "lucide-react";
import { getCurrentMonthRange, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

type Filter = "month" | "all";

export default function ExpensesPage() {
  const { profile } = useProfile();
  const [filter, setFilter] = useState<Filter>("month");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { start, end } = getCurrentMonthRange();
  const { expenses, loading, deleteExpense } = useExpenses(
    filter === "month" ? { startDate: start, endDate: end } : {}
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return expenses;
    const q = search.toLowerCase();
    return expenses.filter(
      (e) =>
        e.description?.toLowerCase().includes(q) ||
        e.category_name.toLowerCase().includes(q) ||
        String(e.amount).includes(q)
    );
  }, [expenses, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await deleteExpense(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) {
      toast.error("Failed to delete expense");
    } else {
      toast.success("Expense deleted");
    }
  };

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((e) => {
      const dateKey = e.expense_date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(e);
    });
    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [filtered]);

  return (
    <>
      <Header title="Expenses" />
      <div className="px-4 py-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex bg-muted rounded-2xl p-1 gap-1">
          {(["month", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {f === "month" ? "This Month" : "All Time"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Expenses list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-muted-foreground">
              {search ? "No matching expenses" : "No expenses yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([date, exps]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {formatDate(date)}
                </p>
                <div className="bg-card rounded-2xl border divide-y divide-border overflow-hidden">
                  {exps.map((expense) => (
                    <div key={expense.id} className="px-3">
                      <ExpenseCard
                        expense={expense}
                        showMember={profile?.role === "admin"}
                        onDelete={
                          profile?.role === "admin" ||
                          expense.created_by === profile?.id
                            ? (id) => setDeleteId(id)
                            : undefined
                        }
                        compact
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
