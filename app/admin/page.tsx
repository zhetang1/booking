"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Slot } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/format";
import WeekCalendar, {
  Legend,
  type CellRender,
  type RenderCellArgs,
} from "@/app/WeekCalendar";
import { cellKey, isoDate, type CellState } from "@/lib/calendar";

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);

  async function load() {
    const res = await fetch("/api/slots");
    const data = await res.json();
    setAuthed(!!data.admin);
    if (data.admin) setSlots(data.slots);
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
        <h1 className="text-xl font-bold text-slate-900">Admin login</h1>
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

const CELL_CLASS: Record<CellState, string> = {
  off: "bg-white hover:bg-slate-100",
  available: "bg-emerald-300 hover:bg-emerald-400",
  pending: "bg-amber-300",
  confirmed: "bg-[#3a5ba8] text-white",
};

function Dashboard({ slots, reload }: { slots: Slot[]; reload: () => void }) {
  const todayIso = isoDate(new Date());
  const [dragging, setDragging] = useState(false);
  const [dragKeys, setDragKeys] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Mutable drag info that the global pointer handlers read without re-binding.
  const drag = useRef<{ mode: "add" | "remove"; keys: Set<string> } | null>(null);

  const slotMap = new Map<string, Slot>();
  for (const s of slots) slotMap.set(cellKey(s.date, s.time), s);

  function cellState(key: string): CellState {
    const s = slotMap.get(key);
    if (!s) return "off";
    return s.booking ? s.booking.status : "available";
  }

  // --- API actions ---
  async function confirm(id: string) {
    setBusy(true);
    await fetch(`/api/slots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm" }),
    });
    setBusy(false);
    reload();
  }
  async function cancel(id: string, who: string) {
    if (!window.confirm(`Cancel ${who}'s booking and let them know? The time will reopen.`))
      return;
    setBusy(true);
    await fetch(`/api/slots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    setSelectedId(null);
    setBusy(false);
    reload();
  }
  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    reload();
  }

  // --- drag-to-paint availability ---
  function onCellDown(e: React.PointerEvent, date: string, time: string) {
    const key = `${date}|${time}`;
    const st = cellState(key);
    if (st === "pending" || st === "confirmed") {
      setSelectedId(slotMap.get(key)!.id);
      return;
    }
    if (date < todayIso) return; // don't paint the past
    e.preventDefault();
    setSelectedId(null);
    const mode: "add" | "remove" = st === "available" ? "remove" : "add";
    drag.current = { mode, keys: new Set([key]) };
    setDragKeys(new Set([key]));
    setDragging(true);
  }

  useEffect(() => {
    if (!dragging) return;

    function paintAt(x: number, y: number) {
      const el = document.elementFromPoint(x, y)?.closest("[data-cell]");
      const date = el?.getAttribute("data-date");
      const time = el?.getAttribute("data-time");
      const d = drag.current;
      if (!el || !date || !time || !d || date < todayIso) return;
      const key = `${date}|${time}`;
      const st = cellState(key);
      // only paint cells that the current mode can act on
      if (d.mode === "add" && st !== "off") return;
      if (d.mode === "remove" && st !== "available") return;
      if (d.keys.has(key)) return;
      d.keys.add(key);
      setDragKeys(new Set(d.keys));
    }

    const onMove = (e: PointerEvent) => paintAt(e.clientX, e.clientY);
    const onUp = async () => {
      const d = drag.current;
      drag.current = null;
      setDragging(false);
      if (!d || d.keys.size === 0) {
        setDragKeys(new Set());
        return;
      }
      setBusy(true);
      if (d.mode === "add") {
        const toAdd = [...d.keys].map((k) => {
          const [date, time] = k.split("|");
          return { date, time };
        });
        await fetch("/api/slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slots: toAdd }),
        });
      } else {
        const ids = [...d.keys]
          .map((k) => slotMap.get(k)?.id)
          .filter((id): id is string => Boolean(id));
        await Promise.all(ids.map((id) => fetch(`/api/slots/${id}`, { method: "DELETE" })));
      }
      setDragKeys(new Set());
      setBusy(false);
      reload();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const selected = selectedId ? slots.find((s) => s.id === selectedId) ?? null : null;
  const pendingCount = slots.filter((s) => s.booking?.status === "pending").length;

  function renderCell({ date, time, state, isPast, slot }: RenderCellArgs): CellRender {
    const key = cellKey(date, time);
    const inDrag = dragKeys.has(key);
    return {
      disabled: isPast && state === "off",
      onPointerDown: (e) => onCellDown(e, date, time),
      title: slot?.booking
        ? `${slot.booking.name} — ${slot.booking.status}`
        : state === "available"
          ? "Available"
          : "",
      content: slot?.booking ? slot.booking.name.split(" ")[0] : "",
      className: `m-px h-7 rounded-sm border border-slate-100 text-[10px] font-medium transition-colors ${
        CELL_CLASS[state]
      } ${inDrag ? "ring-2 ring-[#3a5ba8]" : ""} ${
        isPast ? "cursor-not-allowed opacity-40" : "cursor-pointer"
      } ${selectedId && slot?.id === selectedId ? "ring-2 ring-offset-1 ring-[#22356b]" : ""}`,
    };
  }

  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Manage lessons</h1>
          <button
            onClick={logout}
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Log out
          </button>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Drag across empty cells to open availability; drag across green cells to remove
          it. Click a booked cell to confirm or cancel.
          {pendingCount > 0 && (
            <span className="ml-1 font-semibold text-amber-700">
              {pendingCount} request{pendingCount > 1 ? "s" : ""} awaiting confirmation.
            </span>
          )}
        </p>

        <div className="mt-4">
          <WeekCalendar
            slots={slots}
            renderCell={renderCell}
            legend={
              <>
                <Legend className="bg-white ring-1 ring-slate-200" label="Not available" />
                <Legend className="bg-emerald-300" label="Available" />
                <Legend className="bg-amber-300" label="Pending" />
                <Legend className="bg-[#3a5ba8]" label="Confirmed" />
              </>
            }
          />
        </div>

        {busy && <p className="mt-2 text-sm text-slate-400">Saving…</p>}

        {/* selected booking detail + actions */}
        {selected?.booking && (
          <div
            className={`mt-4 rounded-2xl border p-5 ${
              selected.booking.status === "confirmed"
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-300 bg-amber-50"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="text-sm">
                <p className="font-bold text-slate-900">
                  {formatDate(selected.date)} · {formatTime(selected.time)}{" "}
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      selected.booking.status === "confirmed"
                        ? "bg-emerald-200 text-emerald-800"
                        : "bg-amber-200 text-amber-900"
                    }`}
                  >
                    {selected.booking.status === "confirmed" ? "Confirmed" : "Pending"}
                  </span>
                </p>
                <p className="mt-1 text-slate-700">{selected.booking.name}</p>
                <p className="text-slate-600">
                  <a href={`tel:${selected.booking.phone}`} className="underline">
                    {selected.booking.phone}
                  </a>
                  {selected.booking.email && (
                    <>
                      {" · "}
                      <a href={`mailto:${selected.booking.email}`} className="underline">
                        {selected.booking.email}
                      </a>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selected.booking.status === "pending" && (
                  <button
                    onClick={() => confirm(selected.id)}
                    disabled={busy}
                    className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Confirm
                  </button>
                )}
                <button
                  onClick={() => cancel(selected.id, selected.booking!.name)}
                  disabled={busy}
                  className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-60"
                >
                  {selected.booking.status === "pending" ? "Decline" : "Cancel"}
                </button>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-sm font-medium text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-sm">
          <Link href="/" className="text-slate-500 hover:underline">
            ← View public site
          </Link>
        </p>
      </div>
    </main>
  );
}
