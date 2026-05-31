import { NextRequest, NextResponse } from "next/server";
import { addSlot, getSlots, getPublicSlots } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  // Admins see every slot with full booking details; the public sees all future
  // slots (open + pending/confirmed) but with customer PII redacted.
  if (await isAdmin()) {
    return NextResponse.json({ slots: await getSlots(), admin: true });
  }
  return NextResponse.json({ slots: await getPublicSlots(), admin: false });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const slots: { date: string; time: string }[] = body?.slots ?? [];
  if (!Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json({ ok: false, error: "No slots provided." }, { status: 400 });
  }
  const created = [];
  for (const { date, time } of slots) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) continue;
    created.push(await addSlot(date, time));
  }
  return NextResponse.json({ ok: true, created });
}
