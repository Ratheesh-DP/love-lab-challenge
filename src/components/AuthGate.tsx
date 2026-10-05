import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { attachUser } from "@/lib/store";

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      const id = session?.user.id ?? null;
      setTimeout(() => {
        attachUser(id).finally(() => setStatus(id ? "in" : "out"));
      }, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (status === "loading") return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (status === "out") return <SignIn />;
  return <>{children}</>;
}

function SignIn() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (res.error) return setMsg(res.error.message);
    if (mode === "up" && !res.data.session) setMsg("Check your email to confirm your account, then sign in.");
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setMsg("Google sign-in didn't work. Please try again.");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Match<span className="text-adventurous">/</span>Make
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "in" ? "Sign in to pick up your challenge on any device." : "Create an account to save your matches, points and reports."}
      </p>
      <button onClick={google} className="mt-6 rounded-full border border-border bg-background py-3 text-sm font-semibold">
        Continue with Google
      </button>
      <div className="my-4 text-center text-xs text-muted-foreground">or</div>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
        <input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
        <button disabled={busy} className="w-full rounded-full bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50">
          {busy ? "…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>
      {msg && <p className="mt-3 text-sm text-practical">{msg}</p>}
      <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }} className="mt-4 text-sm text-muted-foreground underline">
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

export async function signOut() {
  await supabase.auth.signOut();
  localStorage.removeItem("matchmake-v1");
  window.location.reload();
}
