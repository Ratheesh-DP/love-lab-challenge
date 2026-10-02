import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", label: "Discover" },
  { to: "/matches", label: "Matches" },
  { to: "/starters", label: "Openers" },
  { to: "/journey", label: "Journey" },
  { to: "/profile", label: "Profile" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight">
          Match<span className="text-adventurous">/</span>Make
        </Link>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="size-2 rounded-full bg-practical" />Practical
          <span className="size-2 rounded-full bg-adventurous" />Adventurous
        </div>
      </header>
      <main className="flex-1 pb-24">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 mx-auto grid max-w-md grid-cols-5 gap-1 border-t border-border bg-background px-5 py-3 text-center">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="group text-foreground/40"
            activeProps={{ className: "group is-active text-practical" }}
            activeOptions={{ exact: true }}
          >
            <div className="mx-auto size-5 rounded-full bg-foreground/10 ring-1 ring-border group-[.is-active]:bg-practical/20" />
            <p className="mt-1 text-[10px] font-semibold">{t.label}</p>
          </Link>
        ))}
      </nav>
    </div>
  );
}
