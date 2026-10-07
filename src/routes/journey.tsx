import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { dayOf, dayOfTime, PEOPLE, saveNote, useStore } from "@/lib/store";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "The 60-day journey — Match/Make" },
      { name: "description", content: "Track every day of your 60-day love experiment and jot down what you learn." },
      { property: "og:title", content: "The 60-day journey — Match/Make" },
      { property: "og:description", content: "Sixty days, one diary, two theories of love." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Journey,
});

function Journey() {
  const s = useStore();
  const today = dayOf(s);
  const [sel, setSel] = useState<number | null>(null);
  const day = sel ?? today;
  const datesOn = (d: number) => s.dates.filter((x) => x.when && dayOfTime(s, x.when) === d).sort((a, b) => a.when! - b.when!);

  return (
    <AppShell>
      <div className="px-5 pt-2">
        <h1 className="font-display text-2xl">The 60-day journey</h1>
        <p className="mt-1 text-sm text-foreground/60">Day {today} · {60 - today} days to prove your theory.</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
          <div className="h-full rounded-full bg-practical" style={{ width: `${(today / 60) * 100}%` }} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-10 gap-1.5 px-5">
        {Array.from({ length: 60 }, (_, i) => i + 1).map((d) => {
          const past = d < today, isToday = d === today, hasNote = !!s.notes[d];
          const hasDate = datesOn(d).length > 0;
          return (
            <button
              key={d}
              disabled={d > today && !hasDate}
              onClick={() => setSel(d)}
              aria-label={`Day ${d}${hasDate ? ", date booked" : ""}`}
              className={`relative aspect-square rounded-lg text-[10px] font-semibold transition
                ${d === day ? "ring-2 ring-foreground" : ""}
                ${isToday ? "bg-adventurous text-primary-foreground" : past ? (hasNote ? "bg-practical text-primary-foreground" : "bg-practical-soft text-practical") : hasDate ? "bg-adventurous-soft text-adventurous" : "bg-foreground/5 text-foreground/30"}`}
            >
              {d}
              {hasDate && <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-adventurous ring-1 ring-background" />}
            </button>
          );
        })}
      </div>
      <p className="mt-2 px-5 text-xs text-foreground/50"><span className="mr-1 inline-block size-1.5 rounded-full bg-adventurous" />Booked date</p>

      {datesOn(day).length > 0 && (
        <div className="mx-5 mt-4 rounded-2xl bg-adventurous-soft p-4">
          <p className="eyebrow">Dates on day {day}</p>
          {datesOn(day).map((d) => (
            <p key={d.id} className="mt-2 text-sm">
              <span className="font-semibold">{new Date(d.when!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span> · {d.kind} with {PEOPLE.find((p) => p.id === d.personId)?.name}
              {d.location && <span className="block text-xs text-foreground/60">{d.location}</span>}
            </p>
          ))}
        </div>
      )}

      {day <= today && (
      <div className="mx-5 mt-5 rounded-2xl p-4 ring-1 ring-border">
        <p className="eyebrow">Day {day} notes</p>
        <textarea
          key={day}
          defaultValue={s.notes[day] ?? ""}
          onBlur={(e) => saveNote(day, e.target.value)}
          placeholder="What did today teach you about love?"
          rows={4}
          className="mt-2 w-full resize-none bg-transparent text-sm outline-none placeholder:text-foreground/35"
        />
      </div>
      )}
    </AppShell>
  );
}
