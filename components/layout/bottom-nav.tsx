"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  BarChart2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/expenses", label: "History", icon: Receipt },
  { href: "/add", label: "Add", icon: PlusCircle, primary: true },
  { href: "/reports", label: "Reports", icon: BarChart2 },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon, primary }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");

          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center -mt-5"
              >
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-1 text-[10px] font-medium text-muted-foreground">
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[3.5rem]"
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
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
