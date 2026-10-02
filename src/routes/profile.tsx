import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { resetChallenge, update, useStore, type Theory } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your side — Match/Make" },
      { name: "description", content: "Choose your theory of love: Practical or Adventurous." },
      { property: "og:title", content: "Pick your side — Match/Make" },
      { property: "og:description", content: "Practical or Adventurous? Choose your theory for the 60-day challenge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

const SIDES: { id: Theory; title: string; pitch: string }[] = [
  { id: "practical", title: "Practical", pitch: "Compatibility, values, dealbreakers. Love is a good decision made well." },
  { id: "adventurous", title: "Adventurous", pitch: "Chemistry, spontaneity, shared stories. Love is a leap you take together." },
];

function Profile() {
  const s = useStore();
  return (
    <AppShell>
      <div className="px-5 pt-2">
        <h1 className="font-display text-2xl">Pick your side</h1>
        <p className="mt-1 text-sm text-foreground/60">Your feed follows your theory. Switch whenever you lose faith.</p>
      </div>
      <div className="mt-4 space-y-3 px-5">
        {SIDES.map((x) => {
          const on = s.side === x.id;
          const isP = x.id === "practical";
          return (
            <button
              key={x.id}
              onClick={() => update((st) => ({ ...st, side: x.id }))}
              className={`block w-full rounded-2xl p-4 text-left ring-1 transition ${on ? (isP ? "bg-practical text-primary-foreground ring-practical" : "bg-adventurous text-primary-foreground ring-adventurous") : (isP ? "bg-practical-soft ring-border" : "bg-adventurous-soft ring-border")}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-xl">{x.title}</span>
                {on && <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-foreground">Your side</span>}
              </div>
              <p className="mt-1 text-sm opacity-80">{x.pitch}</p>
            </button>
          );
        })}
      </div>
      <div className="mx-5 mt-6 rounded-2xl p-4 ring-1 ring-border">
        <p className="eyebrow">Your stats</p>
        <p className="mt-2 text-sm">{s.liked.length} matches · {s.skipped.length} skipped · {Object.values(s.notes).filter(Boolean).length} diary entries</p>
        <button
          onClick={() => confirm("Restart the 60-day challenge? This clears your matches and notes.") && resetChallenge()}
          className="mt-3 text-xs font-semibold text-destructive"
        >
          Restart challenge
        </button>
      </div>
    </AppShell>
  );
}
