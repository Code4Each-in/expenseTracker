"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  BarChart2,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem =
  | {
      href: string;
      label: string;
      icon: LucideIcon;
      primary?: boolean;
      emoji?: never;
    }
  | { href: string; label: string; emoji: string; icon?: never; primary?: never };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/expenses", label: "History", icon: Receipt },
  { href: "/add", label: "Add", icon: PlusCircle, primary: true },
  { href: "/milk", label: "Milk", emoji: "🥛" },
  { href: "/reports", label: "Reports", icon: BarChart2 },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb">
      <div className="flex items-center justify-around px-1 py-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          if ("emoji" in item && item.emoji) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 py-2 px-2 min-w-0 flex-1"
              >
                <span className="text-xl leading-none">{item.emoji}</span>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          const Icon = item.icon!;

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 py-1 px-2 flex-1"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform active:scale-95">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-medium text-primary">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 py-2 px-2 min-w-0 flex-1"
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
