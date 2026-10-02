import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PEOPLE, dayOf, scoreboard, update, useStore, type Theory } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Match/Make — Discover tonight's candidates" },
      { name: "description", content: "A 60-day dating challenge: Practical vs Adventurous. Swipe, match, and keep your theory winning." },
      { property: "og:title", content: "Match/Make — Practical vs Adventurous" },
      { property: "og:description", content: "Two theories of love. Sixty days. One scoreboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discover,
});

function Discover() {
  const s = useStore();
  const other: Theory = s.side === "practical" ? "adventurous" : "practical";
  const seen = new Set([...s.liked, ...s.skipped]);
  const queue = PEOPLE.filter((p) => p.theory === s.side && !seen.has(p.id));
  const rival = PEOPLE.find((p) => p.theory === other && !seen.has(p.id));
  const current = queue[0];
  const board = scoreboard(s);
  const total = board.practical + board.adventurous;
  const lead = board.practical - board.adventurous;
  const isP = s.side === "practical";

  const act = (id: string, like: boolean) =>
    update((st) => ({ ...st, [like ? "liked" : "skipped"]: [...st[like ? "liked" : "skipped"], id] }));
  const switchSide = () => update((st) => ({ ...st, side: other }));

  return (
    <AppShell>
      <div className="px-5 pt-2">
        <h1 className="max-w-[16ch] text-balance font-display text-2xl leading-tight">
          Day {dayOf(s)} of 60. Your theory is on trial.
        </h1>
        <p className="mt-2 max-w-[46ch] text-pretty text-base leading-relaxed text-foreground/65">
          Two philosophies. One shot at finding someone. Swipe through tonight's candidates and keep your side winning.
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between px-5">
        <div>
          <p className="eyebrow">Live scoreboard</p>
          <p className="mt-1 font-display text-3xl leading-none">
            <span className="text-practical">{board.practical}</span> <span className="text-foreground/35">—</span>{" "}
            <span className="text-adventurous">{board.adventurous}</span>
          </p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground ${isP ? "bg-practical" : "bg-adventurous"}`}>
          You're {isP ? "Practical" : "Adventurous"}
        </div>
      </div>

      <div className="mt-3 px-5">
        <div className="flex h-2 overflow-hidden rounded-full bg-adventurous ring-1 ring-border">
          <div className="h-full rounded-full bg-practical transition-all duration-500" style={{ width: `${(board.practical / total) * 100}%` }} />
        </div>
        <p className="mt-1 text-xs text-foreground/55">
          {lead === 0 ? "Dead heat. Next match breaks the tie." : `${lead > 0 ? "Practical" : "Adventurous"} leads by ${Math.abs(lead)}.`}
        </p>
      </div>

      {current ? (
        <div key={current.id} className="animate-card-in mx-5 mt-4 overflow-hidden rounded-2xl ring-1 ring-border">
          <div className="flex items-stretch">
            <img src={current.photo} alt={current.name} width={768} height={960} className="min-h-[212px] w-[45%] object-cover" />
            <div className="flex flex-1 flex-col justify-between p-4">
              <div>
                <p className="font-display text-xl leading-tight">{current.name}, {current.age}</p>
                <p className="mt-0.5 text-xs text-foreground/55">{current.line}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {current.tags.map((t) => (
                    <span key={t} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isP ? "bg-practical-soft text-practical" : "bg-adventurous-soft text-adventurous"}`}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <p className="eyebrow">{isP ? "Compatibility" : "Chemistry"}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                    <div className={`h-full rounded-full ${isP ? "bg-practical" : "bg-adventurous"}`} style={{ width: `${current.score}%` }} />
                  </div>
                  <span className={`font-display text-sm font-semibold ${isP ? "text-practical" : "text-adventurous"}`}>{current.score}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 p-3">
            <button onClick={() => act(current.id, false)} className="flex-1 rounded-full px-3 py-2.5 text-sm font-semibold text-foreground/60 ring-1 ring-foreground/10 active:scale-95">Skip</button>
            <button onClick={() => act(current.id, true)} className={`flex-[2] rounded-full px-3 py-2.5 text-sm font-semibold text-primary-foreground active:scale-95 ${isP ? "bg-practical" : "bg-adventurous"}`}>Match</button>
          </div>
        </div>
      ) : (
        <div className="mx-5 mt-4 rounded-2xl p-6 text-center ring-1 ring-border">
          <p className="font-display text-xl">That's everyone for tonight.</p>
          <p className="mt-1 text-sm text-foreground/60">Check your matches, or test the other theory.</p>
          <Link to="/matches" className="mt-4 inline-block rounded-full bg-practical px-4 py-2 text-sm font-semibold text-primary-foreground">See matches</Link>
        </div>
      )}

      {rival && (
        <button onClick={switchSide} className="mt-3 block w-full px-5 text-left">
          <div className={`rounded-2xl p-3 ring-1 ring-border ${other === "adventurous" ? "bg-adventurous-soft/70" : "bg-practical-soft/70"}`}>
            <p className={`eyebrow ${other === "adventurous" ? "!text-adventurous" : "!text-practical"}`}>
              {other === "adventurous" ? "Adventurous" : "Practical"} feed · one tap away
            </p>
            <div className="mt-2 flex items-center gap-3">
              <img src={rival.photo} alt={rival.name} loading="lazy" width={48} height={48} className="size-12 shrink-0 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm leading-tight">{rival.name}, {rival.age}</p>
                <p className="truncate text-xs text-foreground/55">{rival.line}</p>
              </div>
              <span className={`font-display text-sm font-semibold ${other === "adventurous" ? "text-adventurous" : "text-practical"}`}>{rival.score}</span>
            </div>
          </div>
        </button>
      )}

      <div className="mx-5 mt-4 flex items-center justify-between rounded-full bg-foreground px-4 py-2 text-background">
        <div className="flex items-center gap-2">
          <span className={`size-2 shrink-0 rounded-full ${other === "adventurous" ? "bg-adventurous" : "bg-practical"}`} />
          <span className="text-pretty text-xs font-medium">{other === "adventurous" ? "Adventurous" : "Practical"} just matched 3 people this hour</span>
        </div>
        <button onClick={switchSide} className="shrink-0 text-xs font-semibold text-background/60">Switch</button>
      </div>
    </AppShell>
  );
}
