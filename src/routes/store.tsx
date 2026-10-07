import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { refreshWallet, useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import qr from "@/assets/upi-qr.png.asset.json";

// Must match the allowed bundles in the purchase_requests insert policy
export const BUNDLES = [
  { id: "spark", label: "Spark", points: 100, inr: 149, note: "About three coffee dates" },
  { id: "flame", label: "Flame", points: 300, inr: 399, note: "Most popular · save 11%", featured: true },
  { id: "wildfire", label: "Wildfire", points: 750, inr: 799, note: "Best value · save 29%" },
];
const UPI_ID = "d.p.ratheesh007@okhdfcbank";
const UPI_NAME = "Ratheesh D P";

type Req = { id: string; points: number; amount_inr: number; status: string; created_at: string; reject_reason: string | null };

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "Dating store — Match/Make" },
      { name: "description", content: "Top up your dating wallet with point bundles, paid by UPI." },
      { property: "og:title", content: "Dating store — Match/Make" },
      { property: "og:description", content: "Buy point bundles so your wallet never runs dry." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Store,
});

function Store() {
  const s = useStore();
  const [chosen, setChosen] = useState("flame");
  const [step, setStep] = useState<"pick" | "pay">("pick");
  const [ref, setRef] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [reqs, setReqs] = useState<Req[]>([]);
  const b = BUNDLES.find((x) => x.id === chosen)!;

  async function refresh() {
    await refreshWallet();
    const { data } = await supabase.from("purchase_requests").select("id, points, amount_inr, status, created_at, reject_reason").order("created_at", { ascending: false }).limit(10);
    setReqs(data ?? []);
  }
  useEffect(() => { refresh(); }, []);

  async function submit() {
    const r = ref.trim();
    if (!/^[A-Za-z0-9]{6,40}$/.test(r)) return setMsg("Enter the UPI transaction ID (letters and numbers only).");
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("purchase_requests").insert({ user_id: u.user!.id, bundle_id: b.id, points: b.points, amount_inr: b.inr, reference: r });
    setBusy(false);
    if (error) return setMsg(error.code === "23505" ? "That transaction ID has already been used." : "Couldn't send. Please try again.");
    setRef(""); setStep("pick");
    setMsg("Thanks! We'll check your payment and add the points, usually within a day.");
    refresh();
  }

  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${b.inr}&cu=INR&tn=${encodeURIComponent(`Match/Make ${b.points} pts`)}`;

  return (
    <AppShell>
      <div className="px-5 pt-2">
        <p className="eyebrow">Dating store</p>
        <h1 className="mt-1 font-display text-3xl leading-tight">Never run dry.</h1>
        <p className="mt-1 text-sm text-foreground/60">You have {s.points} pts. Pick a bundle to top up.</p>
      </div>

      {step === "pick" ? (
        <>
          <div className="mx-5 mt-4 space-y-3">
            {BUNDLES.map((x) => (
              <button key={x.id} onClick={() => { setChosen(x.id); setMsg(""); }}
                className={`flex w-full items-center justify-between rounded-2xl p-4 text-left ring-1 ${chosen === x.id ? "ring-2 ring-foreground" : "ring-border"} ${x.featured ? "bg-adventurous-soft" : "bg-practical-soft"}`}>
                <div>
                  <p className="text-sm font-semibold">{x.label}</p>
                  <p className="font-display text-2xl">{x.points} <span className="text-sm text-foreground/50">pts</span></p>
                  <p className="text-xs text-foreground/60">{x.note}</p>
                </div>
                <p className="font-display text-xl">₹{x.inr}</p>
              </button>
            ))}
          </div>
          <div className="mx-5 mt-5">
            <button onClick={() => { setStep("pay"); setMsg(""); }} className="w-full rounded-full bg-foreground py-3 text-sm font-semibold text-background">
              Pay ₹{b.inr} with UPI
            </button>
          </div>
        </>
      ) : (
        <div className="mx-5 mt-4 rounded-2xl p-4 ring-1 ring-border">
          <p className="text-sm font-semibold">1. Pay exactly ₹{b.inr} for {b.points} pts</p>
          <img src={qr.url} alt={`UPI QR code for ${UPI_NAME}`} className="mx-auto mt-3 w-56 rounded-xl" />
          <p className="mt-2 text-center text-xs text-foreground/60">UPI ID: {UPI_ID}</p>
          <a href={upiLink} className="mt-3 block rounded-full py-2.5 text-center text-sm font-semibold ring-1 ring-border">Open my UPI app</a>
          <p className="mt-5 text-sm font-semibold">2. Enter the transaction ID</p>
          <p className="text-xs text-foreground/60">You'll find it (UTR / UPI ref no.) on the payment receipt.</p>
          <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. 427812345678" maxLength={40}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
          <button disabled={busy} onClick={submit} className="mt-3 w-full rounded-full bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50">
            {busy ? "Sending…" : "I've paid"}
          </button>
          <button onClick={() => setStep("pick")} className="mt-2 w-full text-sm text-foreground/60">Back</button>
        </div>
      )}

      <div className="mx-5 mt-3">
        {msg && <p className="text-center text-sm text-foreground/70" role="status">{msg}</p>}
      </div>

      {reqs.length > 0 && (
        <div className="mx-5 mt-4 rounded-2xl p-4 ring-1 ring-border">
          <p className="eyebrow">Your purchases</p>
          {reqs.map((r) => (
            <div key={r.id} className="mt-2 flex justify-between text-sm">
              <span>{r.points} pts · ₹{r.amount_inr}{r.reject_reason && <span className="block text-xs text-foreground/50">{r.reject_reason}</span>}</span>
              <span className={r.status === "approved" ? "text-practical" : r.status === "rejected" ? "text-destructive" : "text-foreground/50"}>
                {r.status === "approved" ? "Added" : r.status === "rejected" ? "Rejected" : "Checking"}
              </span>
            </div>
          ))}
        </div>
      )}
      <Link to="/wallet" search={{ match: undefined }} className="mt-4 block text-center text-sm font-semibold text-practical">Back to wallet</Link>
    </AppShell>
  );
}
