import { NextRequest, NextResponse } from "next/server";
import { createSession, adminPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (password !== adminPassword()) {
    return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 401 });
  }
  await createSession();
  return NextResponse.json({ ok: true });
}
