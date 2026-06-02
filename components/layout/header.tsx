"use client";

import { useProfile } from "@/lib/hooks/use-profile";
import { getInitials } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { profile } = useProfile();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <div>
          <h1 className="text-lg font-bold text-foreground">
            {title ?? APP_NAME}
          </h1>
          {profile && (
            <p className="text-xs text-muted-foreground">
              Hi, {profile.full_name.split(" ")[0]} 👋
            </p>
          )}
        </div>

        {profile && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {getInitials(profile.full_name)}
          </div>
        )}
      </div>
    </header>
  );
}
