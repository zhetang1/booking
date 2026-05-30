import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import postgres from "postgres";
import {
  addSlot,
  getSlots,
  getAvailableSlots,
  bookSlot,
  confirmSlot,
  cancelBooking,
  removeSlot,
  _closeForTests,
} from "@/lib/db";

// Raw client used only to reset the table between tests.
const sql = postgres(process.env.DATABASE_URL!, { ssl: false });

// A date safely in the future and one in the past, relative to "now".
const FUTURE = "2099-06-15";
const PAST = "2000-01-01";

beforeAll(async () => {
  // Trigger schema creation through the data layer.
  await getSlots();
});

beforeEach(async () => {
  await sql`truncate table slots`;
});

afterAll(async () => {
  await sql.end();
  await _closeForTests();
});

describe("addSlot / getSlots", () => {
  it("adds a slot with sensible defaults", async () => {
    const slot = await addSlot(FUTURE, "10:00");
    expect(slot.date).toBe(FUTURE);
    expect(slot.time).toBe("10:00");
    expect(slot.durationMins).toBe(30);
    expect(slot.booking).toBeNull();
  });

  it("is idempotent for the same date+time (no duplicates)", async () => {
    await addSlot(FUTURE, "10:00");
    await addSlot(FUTURE, "10:00");
    const slots = await getSlots();
    expect(slots).toHaveLength(1);
  });

  it("returns slots sorted by date then time", async () => {
    await addSlot(FUTURE, "11:00");
    await addSlot(FUTURE, "09:00");
    await addSlot(PAST, "08:00");
    const slots = await getSlots();
    expect(slots.map((s) => `${s.date} ${s.time}`)).toEqual([
      `${PAST} 08:00`,
      `${FUTURE} 09:00`,
      `${FUTURE} 11:00`,
    ]);
  });
});

describe("getAvailableSlots", () => {
  it("hides past dates and booked slots from the public", async () => {
    const open = await addSlot(FUTURE, "09:00");
    await addSlot(FUTURE, "10:00");
    await addSlot(PAST, "09:00");

    // Book the 10:00 slot.
    const booked = (await getSlots()).find((s) => s.time === "10:00")!;
    await bookSlot(booked.id, "Jane Doe", "2015550123");

    const available = await getAvailableSlots();
    expect(available).toHaveLength(1);
    expect(available[0].id).toBe(open.id);
  });
});

describe("bookSlot", () => {
  it("books an open slot as pending", async () => {
    const slot = await addSlot(FUTURE, "10:00");
    const res = await bookSlot(slot.id, "Jane Doe", "2015550123", "jane@example.com");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.slot.booking).toMatchObject({
        name: "Jane Doe",
        phone: "2015550123",
        email: "jane@example.com",
        status: "pending",
      });
    }
  });

  it("prevents double-booking", async () => {
    const slot = await addSlot(FUTURE, "10:00");
    const first = await bookSlot(slot.id, "Jane Doe", "2015550123");
    expect(first.ok).toBe(true);

    const second = await bookSlot(slot.id, "Bob Smith", "2015559999");
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toMatch(/just booked/i);
  });

  it("rejects booking a nonexistent slot", async () => {
    const res = await bookSlot("does-not-exist", "Jane Doe", "2015550123");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/no longer exists/i);
  });

  it("stores a null email when none is given", async () => {
    const slot = await addSlot(FUTURE, "10:00");
    const res = await bookSlot(slot.id, "Jane Doe", "2015550123");
    if (res.ok) expect(res.slot.booking?.email).toBeNull();
  });
});

describe("confirmSlot", () => {
  it("turns a pending booking into confirmed", async () => {
    const slot = await addSlot(FUTURE, "10:00");
    await bookSlot(slot.id, "Jane Doe", "2015550123");
    const confirmed = await confirmSlot(slot.id);
    expect(confirmed?.booking?.status).toBe("confirmed");
  });

  it("returns null when there is no booking to confirm", async () => {
    const slot = await addSlot(FUTURE, "10:00");
    expect(await confirmSlot(slot.id)).toBeNull();
  });
});

describe("cancelBooking", () => {
  it("clears the booking and reopens the slot, returning the cancelled booking", async () => {
    const slot = await addSlot(FUTURE, "10:00");
    await bookSlot(slot.id, "Jane Doe", "2015550123", "jane@example.com");
    await confirmSlot(slot.id);

    const cancelled = await cancelBooking(slot.id);
    // The returned slot carries the cancelled booking (for notifications)...
    expect(cancelled?.booking).toMatchObject({
      name: "Jane Doe",
      status: "confirmed",
    });
    // ...but the slot is open again and bookable.
    const available = await getAvailableSlots();
    expect(available.map((s) => s.id)).toContain(slot.id);
  });

  it("returns null when there is no booking to cancel", async () => {
    const slot = await addSlot(FUTURE, "10:00");
    expect(await cancelBooking(slot.id)).toBeNull();
  });
});

describe("removeSlot", () => {
  it("deletes the slot entirely", async () => {
    const slot = await addSlot(FUTURE, "10:00");
    await removeSlot(slot.id);
    expect(await getSlots()).toHaveLength(0);
  });
});
