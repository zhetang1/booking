import type { Slot } from "@/lib/db";

// Shared weekly-calendar primitives used by both the admin dashboard and the
// public booking widget so they stay visually and behaviourally identical.

export type CellState = "off" | "available" | "pending" | "confirmed";

export function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay()); // back to Sunday
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// 8:00 → 19:30 in 30-minute steps (last lesson ends 20:00).
export const SLOT_TIMES: string[] = (() => {
  const out: string[] = [];
  for (let h = 8; h < 20; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`, `${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

export function cellStateFor(slot?: Slot | null): CellState {
  if (!slot) return "off";
  return slot.booking ? slot.booking.status : "available";
}

export function cellKey(date: string, time: string): string {
  return `${date}|${time}`;
}
