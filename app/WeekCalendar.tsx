"use client";

import { useState } from "react";
import type { Slot } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/format";
import {
  SLOT_TIMES,
  addDays,
  cellKey,
  cellStateFor,
  isoDate,
  startOfWeek,
  type CellState,
} from "@/lib/calendar";

// What a consumer returns to describe how a single cell should look and behave.
export type CellRender = {
  className: string;
  disabled?: boolean;
  title?: string;
  content?: React.ReactNode;
  onPointerDown?: (e: React.PointerEvent) => void;
};

export type RenderCellArgs = {
  date: string;
  time: string;
  state: CellState;
  isPast: boolean;
  slot?: Slot;
};

// Shared weekly grid: week navigation + day headers + half-hour rows. Each page
// supplies `renderCell` to control appearance and interaction, while the layout,
// time axis, and data-* hooks (used for pointer hit-testing) stay identical.
export default function WeekCalendar({
  slots,
  renderCell,
  legend,
}: {
  slots: Slot[];
  renderCell: (args: RenderCellArgs) => CellRender;
  legend?: React.ReactNode;
}) {
  const todayIso = isoDate(new Date());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const slotMap = new Map<string, Slot>();
  for (const s of slots) slotMap.set(cellKey(s.date, s.time), s);

  const rangeLabel = `${formatDate(isoDate(days[0]))} – ${formatDate(isoDate(days[6]))}`;

  return (
    <div>
      {/* week nav + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-white"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-white"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-white"
          >
            Next →
          </button>
          <span className="ml-1 text-sm font-semibold text-slate-700">{rangeLabel}</span>
        </div>
        {legend && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">{legend}</div>
        )}
      </div>

      {/* calendar grid */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="min-w-[640px] select-none">
          {/* header */}
          <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
            <div />
            {days.map((d) => {
              const iso = isoDate(d);
              const isToday = iso === todayIso;
              return (
                <div
                  key={iso}
                  className={`px-1 pb-2 text-center text-xs font-semibold ${
                    isToday ? "text-[#3a5ba8]" : "text-slate-600"
                  }`}
                >
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                  <div className={isToday ? "text-[#3a5ba8]" : "text-slate-400"}>
                    {d.getMonth() + 1}/{d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* rows */}
          {SLOT_TIMES.map((time) => (
            <div
              key={time}
              className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] items-stretch"
            >
              <div className="whitespace-nowrap pr-2 text-right text-[11px] leading-7 text-slate-400">
                {time.endsWith(":00") ? formatTime(time) : ""}
              </div>
              {days.map((d) => {
                const iso = isoDate(d);
                const key = cellKey(iso, time);
                const slot = slotMap.get(key);
                const state = cellStateFor(slot);
                const isPast = iso < todayIso;
                const cell = renderCell({ date: iso, time, state, isPast, slot });
                return (
                  <button
                    key={key}
                    type="button"
                    data-cell
                    data-date={iso}
                    data-time={time}
                    disabled={cell.disabled}
                    title={cell.title}
                    onPointerDown={cell.onPointerDown}
                    className={cell.className}
                  >
                    {cell.content}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3.5 w-3.5 rounded-sm ${className}`} />
      {label}
    </span>
  );
}
