"use client";

import { useEffect, useState } from "react";
import type { Slot } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/format";
import WeekCalendar, {
  Legend,
  type CellRender,
  type RenderCellArgs,
} from "@/app/WeekCalendar";

export default function BookingClient() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Slot[] | null>(null);

  async function load() {
    const res = await fetch("/api/slots");
    const data = await res.json();
    const open: Slot[] = data.slots ?? [];
    setSlots(open);
    // Drop any selections that are no longer available (e.g. just booked).
    setSelected((prev) => {
      const ids = new Set(open.map((s) => s.id));
      return new Set([...prev].filter((id) => ids.has(id)));
    });
  }

  useEffect(() => {
    load();
  }, []);

  function toggle(id: string) {
    setError("");
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ids = [...selected];
    if (ids.length === 0) return;
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, name, phone, email }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!data.ok) {
      setError(data.error || "Something went wrong.");
      load();
      return;
    }
    setConfirmed(data.booked as Slot[]);
    setSelected(new Set());
    setName("");
    setPhone("");
    setEmail("");
    load();
  }

  function renderCell({ state, isPast, slot }: RenderCellArgs): CellRender {
    const base =
      "m-px h-7 rounded-sm border border-slate-100 text-[11px] font-bold transition-colors";
    const selectable = state === "available" && !isPast && !!slot;
    const isSelected = !!slot && selected.has(slot.id);

    const firstName = slot?.booking?.name ? slot.booking.name.split(" ")[0] : "";
    const booked = state === "pending" || state === "confirmed";

    let look: string;
    let title = "";
    let content: React.ReactNode = "";
    if (isSelected) {
      look = "bg-[#3a5ba8] text-white cursor-pointer";
      content = "✓";
    } else if (selectable) {
      look = "bg-emerald-200 text-emerald-900 hover:bg-emerald-300 cursor-pointer";
      title = "Available — tap to select";
    } else if (state === "pending") {
      look = "bg-amber-300 text-amber-900 cursor-not-allowed";
      title = firstName ? `${firstName} — pending` : "Pending — awaiting confirmation";
      content = firstName;
    } else if (state === "confirmed") {
      look = "bg-[#3a5ba8]/70 text-white cursor-not-allowed";
      title = firstName ? `${firstName} — booked` : "Booked";
      content = firstName;
    } else {
      // Not offered / in the past.
      look = "bg-slate-50 text-transparent cursor-default";
    }

    return {
      disabled: !selectable && !isSelected,
      title,
      content: <span className={booked ? "text-[10px]" : ""}>{content}</span>,
      onPointerDown: selectable || isSelected ? () => slot && toggle(slot.id) : undefined,
      className: `${base} ${look}`,
    };
  }

  if (confirmed) {
    const multiple = confirmed.length > 1;
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-8 text-center">
        <div className="text-4xl">🙌</div>
        <h3 className="mt-2 text-xl font-bold text-amber-900">
          {multiple ? `${confirmed.length} requests received!` : "Request received!"}
        </h3>
        <ul className="mt-3 space-y-1 text-amber-800">
          {[...confirmed]
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
            .map((s) => (
              <li key={s.id}>
                {formatDate(s.date)} at {formatTime(s.time)} · 30 minutes
              </li>
            ))}
        </ul>
        <p className="mt-4 text-sm text-amber-800">
          Your {multiple ? "spots are" : "spot is"} held while{" "}
          <strong>Natalie confirms</strong>. She&apos;ll reach out, and you&apos;ll get a
          confirmation if you left an email. Payment is{" "}
          <strong>$60 per lesson in cash or Venmo</strong> at the lesson.
        </p>
        <button
          onClick={() => setConfirmed(null)}
          className="mt-6 rounded-full bg-amber-500 px-5 py-2 font-semibold text-white hover:bg-amber-600"
        >
          Book more times
        </button>
      </div>
    );
  }

  if (slots === null) {
    return <p className="text-center text-slate-500">Loading available times…</p>;
  }

  const selectedSlots = slots
    .filter((s) => selected.has(s.id))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Tap the green times you&apos;d like — you can pick more than one. Use the arrows to
        move between weeks.
      </p>

      <WeekCalendar
        slots={slots}
        renderCell={renderCell}
        legend={
          <>
            <Legend className="bg-emerald-200" label="Available" />
            <Legend className="bg-[#3a5ba8]" label="Selected" />
            <Legend className="bg-amber-300" label="Pending" />
            <Legend className="bg-[#3a5ba8]/70" label="Booked" />
          </>
        }
      />

      {!slots.some((s) => !s.booking) && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
          No open times right now. Please check back soon — Natalie adds new slots
          regularly!
        </div>
      )}

      {selectedSlots.length > 0 && (
        <form
          onSubmit={submit}
          className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="mb-3 font-semibold text-slate-800">
            Booking{" "}
            <span className="text-[#3a5ba8]">
              {selectedSlots.length} lesson{selectedSlots.length > 1 ? "s" : ""}
            </span>
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedSlots.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className="group inline-flex items-center gap-1.5 rounded-full bg-[#3a5ba8] px-3 py-1 text-sm font-semibold text-white"
                title="Remove"
              >
                {formatDate(s.date)} · {formatTime(s.time)}
                <span className="text-white/70 group-hover:text-white">✕</span>
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Your name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-[#3a5ba8]"
                placeholder="Jane Smith"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Phone number</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                type="tel"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-[#3a5ba8]"
                placeholder="(201) 555-0123"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-600">
                Email{" "}
                <span className="font-normal text-slate-400">
                  (optional — for a confirmation)
                </span>
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-[#3a5ba8]"
                placeholder="you@example.com"
              />
            </label>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#3a5ba8] px-6 py-2.5 font-bold text-white hover:bg-[#2f4d92] disabled:opacity-60"
            >
              {submitting
                ? "Requesting…"
                : `Request ${selectedSlots.length} lesson${
                    selectedSlots.length > 1 ? "s" : ""
                  }`}
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Clear
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Payment is $60 per lesson, due at the lesson — cash or Venmo.
          </p>
        </form>
      )}
    </div>
  );
}
