import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { bookDate, DATE_KINDS, dayOfTime, PEOPLE, useStore } from "@/lib/store";

const PLACES: Record<string, string[]> = {
  coffee: ["Corner Bookshop Café", "Riverside Roasters", "Park Kiosk"],
  dinner: ["Little Olive Trattoria", "Saffron House", "The Long Table"],
  surprise: ["Meet at Central Station", "Coastal train day", "Hill fort trek"],
  rooftop: ["Skyline Terrace", "The Roof at 9th", "Old Mill Rooftop"],
};
const TIMES = ["10:00", "12:30", "16:00", "18:30", "20:00"];

export const Route = createFileRoute("/book")({
  validateSearch: (s: Record<string, unknown>) => ({
    match: typeof s["match"] === "string" ? (s["match"] as string) : undefined,
    kind: typeof s["kind"] === "string" ? (s["kind"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book a date — Match/Make" },
      { name: "description", content: "Pick a day, time and place for your next date." },
      { property: "og:title", content: "Book a date — Match/Make" },
      { property: "og:description", content: "Plan the when and where of your next date." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Book,
});

const pad = (n: number) => String(n).padStart(2, "0");
const localDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function icsFor(title: string, start: Date, location: string) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(start.getTime() + 2 * 36e5);
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MatchMake//EN", "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@matchmake`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
    `SUMMARY:${title}`, `LOCATION:${location.replace(/[,;]/g, " ")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
  a.download = "date.ics";
  a.click();
}

function Book() {
  const s = useStore();
  const nav = useNavigate();
  const { match, kind } = Route.useSearch();
  const matches = s.liked.filter((id) => !s.blocked.includes(id)).map((id) => PEOPLE.find((p) => p.id === id)!).filter(Boolean);
  const [who, setWho] = useState(match ?? matches[0]?.id ?? "");
  const [kindId, setKindId] = useState(kind ?? DATE_KINDS[0]!.id);
  const challengeEnd = new Date(s.startedAt + 59 * 864e5);
  const [day, setDay] = useState(localDay(new Date(Date.now() + 864e5)));
  const [time, setTime] = useState("18:30");
  const [place, setPlace] = useState("");
  const [booked, setBooked] = useState<{ start: Date; title: string; location: string } | null>(null);
  const [err, setErr] = useState("");

  const k = DATE_KINDS.find((x) => x.id === kindId)!;
  const p = PEOPLE.find((x) => x.id === who);
  const location = place || PLACES[kindId]![0]!;

  function confirm() {
    const start = new Date(`${day}T${time}`);
    if (!p) return setErr("Pick a match first.");
    if (isNaN(start.getTime()) || start.getTime() < Date.now()) return setErr("Pick a time in the future.");
    if (s.points < k.cost) return setErr("Not enough points.");
    if (!bookDate(p.id, k.id, start.getTime(), location)) return setErr("Couldn't book. Please try again.");
    setBooked({ start, title: `${k.label} with ${p.name}`, location });
  }

  if (booked) {
    const d = dayOfTime(s, booked.start.getTime());
    return (
      <AppShell>
        <div className="mx-5 mt-4 rounded-2xl bg-practical-soft p-5">
          <p className="eyebrow">Booked</p>
          <h1 className="mt-1 font-display text-2xl">{booked.title}</h1>
          <p className="mt-2 text-sm">{booked.start.toLocaleString([], { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
          <p className="text-sm">{booked.location}</p>
          {d >= 1 && d <= 60 && <p className="mt-2 text-xs text-foreground/60">Added to day {d} of your journey.</p>}
          <button onClick={() => icsFor(booked.title, booked.start, booked.location)} className="mt-4 w-full rounded-full bg-foreground py-3 text-sm font-semibold text-background">
            Add to my phone calendar
          </button>
          <button onClick={() => nav({ to: "/journey" })} className="mt-2 w-full rounded-full py-3 text-sm font-semibold ring-1 ring-border">See journey calendar</button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-5 pt-2">
        <p className="eyebrow">Book a date</p>
        <h1 className="mt-1 font-display text-3xl leading-tight">When & where?</h1>
        <p className="mt-1 text-sm text-foreground/60">You have {s.points} pts.</p>
      </div>

      {matches.length === 0 ? (
        <p className="mx-5 mt-4 text-sm">Match with someone first. <Link to="/" className="font-semibold text-practical">Discover</Link></p>
      ) : (
        <div className="mx-5 mt-4 space-y-5">
          <section>
            <p className="text-sm font-semibold">Who</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {matches.map((m) => (
                <button key={m.id} onClick={() => setWho(m.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-semibold ring-1 ${who === m.id ? "ring-2 ring-foreground" : "ring-border"}`}>
                  <img src={m.photo} alt="" width={24} height={24} className="size-6 rounded-full object-cover" />{m.name}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-sm font-semibold">What</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {DATE_KINDS.map((x) => (
                <button key={x.id} onClick={() => { setKindId(x.id); setPlace(""); }}
                  className={`rounded-2xl p-3 text-left ring-1 ${kindId === x.id ? "ring-2 ring-foreground" : "ring-border"} ${x.theory === "practical" ? "bg-practical-soft" : "bg-adventurous-soft"} ${s.points < x.cost ? "opacity-40" : ""}`}>
                  <p className="text-sm font-semibold">{x.label}</p>
                  <p className="text-xs">−{x.cost} pts</p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-sm font-semibold">Day</p>
            <input type="date" value={day} min={localDay(new Date())} max={localDay(challengeEnd)} onChange={(e) => setDay(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
            <p className="mt-1 text-xs text-foreground/50">Any day before your challenge ends on {challengeEnd.toLocaleDateString()}.</p>
          </section>

          <section>
            <p className="text-sm font-semibold">Time</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIMES.map((t) => (
                <button key={t} onClick={() => setTime(t)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${time === t ? "bg-foreground text-background ring-foreground" : "ring-border"}`}>{t}</button>
              ))}
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Custom time" className="rounded-full border border-border bg-background px-3 py-1 text-xs" />
            </div>
          </section>

          <section>
            <p className="text-sm font-semibold">Where</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLACES[kindId]!.map((pl) => (
                <button key={pl} onClick={() => setPlace(pl)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${location === pl ? "bg-foreground text-background ring-foreground" : "ring-border"}`}>{pl}</button>
              ))}
            </div>
            <input value={place} onChange={(e) => setPlace(e.target.value)} maxLength={120} placeholder="Or type your own place"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
          </section>

          <button onClick={confirm} disabled={s.points < k.cost} className="w-full rounded-full bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-40">
            Book for {k.cost} pts
          </button>
          {err && <p className="text-center text-sm text-destructive" role="alert">{err}</p>}
        </div>
      )}
    </AppShell>
  );
}
