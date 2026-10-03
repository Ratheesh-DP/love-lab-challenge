import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getStarters } from "@/lib/starters.functions";
import { EARN, PEOPLE, earn, useStore, visiblePeople, type Theory } from "@/lib/store";

export const Route = createFileRoute("/starters")({
  validateSearch: (s: Record<string, unknown>) => ({ match: typeof s["match"] === "string" ? (s["match"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Icebreakers — Match/Make" },
      { name: "description", content: "AI-powered conversation starters tailored to your interests and your match's profile." },
      { property: "og:title", content: "Icebreakers — Match/Make" },
      { property: "og:description", content: "Never send 'hey' again. Personalized openers for every match." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Starters,
});

const INTERESTS_KEY = "matchmake-interests";

function Starters() {
  const s = useStore();
  const { match: matchId } = Route.useSearch();
  const fn = useServerFn(getStarters);
  const [interests, setInterests] = useState("");
  const [match, setMatch] = useState("");
  const [theory, setTheory] = useState<Theory>(s.side);
  const [out, setOut] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => setInterests(localStorage.getItem(INTERESTS_KEY) ?? ""), []);
  useEffect(() => {
    const p = PEOPLE.find((x) => x.id === matchId);
    if (p) {
      setMatch(`${p.name}, ${p.age}. ${p.line} ${p.bio} Tags: ${p.tags.join(", ")}.`);
      setTheory(p.theory);
    }
  }, [matchId]);

  const run = async () => {
    setBusy(true); setErr(""); setOut([]);
    localStorage.setItem(INTERESTS_KEY, interests);
    try {
      const r = await fn({ data: { interests, match, theory } });
      setOut(r.starters);
      if (r.starters.length) earn(EARN.openers, "Generated openers");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const isP = theory === "practical";
  const ready = interests.trim().length >= 3 && match.trim().length >= 3;

  return (
    <AppShell>
      <div className="px-5 pt-2">
        <h1 className="font-display text-2xl">Icebreakers</h1>
        <p className="mt-1 text-sm text-foreground/60">Tell us about you and them. We'll write five openers worth sending.</p>
      </div>

      <div className="mt-4 space-y-3 px-5">
        <label className="block rounded-2xl p-4 ring-1 ring-border">
          <span className="eyebrow">Your interests</span>
          <textarea value={interests} onChange={(e) => setInterests(e.target.value)} rows={3} maxLength={1500}
            placeholder="Bouldering, Korean cooking, true-crime podcasts, Sunday long runs…"
            className="mt-2 w-full resize-none bg-transparent text-sm outline-none placeholder:text-foreground/35" />
        </label>

        <div className="rounded-2xl p-4 ring-1 ring-border">
          <span className="eyebrow">Your match's profile</span>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {visiblePeople(s).map((p) => (
              <button key={p.id} onClick={() => { setMatch(`${p.name}, ${p.age}. ${p.line} ${p.bio} Tags: ${p.tags.join(", ")}.`); setTheory(p.theory); }}
                className="flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-semibold ring-1 ring-border">
                <img src={p.photo} alt="" width={24} height={24} className="size-6 rounded-full object-cover" />{p.name}
              </button>
            ))}
          </div>
          <textarea value={match} onChange={(e) => setMatch(e.target.value)} rows={4} maxLength={2000}
            placeholder="Paste their bio, prompts and tags — or pick someone above."
            className="mt-2 w-full resize-none bg-transparent text-sm outline-none placeholder:text-foreground/35" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["practical", "adventurous"] as const).map((t) => (
            <button key={t} onClick={() => setTheory(t)}
              className={`rounded-full py-2 text-sm font-semibold ring-1 ring-border ${theory === t ? (t === "practical" ? "bg-practical text-primary-foreground" : "bg-adventurous text-primary-foreground") : "text-foreground/60"}`}>
              {t === "practical" ? "Practical tone" : "Adventurous tone"}
            </button>
          ))}
        </div>

        <button disabled={!ready || busy} onClick={run}
          className={`w-full rounded-full py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40 ${isP ? "bg-practical" : "bg-adventurous"}`}>
          {busy ? "Writing your openers…" : out.length ? "Write five more" : "Write my openers"}
        </button>

        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}

        {out.map((line, i) => (
          <div key={i} className={`animate-card-in rounded-2xl p-4 ${isP ? "bg-practical-soft" : "bg-adventurous-soft"}`} style={{ animationDelay: `${i * 60}ms` }}>
            <p className="text-sm leading-relaxed">{line}</p>
            <button onClick={() => { navigator.clipboard.writeText(line); setCopied(i); setTimeout(() => setCopied(null), 1500); }}
              className={`mt-2 text-xs font-semibold ${isP ? "text-practical" : "text-adventurous"}`}>
              {copied === i ? "Copied" : "Copy"}
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
