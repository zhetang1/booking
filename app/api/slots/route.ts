import { NextRequest, NextResponse } from "next/server";
import { addSlot, getSlots, getAvailableSlots } from "@/lib/db";
import { isOwner } from "@/lib/auth";

export async function GET() {
  // Owners see every slot (incl. who booked it); customers see open slots only.
  if (await isOwner()) {
    return NextResponse.json({ slots: await getSlots(), owner: true });
  }
  return NextResponse.json({ slots: await getAvailableSlots(), owner: false });
}

export async function POST(req: NextRequest) {
  if (!(await isOwner())) {
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
