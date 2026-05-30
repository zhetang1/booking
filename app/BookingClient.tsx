"use client";

import { useEffect, useState } from "react";
import type { Slot } from "@/lib/db";
import { formatDate, formatTime, groupByDate } from "@/lib/format";

export default function BookingClient() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Slot | null>(null);

  async function load() {
    const res = await fetch("/api/slots");
    const data = await res.json();
    setSlots(data.slots);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, name, phone, email }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!data.ok) {
      setError(data.error || "Something went wrong.");
      load();
      return;
    }
    setConfirmed(selected);
    setSelected(null);
    setName("");
    setPhone("");
    setEmail("");
    load();
  }

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-8 text-center">
        <div className="text-4xl">🙌</div>
        <h3 className="mt-2 text-xl font-bold text-amber-900">Request received!</h3>
        <p className="mt-2 text-amber-800">
          {formatDate(confirmed.date)} at {formatTime(confirmed.time)} · 30 minutes
        </p>
        <p className="mt-4 text-sm text-amber-800">
          Your spot is held while <strong>Natalie confirms</strong> your lesson. She&apos;ll
          reach out, and you&apos;ll get a confirmation if you left an email. Payment is{" "}
          <strong>$60 in cash or Venmo</strong> at the lesson.
        </p>
        <button
          onClick={() => setConfirmed(null)}
          className="mt-6 rounded-full bg-amber-500 px-5 py-2 font-semibold text-white hover:bg-amber-600"
        >
          Book another time
        </button>
      </div>
    );
  }

  if (slots === null) {
    return <p className="text-center text-slate-500">Loading available times…</p>;
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
        No open times right now. Please check back soon — Natalie adds new slots
        regularly!
      </div>
    );
  }

  const grouped = groupByDate(slots);

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        {grouped.map(([date, daySlots]) => (
          <div key={date}>
            <h3 className="mb-2 font-bold text-slate-800">{formatDate(date)}</h3>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((slot) => {
                const active = selected?.id === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => {
                      setSelected(slot);
                      setError("");
                    }}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-[#3a5ba8] bg-[#3a5ba8] text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-[#3a5ba8]"
                    }`}
                  >
                    {formatTime(slot.time)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <form
          onSubmit={submit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="mb-4 font-semibold text-slate-800">
            Booking{" "}
            <span className="text-[#3a5ba8]">
              {formatDate(selected.date)} at {formatTime(selected.time)}
            </span>
          </p>
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
                Email <span className="font-normal text-slate-400">(optional — for a confirmation)</span>
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
              {submitting ? "Booking…" : "Confirm booking"}
            </button>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Payment is $60, due at the lesson — cash or Venmo.
          </p>
        </form>
      )}
    </div>
  );
}
