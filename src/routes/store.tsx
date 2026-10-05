import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";

// Bundle prices are placeholders until real checkout is connected
export const BUNDLES = [
  { id: "spark", label: "Spark", points: 100, price: "$1.99", note: "About three coffee dates" },
  { id: "flame", label: "Flame", points: 300, price: "$4.99", note: "Most popular · save 16%", featured: true },
  { id: "wildfire", label: "Wildfire", points: 750, price: "$9.99", note: "Best value · save 33%" },
];

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "Dating store — Match/Make" },
      { name: "description", content: "Top up your dating wallet with point bundles for more dates." },
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
  const [msg, setMsg] = useState("");
  const b = BUNDLES.find((x) => x.id === chosen)!;

  return (
    <AppShell>
      <div className="px-5 pt-2">
        <p className="eyebrow">Dating store</p>
        <h1 className="mt-1 font-display text-3xl leading-tight">Never run dry.</h1>
        <p className="mt-1 text-sm text-foreground/60">You have {s.points} pts. Pick a bundle to top up.</p>
      </div>

      <div className="mx-5 mt-4 space-y-3">
        {BUNDLES.map((x) => (
          <button key={x.id} onClick={() => { setChosen(x.id); setMsg(""); }}
            className={`flex w-full items-center justify-between rounded-2xl p-4 text-left ring-1 ${chosen === x.id ? "ring-2 ring-foreground" : "ring-border"} ${x.featured ? "bg-adventurous-soft" : "bg-practical-soft"}`}>
            <div>
              <p className="text-sm font-semibold">{x.label}</p>
              <p className="font-display text-2xl">{x.points} <span className="text-sm text-foreground/50">pts</span></p>
              <p className="text-xs text-foreground/60">{x.note}</p>
            </div>
            <p className="font-display text-xl">{x.price}</p>
          </button>
        ))}
      </div>

      <div className="mx-5 mt-5">
        <button onClick={() => setMsg("Checkout is coming soon. Payments will be switched on shortly.")}
          className="w-full rounded-full bg-foreground py-3 text-sm font-semibold text-background">
          Buy {b.points} pts · {b.price}
        </button>
        {msg && <p className="mt-2 text-center text-sm text-foreground/70" role="status">{msg}</p>}
        <p className="mt-3 text-center text-xs text-foreground/50">Secure checkout. Points are added to your account right after payment.</p>
        <Link to="/wallet" search={{ match: undefined }} className="mt-4 block text-center text-sm font-semibold text-practical">Back to wallet</Link>
      </div>
    </AppShell>
  );
}
