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

type State = {
  side: Theory;
  startedAt: number;
  liked: string[];
  skipped: string[];
  notes: Record<number, string>;
};

const KEY = "matchmake-v1";
const initial: State = { side: "practical", startedAt: Date.now() - 11 * 864e5, liked: [], skipped: [], notes: {} };
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
}

export function resetChallenge() {
  update(() => ({ ...initial, startedAt: Date.now() }));
}

export function useStore() {
  return useSyncExternalStore(
    (cb) => { load(); subs.add(cb); cb(); return () => subs.delete(cb); },
    () => { load(); return state; },
    () => initial,
  );
}

export function dayOf(s: State) {
  return Math.min(60, Math.max(1, Math.floor((Date.now() - s.startedAt) / 864e5) + 1));
}

// Baseline rival scores plus your own matches
export function scoreboard(s: State) {
  const mine = (t: Theory) => s.liked.filter((id) => PEOPLE.find((p) => p.id === id)?.theory === t).length;
  return { practical: 14 + mine("practical"), adventurous: 11 + mine("adventurous") };
}
