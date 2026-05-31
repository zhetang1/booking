import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// --- Mocks: isolate route logic from the database and email sending. ---
vi.mock("@/lib/db", () => ({
  bookSlot: vi.fn(),
  confirmSlot: vi.fn(),
  cancelBooking: vi.fn(),
  removeSlot: vi.fn(),
}));
vi.mock("@/lib/notify", () => ({
  sendBookingRequestNotifications: vi.fn(),
  sendConfirmedNotification: vi.fn(),
  sendCancelledNotification: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  isAdmin: vi.fn(),
}));

import { POST as book } from "@/app/api/book/route";
import { PATCH, DELETE } from "@/app/api/slots/[id]/route";
import * as db from "@/lib/db";
import * as auth from "@/lib/auth";

function req(body: unknown): NextRequest {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/book — validation", () => {
  const valid = { id: "s1", name: "Jane Doe", phone: "2015550123" };

  it("rejects a missing slot id", async () => {
    const res = await book(req({ ...valid, id: "" }));
    expect(res.status).toBe(400);
  });

  it("rejects a too-short name", async () => {
    const res = await book(req({ ...valid, name: "J" }));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid phone", async () => {
    const res = await book(req({ ...valid, phone: "123" }));
    expect(res.status).toBe(400);
  });

  it("rejects a malformed email", async () => {
    const res = await book(req({ ...valid, email: "nope" }));
    expect(res.status).toBe(400);
  });

  it("books a valid request and fires notifications", async () => {
    const slot = { id: "s1", booking: { name: "Jane Doe" } };
    vi.mocked(db.bookSlot).mockResolvedValue({ ok: true, slot } as never);
    const notify = await import("@/lib/notify");

    const res = await book(req(valid));
    expect(res.status).toBe(200);
    expect(db.bookSlot).toHaveBeenCalledWith("s1", "Jane Doe", "2015550123", null);
    expect(notify.sendBookingRequestNotifications).toHaveBeenCalledWith(slot);
  });

  it("returns 409 when the slot is already taken", async () => {
    vi.mocked(db.bookSlot).mockResolvedValue({
      ok: false,
      error: "Sorry, that time was just booked.",
    } as never);
    const res = await book(req(valid));
    expect(res.status).toBe(409);
  });

  it("books multiple slots from an ids array and notifies for each", async () => {
    vi.mocked(db.bookSlot).mockImplementation(
      async (id: string) => ({ ok: true, slot: { id, booking: { name: "Jane Doe" } } }) as never
    );
    const notify = await import("@/lib/notify");

    const res = await book(req({ ids: ["s1", "s2", "s3"], name: "Jane Doe", phone: "2015550123" }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(db.bookSlot).toHaveBeenCalledTimes(3);
    expect(data.booked).toHaveLength(3);
    expect(notify.sendBookingRequestNotifications).toHaveBeenCalledTimes(3);
  });

  it("returns the booked subset (200) when some slots in the batch are taken", async () => {
    vi.mocked(db.bookSlot).mockImplementation(
      async (id: string) =>
        (id === "taken"
          ? { ok: false, error: "Sorry, that time was just booked." }
          : { ok: true, slot: { id, booking: { name: "Jane Doe" } } }) as never
    );

    const res = await book(req({ ids: ["s1", "taken"], name: "Jane Doe", phone: "2015550123" }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.booked).toHaveLength(1);
    expect(data.failures).toHaveLength(1);
  });

  it("returns 409 when every slot in the batch is taken", async () => {
    vi.mocked(db.bookSlot).mockResolvedValue({
      ok: false,
      error: "Sorry, that time was just booked.",
    } as never);
    const res = await book(req({ ids: ["a", "b"], name: "Jane Doe", phone: "2015550123" }));
    expect(res.status).toBe(409);
  });
});

describe("PATCH /api/slots/[id] — confirm/cancel", () => {
  it("requires admin auth", async () => {
    vi.mocked(auth.isAdmin).mockResolvedValue(false);
    const res = await PATCH(req({ action: "confirm" }), params("s1"));
    expect(res.status).toBe(401);
    expect(db.confirmSlot).not.toHaveBeenCalled();
  });

  it("rejects an unknown action", async () => {
    vi.mocked(auth.isAdmin).mockResolvedValue(true);
    const res = await PATCH(req({ action: "explode" }), params("s1"));
    expect(res.status).toBe(400);
  });

  it("confirms a booking and notifies the customer", async () => {
    vi.mocked(auth.isAdmin).mockResolvedValue(true);
    const slot = { id: "s1", booking: { status: "confirmed" } };
    vi.mocked(db.confirmSlot).mockResolvedValue(slot as never);
    const notify = await import("@/lib/notify");

    const res = await PATCH(req({ action: "confirm" }), params("s1"));
    expect(res.status).toBe(200);
    expect(notify.sendConfirmedNotification).toHaveBeenCalledWith(slot);
  });

  it("returns 404 confirming when there is no booking", async () => {
    vi.mocked(auth.isAdmin).mockResolvedValue(true);
    vi.mocked(db.confirmSlot).mockResolvedValue(null);
    const res = await PATCH(req({ action: "confirm" }), params("s1"));
    expect(res.status).toBe(404);
  });

  it("cancels a booking and notifies the customer", async () => {
    vi.mocked(auth.isAdmin).mockResolvedValue(true);
    const slot = { id: "s1", booking: { status: "pending" } };
    vi.mocked(db.cancelBooking).mockResolvedValue(slot as never);
    const notify = await import("@/lib/notify");

    const res = await PATCH(req({ action: "cancel" }), params("s1"));
    expect(res.status).toBe(200);
    expect(notify.sendCancelledNotification).toHaveBeenCalledWith(slot);
  });
});

describe("DELETE /api/slots/[id]", () => {
  it("requires admin auth", async () => {
    vi.mocked(auth.isAdmin).mockResolvedValue(false);
    const res = await DELETE(req({}), params("s1"));
    expect(res.status).toBe(401);
    expect(db.removeSlot).not.toHaveBeenCalled();
  });

  it("removes a slot for an authorized admin", async () => {
    vi.mocked(auth.isAdmin).mockResolvedValue(true);
    const res = await DELETE(req({}), params("s1"));
    expect(res.status).toBe(200);
    expect(db.removeSlot).toHaveBeenCalledWith("s1");
  });
});
