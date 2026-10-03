import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { bookDate, canCheckIn, checkIn, DATE_KINDS, EARN, PEOPLE, useStore } from "@/lib/store";

export const Route = createFileRoute("/wallet")({
  validateSearch: (s: Record<string, unknown>) => ({ match: typeof s["match"] === "string" ? (s["match"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Dating wallet — Match/Make" },
      { name: "description", content: "Earn points by matching, journaling and checking in. Spend them on dates." },
      { property: "og:title", content: "Dating wallet — Match/Make" },
      { property: "og:description", content: "The dating economy: earn points, plan dates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Wallet,
});

function Wallet() {
  const s = useStore();
  const { match } = Route.useSearch();
  const matches = s.liked.filter((id) => !s.blocked.includes(id)).map((id) => PEOPLE.find((p) => p.id === id)!).filter(Boolean);
  const [who, setWho] = useState<string>(match ?? "");
  const [msg, setMsg] = useState("");
  const personId = who || matches[0]?.id;

  return (
    <AppShell>
      <div className="px-5 pt-2">
        <p className="eyebrow">Dating wallet</p>
        <p className="mt-1 font-display text-5xl leading-none">{s.points}<span className="ml-1 text-lg text-foreground/45">pts</span></p>
        <button disabled={!canCheckIn(s)} onClick={checkIn}
          className="mt-4 w-full rounded-full bg-practical py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40">
          {canCheckIn(s) ? `Daily check-in · +${EARN.checkIn}` : "Checked in today — back tomorrow"}
        </button>
      </div>

      <div className="mx-5 mt-4 rounded-2xl p-4 ring-1 ring-border">
        <p className="eyebrow">Ways to earn</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li className="flex justify-between"><span>Make a match</span><span className="font-semibold text-practical">+{EARN.match}</span></li>
          <li className="flex justify-between"><span>Write a diary entry</span><span className="font-semibold text-practical">+{EARN.note}</span></li>
          <li className="flex justify-between"><span>Generate openers</span><span className="font-semibold text-practical">+{EARN.openers}</span></li>
          <li className="flex justify-between"><span>Daily check-in</span><span className="font-semibold text-practical">+{EARN.checkIn}</span></li>
        </ul>
      </div>

      <div className="mx-5 mt-4 rounded-2xl p-4 ring-1 ring-border">
        <p className="eyebrow">Plan a date</p>
        {matches.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">Match with someone first. <Link to="/" className="font-semibold text-practical">Discover</Link></p>
        ) : (
          <>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {matches.map((p) => (
                <button key={p.id} onClick={() => setWho(p.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-semibold ring-1 ${personId === p.id ? "ring-foreground" : "ring-border"}`}>
                  <img src={p.photo} alt="" width={24} height={24} className="size-6 rounded-full object-cover" />{p.name}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DATE_KINDS.map((k) => {
                const afford = s.points >= k.cost;
                const isP = k.theory === "practical";
                return (
                  <button key={k.id} disabled={!afford}
                    onClick={() => {
                      const ok = bookDate(personId!, k.id);
                      setMsg(ok ? `Booked: ${k.label} with ${PEOPLE.find((p) => p.id === personId)?.name}.` : "Not enough points.");
                    }}
                    className={`rounded-2xl p-3 text-left disabled:opacity-40 ${isP ? "bg-practical-soft" : "bg-adventurous-soft"}`}>
                    <p className="text-sm font-semibold">{k.label}</p>
                    <p className={`mt-1 font-display text-lg ${isP ? "text-practical" : "text-adventurous"}`}>−{k.cost}</p>
                  </button>
                );
              })}
            </div>
            {msg && <p className="mt-2 text-sm text-foreground/70" role="status">{msg}</p>}
          </>
        )}
      </div>

      {s.dates.length > 0 && (
        <div className="mx-5 mt-4 rounded-2xl p-4 ring-1 ring-border">
          <p className="eyebrow">Upcoming dates</p>
          {s.dates.map((d) => (
            <p key={d.id} className="mt-2 text-sm">{d.kind} · {PEOPLE.find((p) => p.id === d.personId)?.name}</p>
          ))}
        </div>
      )}

      <div className="mx-5 mt-4 rounded-2xl p-4 ring-1 ring-border">
        <p className="eyebrow">History</p>
        {s.ledger.map((t, i) => (
          <div key={i} className="mt-2 flex justify-between text-sm">
            <span className="text-foreground/75">{t.label}</span>
            <span className={`font-semibold ${t.amount > 0 ? "text-practical" : "text-adventurous"}`}>{t.amount > 0 ? "+" : ""}{t.amount}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
