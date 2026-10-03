import { useState } from "react";
import { blockPerson, reportPerson, REPORT_REASONS, type Person } from "@/lib/store";

export function SafetyMenu({ person, onDone }: { person: Person; onDone?: () => void }) {
  const [open, setOpen] = useState<null | "menu" | "report" | "sent">(null);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [note, setNote] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);

  const close = () => { setOpen(null); setNote(""); };

  return (
    <>
      <button aria-label={`Safety options for ${person.name}`} onClick={() => setOpen("menu")}
        className="rounded-full px-2 text-lg leading-none text-foreground/45">⋯</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40" onClick={close}>
          <div className="animate-card-in w-full max-w-md rounded-t-3xl bg-background p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            {open === "menu" && (
              <>
                <p className="font-display text-xl">{person.name}</p>
                <p className="mt-1 text-sm text-foreground/60">Your safety comes first. They won't be told.</p>
                <button onClick={() => { blockPerson(person.id); close(); onDone?.(); }}
                  className="mt-4 w-full rounded-full py-3 text-sm font-semibold ring-1 ring-border">Block {person.name}</button>
                <button onClick={() => setOpen("report")}
                  className="mt-2 w-full rounded-full bg-destructive py-3 text-sm font-semibold text-destructive-foreground">Report profile</button>
                <button onClick={close} className="mt-2 w-full py-2 text-sm font-semibold text-foreground/50">Cancel</button>
              </>
            )}
            {open === "report" && (
              <>
                <p className="font-display text-xl">Report {person.name}</p>
                <div className="mt-3 space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label key={r} className={`flex items-center gap-3 rounded-2xl p-3 text-sm ring-1 ${reason === r ? "ring-foreground" : "ring-border"}`}>
                      <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-foreground" />{r}
                    </label>
                  ))}
                </div>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3}
                  placeholder="Anything else we should know? (optional)"
                  className="mt-3 w-full resize-none rounded-2xl bg-transparent p-3 text-sm outline-none ring-1 ring-border placeholder:text-foreground/35" />
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} className="accent-foreground" />
                  Also block {person.name}
                </label>
                <button onClick={() => { reportPerson(person.id, reason, note.trim(), alsoBlock); setOpen("sent"); }}
                  className="mt-4 w-full rounded-full bg-destructive py-3 text-sm font-semibold text-destructive-foreground">Send report</button>
              </>
            )}
            {open === "sent" && (
              <>
                <p className="font-display text-xl">Thanks for telling us.</p>
                <p className="mt-1 text-sm text-foreground/60">Your report was saved. {alsoBlock ? `${person.name} won't appear again.` : ""}</p>
                <button onClick={() => { close(); if (alsoBlock) onDone?.(); }}
                  className="mt-4 w-full rounded-full bg-foreground py-3 text-sm font-semibold text-background">Done</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
