import { useSyncExternalStore } from "react";
import nora from "@/assets/nora.jpg";
import theo from "@/assets/theo.jpg";
import jonah from "@/assets/jonah.jpg";
import ines from "@/assets/ines.jpg";

export type Theory = "practical" | "adventurous";

export type Person = {
  id: string;
  name: string;
  age: number;
  photo: string;
  theory: Theory;
  line: string;
  bio: string;
  tags: string[];
  score: number;
};

export const PEOPLE: Person[] = [
  { id: "nora", name: "Nora", age: 29, photo: nora, theory: "practical", line: "Wants a Sunday-market ritual, not a weekend fling", bio: "Bookshop manager. Reads the last page first. Looking for someone who texts back.", tags: ["Wants kids", "Non-smoker", "Early riser"], score: 88 },
  { id: "theo", name: "Theo", age: 31, photo: theo, theory: "adventurous", line: "\"Pick me up in 10, I found a train.\"", bio: "Photographer. Has a passport and a bad sense of direction. Best date ever: got lost on purpose.", tags: ["Spontaneous", "Night owl", "Rooftops"], score: 71 },
  { id: "jonah", name: "Jonah", age: 32, photo: jonah, theory: "practical", line: "Has a five-year plan and a sourdough starter", bio: "Urban planner. Calm, curious, emotionally available. Dealbreaker: rudeness to waiters.", tags: ["Monogamous", "Cooks", "Dog person"], score: 92 },
  { id: "ines", name: "Inés", age: 27, photo: ines, theory: "adventurous", line: "Will race you to the top of the cliff", bio: "Marine biologist. Swims in cold water for fun. Looking for someone who says yes first.", tags: ["Outdoors", "Travel", "Live music"], score: 84 },
];

export type Report = { id: string; reason: string; note: string; at: number };
export type Txn = { at: number; amount: number; label: string };
export type DatePlan = { id: string; personId: string; kind: string; cost: number; at: number };

type State = {
  side: Theory;
  startedAt: number;
  liked: string[];
  skipped: string[];
  notes: Record<number, string>;
  blocked: string[];
  reports: Report[];
  points: number;
  ledger: Txn[];
  dates: DatePlan[];
  lastCheckIn: string | null;
  picked: string[];
  written: string[];
};

export const EARN = { match: 10, note: 5, openers: 3, checkIn: 20 } as const;
export const DATE_KINDS = [
  { id: "coffee", label: "Coffee & a walk", cost: 30, theory: "practical" as Theory },
  { id: "dinner", label: "Dinner reservation", cost: 60, theory: "practical" as Theory },
  { id: "surprise", label: "Surprise day trip", cost: 90, theory: "adventurous" as Theory },
  { id: "rooftop", label: "Rooftop concert", cost: 70, theory: "adventurous" as Theory },
];
export const REPORT_REASONS = ["Fake profile or scam", "Harassment or threats", "Inappropriate photos or messages", "Underage", "Something else"];

const KEY = "matchmake-v1";
const initial: State = {
  side: "practical", startedAt: Date.now() - 11 * 864e5, liked: [], skipped: [], notes: {},
  blocked: [], reports: [], points: 100, ledger: [{ at: Date.now(), amount: 100, label: "Welcome bonus" }], dates: [], lastCheckIn: null, picked: [], written: [],
};
let state: State = initial;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...initial, ...JSON.parse(raw) };
  } catch {}
}

export function update(fn: (s: State) => State) {
  load();
  state = fn(state);
  localStorage.setItem(KEY, JSON.stringify(state));
  subs.forEach((f) => f());
  scheduleSave();
}

export function resetChallenge() {
  update(() => ({ ...initial, startedAt: Date.now(), ledger: [{ at: Date.now(), amount: 100, label: "Welcome bonus" }] }));
}

const credit = (s: State, amount: number, label: string): State => ({
  ...s, points: s.points + amount, ledger: [{ at: Date.now(), amount, label }, ...s.ledger].slice(0, 100),
});

export function earn(amount: number, label: string) {
  update((s) => credit(s, amount, label));
}

export function likePerson(id: string) {
  const p = PEOPLE.find((x) => x.id === id);
  update((s) => credit({ ...s, liked: [...s.liked, id] }, EARN.match, `Matched with ${p?.name ?? "someone"}`));
}

export function saveNote(day: number, text: string) {
  update((s) => {
    const firstTime = !s.notes[day] && text.trim().length > 0;
    const next = { ...s, notes: { ...s.notes, [day]: text } };
    return firstTime ? credit(next, EARN.note, `Diary entry · day ${day}`) : next;
  });
}

const today = () => new Date().toISOString().slice(0, 10);
export const canCheckIn = (s: State) => s.lastCheckIn !== today();
export function checkIn() {
  update((s) => (canCheckIn(s) ? credit({ ...s, lastCheckIn: today() }, EARN.checkIn, "Daily check-in") : s));
}

export function bookDate(personId: string, kindId: string): boolean {
  const kind = DATE_KINDS.find((k) => k.id === kindId);
  const p = PEOPLE.find((x) => x.id === personId);
  if (!kind || !p) return false;
  let ok = false;
  update((s) => {
    if (s.points < kind.cost) return s;
    ok = true;
    const d: DatePlan = { id: crypto.randomUUID(), personId, kind: kind.label, cost: kind.cost, at: Date.now() };
    return credit({ ...s, dates: [d, ...s.dates] }, -kind.cost, `${kind.label} with ${p.name}`);
  });
  return ok;
}

export function blockPerson(id: string) {
  update((s) => ({ ...s, blocked: s.blocked.includes(id) ? s.blocked : [...s.blocked, id], liked: s.liked.filter((x) => x !== id) }));
}
export function unblockPerson(id: string) {
  update((s) => ({ ...s, blocked: s.blocked.filter((x) => x !== id) }));
}
export function reportPerson(id: string, reason: string, note: string, alsoBlock: boolean) {
  update((s) => ({ ...s, reports: [{ id, reason, note: note.slice(0, 500), at: Date.now() }, ...s.reports] }));
  if (userId) supabase.from("reports").insert({ person_id: id, reason: reason.slice(0, 100), note: note.slice(0, 500) }).then(({ error }) => error && console.error(error));
  if (alsoBlock) blockPerson(id);
}

export function useStore() {
  return useSyncExternalStore(
    (cb) => { load(); subs.add(cb); cb(); return () => subs.delete(cb); },
    () => { load(); return state; },
    () => initial,
  );
}

// Style memory: starters the dater chose and lines they wrote themselves (newest first, capped)
export function rememberPicked(line: string) {
  update((s) => ({ ...s, picked: [line, ...s.picked.filter((x) => x !== line)].slice(0, 30) }));
}
export function rememberWritten(line: string) {
  const t = line.trim().slice(0, 300);
  if (t) update((s) => ({ ...s, written: [t, ...s.written.filter((x) => x !== t)].slice(0, 30) }));
}
export function clearStyle() {
  update((s) => ({ ...s, picked: [], written: [] }));
}

export const visiblePeople = (s: State) => PEOPLE.filter((p) => !s.blocked.includes(p.id));

export function dayOf(s: State) {
  return Math.min(60, Math.max(1, Math.floor((Date.now() - s.startedAt) / 864e5) + 1));
}

// Baseline rival scores plus your own matches
export function scoreboard(s: State) {
  const mine = (t: Theory) => s.liked.filter((id) => PEOPLE.find((p) => p.id === id)?.theory === t).length;
  return { practical: 14 + mine("practical"), adventurous: 11 + mine("adventurous") };
}

// ---- Cloud sync: each signed-in dater's state lives in their own account ----
import { supabase } from "@/integrations/supabase/client";
let userId: string | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleSave() {
  if (!userId) return;
  const uid = userId;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    supabase.from("user_state").upsert({ user_id: uid, state: state as never, updated_at: new Date().toISOString() }).then(({ error }) => error && console.error(error));
  }, 600);
}
export async function attachUser(id: string | null) {
  userId = id;
  if (!id) return;
  const { data } = await supabase.from("user_state").select("state").eq("user_id", id).maybeSingle();
  if (data?.state && Object.keys(data.state as object).length) {
    state = { ...initial, ...(data.state as Partial<State>) };
  } else {
    load(); // first sign-in: carry this device's progress into the account
    scheduleSave();
  }
  localStorage.setItem(KEY, JSON.stringify(state));
  subs.forEach((f) => f());
}
