import { formatCurrency } from "@/lib/utils";
import type { MilkEntry, MilkConfig } from "@/lib/types";

interface MilkSummaryCardProps {
  entries: MilkEntry[];
  currentRate: MilkConfig | null;
}

export function MilkSummaryCard({ entries, currentRate }: MilkSummaryCardProps) {
  const totalLiters = entries.reduce(
    (s, e) => s + Number(e.quantity_liters),
    0
  );
  const rate = currentRate ? Number(currentRate.rate_per_liter) : 0;
  const totalCost = totalLiters * rate;
  const daysWithEntries = new Set(entries.map((e) => e.entry_date)).size;
  const avgDaily = daysWithEntries > 0 ? totalLiters / daysWithEntries : 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatBlock label="Total Liters" value={`${totalLiters.toFixed(1)} L`} />
      <StatBlock label="Total Cost" value={formatCurrency(totalCost)} />
      <StatBlock label="Daily Avg" value={`${avgDaily.toFixed(1)} L`} />
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-blue-50 rounded-2xl p-3 text-center">
      <p className="text-sm font-bold text-blue-900 leading-tight truncate">
        {value}
      </p>
      <p className="text-[11px] text-blue-600 mt-0.5">{label}</p>
    </div>
  );
}
