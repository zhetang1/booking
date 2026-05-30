import { NextRequest, NextResponse } from "next/server";
import { bookSlot } from "@/lib/db";
import { sendBookingRequestNotifications } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id: string = body?.id ?? "";
  const name: string = (body?.name ?? "").trim();
  const phone: string = (body?.phone ?? "").trim();
  const email: string = (body?.email ?? "").trim();

  if (!id) return NextResponse.json({ ok: false, error: "Missing time slot." }, { status: 400 });
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

  const result = await bookSlot(id, name, phone, email || null);
  if (!result.ok) return NextResponse.json(result, { status: 409 });

  // Email Natalie (to confirm) + the customer (request received). Awaited so it
  // runs before the function suspends on serverless; never throws.
  await sendBookingRequestNotifications(result.slot);

  return NextResponse.json(result);
}
