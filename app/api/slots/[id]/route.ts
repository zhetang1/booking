import { NextRequest, NextResponse } from "next/server";
import { removeSlot, confirmSlot, cancelBooking } from "@/lib/db";
import { isOwner } from "@/lib/auth";
import { sendConfirmedNotification, sendCancelledNotification } from "@/lib/notify";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isOwner())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  const { id } = await params;
  await removeSlot(id);
  return NextResponse.json({ ok: true });
}

// Owner confirms or cancels/declines a booking.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isOwner())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (body?.action === "confirm") {
    const slot = await confirmSlot(id);
    if (!slot) {
      return NextResponse.json(
        { ok: false, error: "No booking to confirm." },
        { status: 404 }
      );
    }
    await sendConfirmedNotification(slot);
    return NextResponse.json({ ok: true, slot });
  }

  if (body?.action === "cancel") {
    // Slot carries the cancelled booking so we can notify the customer; the
    // slot itself is now open again in the database.
    const slot = await cancelBooking(id);
    if (!slot) {
      return NextResponse.json(
        { ok: false, error: "No booking to cancel." },
        { status: 404 }
      );
    }
    await sendCancelledNotification(slot);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
