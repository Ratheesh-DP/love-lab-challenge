import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PEOPLE, update, useStore } from "@/lib/store";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Your matches — Match/Make" },
      { name: "description", content: "Everyone you've matched with during your 60-day challenge." },
      { property: "og:title", content: "Your matches — Match/Make" },
      { property: "og:description", content: "Practical or Adventurous — see who you've matched with." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Matches,
});

function Matches() {
  const s = useStore();
  const list = s.liked.map((id) => PEOPLE.find((p) => p.id === id)!).filter(Boolean);
  return (
    <AppShell>
      <div className="px-5 pt-2">
        <h1 className="font-display text-2xl">Your matches</h1>
        <p className="mt-1 text-sm text-foreground/60">{list.length} so far. Every one counts for its theory.</p>
      </div>
      <div className="mt-4 space-y-3 px-5">
        {list.length === 0 && (
          <div className="rounded-2xl p-6 text-center ring-1 ring-border">
            <p className="font-display text-lg">No matches yet.</p>
            <Link to="/" className="mt-3 inline-block rounded-full bg-practical px-4 py-2 text-sm font-semibold text-primary-foreground">Start discovering</Link>
          </div>
        )}
        {list.map((p) => {
          const isP = p.theory === "practical";
          return (
            <div key={p.id} className="animate-card-in flex gap-3 rounded-2xl p-3 ring-1 ring-border">
              <img src={p.photo} alt={p.name} loading="lazy" width={64} height={80} className="h-20 w-16 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg leading-tight">{p.name}, {p.age}</p>
                  <span className={`font-display text-sm font-semibold ${isP ? "text-practical" : "text-adventurous"}`}>{p.score}</span>
                </div>
                <p className={`eyebrow mt-0.5 ${isP ? "!text-practical" : "!text-adventurous"}`}>{isP ? "Practical" : "Adventurous"}</p>
                <p className="mt-1 line-clamp-2 text-xs text-foreground/60">{p.bio}</p>
                <div className="mt-2 flex gap-4">
                  <Link to="/starters" search={{ match: p.id }} className={`text-xs font-semibold ${isP ? "text-practical" : "text-adventurous"}`}>
                    Get openers
                  </Link>
                  <button
                    onClick={() => update((st) => ({ ...st, liked: st.liked.filter((x) => x !== p.id), skipped: [...st.skipped, p.id] }))}
                    className="text-xs font-semibold text-foreground/45"
                  >
                    Unmatch
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
