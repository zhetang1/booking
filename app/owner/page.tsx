"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Slot } from "@/lib/db";
import { formatDate, formatTime, groupByDate } from "@/lib/format";

export default function OwnerPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);

  async function load() {
    const res = await fetch("/api/slots");
    const data = await res.json();
    setAuthed(!!data.owner);
    if (data.owner) setSlots(data.slots);
  }

  useEffect(() => {
    load();
  }, []);

  if (authed === null) {
    return <Center>Loading…</Center>;
  }

  if (!authed) {
    return <Login onSuccess={load} />;
  }

  return <Dashboard slots={slots} reload={load} />;
}

function StatusBadge({ status }: { status: "pending" | "confirmed" }) {
  return status === "confirmed" ? (
    <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
      Confirmed
    </span>
  ) : (
    <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
      Pending
    </span>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center p-6 text-slate-500">
      {children}
    </main>
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      setError(data.error || "Login failed.");
      return;
    }
    onSuccess();
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-bold text-slate-900">Owner login</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to manage your available lesson times.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          placeholder="Password"
          className="mt-5 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-[#3a5ba8]"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-full bg-[#3a5ba8] px-5 py-2.5 font-bold text-white hover:bg-[#2f4d92] disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-slate-500 hover:underline">
            ← Back to site
          </Link>
        </p>
      </form>
    </main>
  );
}

function Dashboard({ slots, reload }: { slots: Slot[]; reload: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [times, setTimes] = useState<string[]>([]);
  const [timeInput, setTimeInput] = useState("");
  const [saving, setSaving] = useState(false);

  function addTime() {
    if (!/^\d{2}:\d{2}$/.test(timeInput)) return;
    if (!times.includes(timeInput)) setTimes([...times, timeInput].sort());
    setTimeInput("");
  }

  async function saveSlots() {
    if (times.length === 0) return;
    setSaving(true);
    await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: times.map((time) => ({ date, time })) }),
    });
    setTimes([]);
    setSaving(false);
    reload();
  }

  async function remove(id: string) {
    await fetch(`/api/slots/${id}`, { method: "DELETE" });
    reload();
  }

  async function confirm(id: string) {
    await fetch(`/api/slots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm" }),
    });
    reload();
  }

  // Cancel/decline a booking: frees the slot and emails the customer. Confirmed
  // first because it notifies the customer.
  async function cancel(id: string, who: string) {
    if (!window.confirm(`Cancel ${who}'s booking and let them know? The time will reopen.`)) {
      return;
    }
    await fetch(`/api/slots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    reload();
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    reload();
  }

  const grouped = groupByDate(slots);
  const pending = slots.filter((s) => s.booking?.status === "pending");
  const confirmed = slots.filter((s) => s.booking?.status === "confirmed");

  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Manage lessons</h1>
          <button
            onClick={logout}
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Log out
          </button>
        </div>

        {/* Add availability */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-800">Add available times</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pick a date, add one or more start times, then save. Each lesson is 30
            minutes.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Date</span>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-[#3a5ba8]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Start time</span>
              <div className="mt-1 flex gap-2">
                <input
                  type="time"
                  value={timeInput}
                  step={1800}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-[#3a5ba8]"
                />
                <button
                  type="button"
                  onClick={addTime}
                  className="rounded-lg border border-[#3a5ba8] px-3 py-2 text-sm font-semibold text-[#3a5ba8] hover:bg-[#3a5ba8] hover:text-white"
                >
                  + Add
                </button>
              </div>
            </label>
          </div>

          {times.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">
                Times to add on {formatDate(date)}:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {times.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm"
                  >
                    {formatTime(t)}
                    <button
                      onClick={() => setTimes(times.filter((x) => x !== t))}
                      className="text-slate-400 hover:text-red-500"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <button
                onClick={saveSlots}
                disabled={saving}
                className="mt-4 rounded-full bg-[#3a5ba8] px-5 py-2 font-bold text-white hover:bg-[#2f4d92] disabled:opacity-60"
              >
                {saving ? "Saving…" : `Save ${times.length} time${times.length > 1 ? "s" : ""}`}
              </button>
            </div>
          )}
        </div>

        {/* Pending requests — need the owner to confirm */}
        {pending.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6">
            <h2 className="font-bold text-amber-900">
              Pending requests ({pending.length})
            </h2>
            <p className="mt-1 text-sm text-amber-800">
              Confirm each request to lock it in and email the customer.
            </p>
            <ul className="mt-3 space-y-2">
              {pending.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-amber-900"
                >
                  <span>
                    <strong>
                      {formatDate(s.date)} · {formatTime(s.time)}
                    </strong>{" "}
                    — {s.booking!.name},{" "}
                    <a href={`tel:${s.booking!.phone}`} className="underline">
                      {s.booking!.phone}
                    </a>
                  </span>
                  <span className="flex items-center gap-2">
                    <button
                      onClick={() => confirm(s.id)}
                      className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => cancel(s.id, s.booking!.name)}
                      className="rounded-full border border-amber-400 px-4 py-1.5 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                    >
                      Decline
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confirmed lessons summary */}
        {confirmed.length > 0 && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="font-bold text-emerald-800">
              Confirmed lessons ({confirmed.length})
            </h2>
            <ul className="mt-3 space-y-2">
              {confirmed.map((s) => (
                <li key={s.id} className="text-sm text-emerald-900">
                  <strong>
                    {formatDate(s.date)} · {formatTime(s.time)}
                  </strong>{" "}
                  — {s.booking!.name},{" "}
                  <a href={`tel:${s.booking!.phone}`} className="underline">
                    {s.booking!.phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* All slots */}
        <div className="mt-6">
          <h2 className="font-bold text-slate-800">Your schedule</h2>
          {slots.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              No times added yet. Add some availability above.
            </p>
          ) : (
            <div className="mt-3 space-y-5">
              {grouped.map(([d, daySlots]) => (
                <div key={d}>
                  <h3 className="mb-2 font-semibold text-slate-700">{formatDate(d)}</h3>
                  <div className="space-y-2">
                    {daySlots.map((s) => {
                      const status = s.booking?.status;
                      return (
                        <div
                          key={s.id}
                          className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-2 ${
                            status === "confirmed"
                              ? "border-emerald-200 bg-emerald-50"
                              : status === "pending"
                                ? "border-amber-200 bg-amber-50"
                                : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="text-sm">
                            <span className="font-semibold text-slate-800">
                              {formatTime(s.time)}
                            </span>{" "}
                            {s.booking ? (
                              <span className="text-slate-700">
                                · {s.booking.name} ({s.booking.phone}){" "}
                                <StatusBadge status={status!} />
                              </span>
                            ) : (
                              <span className="text-slate-400">· Open</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {status === "pending" && (
                              <button
                                onClick={() => confirm(s.id)}
                                className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Confirm
                              </button>
                            )}
                            <button
                              onClick={() =>
                                s.booking ? cancel(s.id, s.booking.name) : remove(s.id)
                              }
                              className="text-sm font-medium text-slate-400 hover:text-red-600"
                            >
                              {s.booking ? (status === "pending" ? "Decline" : "Cancel") : "Remove"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-sm">
          <Link href="/" className="text-slate-500 hover:underline">
            ← View public site
          </Link>
        </p>
      </div>
    </main>
  );
}
