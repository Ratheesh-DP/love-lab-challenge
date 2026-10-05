import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

type Req = { id: string; user_id: string; points: number; amount_inr: number; reference: string; status: string; created_at: string };

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Approve payments — Match/Make" },
      { name: "description", content: "Review UPI point purchases." },
      { property: "og:title", content: "Approve payments — Match/Make" },
      { property: "og:description", content: "Review UPI point purchases." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [reqs, setReqs] = useState<Req[]>([]);

  async function load() {
    const { data: u } = await supabase.auth.getUser();
    const { data: ok } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "admin" });
    setIsAdmin(!!ok);
    if (!ok) return;
    const { data } = await supabase.from("purchase_requests").select("*").order("created_at", { ascending: false }).limit(50);
    setReqs((data as Req[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function review(id: string, status: "approved" | "rejected") {
    await supabase.from("purchase_requests").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
    load();
  }

  return (
    <AppShell>
      <div className="px-5 pt-2">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-1 font-display text-3xl">Approve payments</h1>
        <p className="mt-1 text-sm text-foreground/60">Check each transaction ID in your UPI app before approving.</p>
      </div>
      {isAdmin === false && <p className="mx-5 mt-4 text-sm">You don't have access to this page.</p>}
      <div className="mx-5 mt-4 space-y-3">
        {reqs.map((r) => (
          <div key={r.id} className="rounded-2xl p-4 ring-1 ring-border">
            <p className="text-sm font-semibold">₹{r.amount_inr} · {r.points} pts</p>
            <p className="mt-1 font-mono text-sm">{r.reference}</p>
            <p className="text-xs text-foreground/50">{new Date(r.created_at).toLocaleString()}</p>
            {r.status === "pending" ? (
              <div className="mt-3 flex gap-2">
                <button onClick={() => review(r.id, "approved")} className="flex-1 rounded-full bg-practical py-2 text-sm font-semibold text-primary-foreground">Approve</button>
                <button onClick={() => review(r.id, "rejected")} className="flex-1 rounded-full py-2 text-sm font-semibold ring-1 ring-border">Reject</button>
              </div>
            ) : (
              <p className="mt-2 text-xs font-semibold">{r.status === "approved" ? "Approved" : "Rejected"}</p>
            )}
          </div>
        ))}
        {isAdmin && reqs.length === 0 && <p className="text-sm text-foreground/60">No purchases yet.</p>}
      </div>
    </AppShell>
  );
}
