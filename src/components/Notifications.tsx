import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { refreshWallet } from "@/lib/store";

type Note = { id: string; title: string; body: string; read: boolean; created_at: string };

export function NotificationBell() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [open, setOpen] = useState(false);

  async function load() {
    const { data } = await supabase.from("notifications").select("id, title, body, read, created_at").order("created_at", { ascending: false }).limit(20);
    const list = (data as Note[]) ?? [];
    setNotes((prev) => {
      // A new notification may mean points changed — refresh the balance
      if (list.some((n) => !prev.find((p) => p.id === n.id)) && prev.length) refreshWallet();
      return list;
    });
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, []);

  const unread = notes.filter((n) => !n.read).length;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread) {
      const ids = notes.filter((n) => !n.read).map((n) => n.id);
      await supabase.from("notifications").update({ read: true }).in("id", ids);
      setNotes((ns) => ns.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div className="relative">
      <button onClick={toggle} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className="relative flex size-8 items-center justify-center rounded-full ring-1 ring-border">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-adventurous text-[9px] font-bold text-primary-foreground">{unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl bg-background p-3 shadow-lg ring-1 ring-border">
          <p className="eyebrow px-1">Notifications</p>
          {notes.length === 0 && <p className="px-1 py-3 text-sm text-foreground/60">Nothing yet.</p>}
          {notes.map((n) => (
            <div key={n.id} className="mt-2 rounded-xl p-2 ring-1 ring-border">
              <p className={`text-sm font-semibold ${n.title.includes("approved") && !n.title.includes("not") ? "text-practical" : "text-adventurous"}`}>{n.title}</p>
              <p className="text-xs text-foreground/70">{n.body}</p>
              <p className="mt-1 text-[10px] text-foreground/40">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
