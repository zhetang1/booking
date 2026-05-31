import { NextRequest, NextResponse } from "next/server";
import { bookSlot } from "@/lib/db";
import { sendBookingRequestNotifications } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  // Accept either a single `id` (legacy) or an `ids` array (book several slots
  // in one request). Duplicates and falsy values are dropped.
  const rawIds: unknown[] = Array.isArray(body?.ids)
    ? body.ids
    : body?.id != null
      ? [body.id]
      : [];
  const ids = [...new Set(rawIds.map(String).filter(Boolean))];

  const name: string = (body?.name ?? "").trim();
  const phone: string = (body?.phone ?? "").trim();
  const email: string = (body?.email ?? "").trim();

  if (ids.length === 0)
    return NextResponse.json({ ok: false, error: "Missing time slot." }, { status: 400 });
  if (name.length < 2)
    return NextResponse.json({ ok: false, error: "Please enter your name." }, { status: 400 });
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10)
    return NextResponse.json(
      { ok: false, error: "Please enter a valid phone number." },
      { status: 400 }
    );
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 }
    );

  // Each slot is guarded atomically in the DB, so a race only loses the
  // contested slot — the rest still book.
  const results = await Promise.all(
    ids.map((id) => bookSlot(id, name, phone, email || null))
  );
  const booked = results.flatMap((r) => (r.ok ? [r.slot] : []));
  const failures = results.flatMap((r) => (r.ok ? [] : [r.error]));

  // Nothing booked — surface the first reason (a single-slot request maps
  // straight to a 409, as before).
  if (booked.length === 0) {
    return NextResponse.json(
      { ok: false, error: failures[0] ?? "Sorry, those times were just booked." },
      { status: 409 }
    );
  }

  // Email Natalie (to confirm) + the customer (request received) per booked
  // slot. Awaited so it runs before the function suspends; never throws.
  await Promise.all(booked.map((slot) => sendBookingRequestNotifications(slot)));

  return NextResponse.json({ ok: true, booked, failures });
}
