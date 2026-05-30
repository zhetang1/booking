import postgres from "postgres";

// Postgres-backed store. Works locally against any Postgres and on Vercel with
// a Marketplace database (e.g. Neon). Set DATABASE_URL in your environment.
//
// The public API below is intentionally small so callers don't depend on the
// storage engine.

export type BookingStatus = "pending" | "confirmed";

export type Booking = {
  name: string;
  phone: string;
  email: string | null;
  status: BookingStatus;
  createdAt: string;
};

export type Slot = {
  id: string;
  // ISO date, e.g. "2026-06-15"
  date: string;
  // 24h time, e.g. "14:30"
  time: string;
  durationMins: number;
  booking: Booking | null;
};

declare global {
  // Reuse the client and init promise across hot reloads / warm invocations.
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __dbInit: Promise<void> | undefined;
}

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (see .env.example)."
    );
  }
  if (!global.__sql) {
    global.__sql = postgres(url, {
      // Neon/most managed Postgres require SSL; ignore for local plain connections.
      ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : "require",
    });
  }
  return global.__sql;
}

// Test-only: close the pooled connection and reset cached state so the test
// runner can exit cleanly. Not used in app code.
export async function _closeForTests(): Promise<void> {
  if (global.__sql) {
    await global.__sql.end();
    global.__sql = undefined;
  }
  global.__dbInit = undefined;
}

async function ensureSchema(): Promise<void> {
  if (!global.__dbInit) {
    const sql = client();
    global.__dbInit = (async () => {
      await sql`
        create table if not exists slots (
          id text primary key,
          date text not null,
          "time" text not null,
          duration_mins int not null default 30,
          booking_name text,
          booking_phone text,
          booking_email text,
          booking_status text,
          booked_at timestamptz,
          unique (date, "time")
        )
      `;
      // Add columns for tables created before these fields were introduced.
      await sql`alter table slots add column if not exists booking_email text`;
      await sql`alter table slots add column if not exists booking_status text`;
    })();
  }
  return global.__dbInit;
}

type Row = {
  id: string;
  date: string;
  time: string;
  duration_mins: number;
  booking_name: string | null;
  booking_phone: string | null;
  booking_email: string | null;
  booking_status: string | null;
  booked_at: Date | null;
};

function toSlot(r: Row): Slot {
  return {
    id: r.id,
    date: r.date,
    time: r.time,
    durationMins: r.duration_mins,
    booking: r.booking_name
      ? {
          name: r.booking_name,
          phone: r.booking_phone ?? "",
          email: r.booking_email ?? null,
          status: r.booking_status === "confirmed" ? "confirmed" : "pending",
          createdAt: r.booked_at ? r.booked_at.toISOString() : "",
        }
      : null,
  };
}

export async function getSlots(): Promise<Slot[]> {
  await ensureSchema();
  const sql = client();
  const rows = await sql<Row[]>`
    select id, date, "time", duration_mins, booking_name, booking_phone, booking_email, booking_status, booked_at
    from slots
    order by date asc, "time" asc
  `;
  return rows.map(toSlot);
}

// Only future/today, available slots — what customers may book.
export async function getAvailableSlots(): Promise<Slot[]> {
  await ensureSchema();
  const sql = client();
  const today = new Date().toISOString().slice(0, 10);
  const rows = await sql<Row[]>`
    select id, date, "time", duration_mins, booking_name, booking_phone, booking_email, booking_status, booked_at
    from slots
    where booking_name is null and date >= ${today}
    order by date asc, "time" asc
  `;
  return rows.map(toSlot);
}

export async function addSlot(date: string, time: string): Promise<Slot> {
  await ensureSchema();
  const sql = client();
  const id = `${date}_${time}_${Math.random().toString(36).slice(2, 8)}`;
  const rows = await sql<Row[]>`
    insert into slots (id, date, "time", duration_mins)
    values (${id}, ${date}, ${time}, 30)
    on conflict (date, "time") do update set date = excluded.date
    returning id, date, "time", duration_mins, booking_name, booking_phone, booking_email, booking_status, booked_at
  `;
  return toSlot(rows[0]);
}

export async function removeSlot(id: string): Promise<void> {
  await ensureSchema();
  const sql = client();
  await sql`delete from slots where id = ${id}`;
}

export async function bookSlot(
  id: string,
  name: string,
  phone: string,
  email: string | null = null
): Promise<{ ok: true; slot: Slot } | { ok: false; error: string }> {
  await ensureSchema();
  const sql = client();
  // Atomic guard: only books if the slot is still open. New bookings are pending
  // until the owner confirms them.
  const rows = await sql<Row[]>`
    update slots
    set booking_name = ${name}, booking_phone = ${phone}, booking_email = ${email},
        booking_status = 'pending', booked_at = now()
    where id = ${id} and booking_name is null
    returning id, date, "time", duration_mins, booking_name, booking_phone, booking_email, booking_status, booked_at
  `;
  if (rows.length > 0) {
    return { ok: true, slot: toSlot(rows[0]) };
  }
  const existing = await sql<Row[]>`select id from slots where id = ${id}`;
  if (existing.length === 0) {
    return { ok: false, error: "That time slot no longer exists." };
  }
  return { ok: false, error: "Sorry, that time was just booked." };
}

// Owner confirms a pending booking. Returns the updated slot, or null if the
// slot doesn't exist / has no booking.
export async function confirmSlot(id: string): Promise<Slot | null> {
  await ensureSchema();
  const sql = client();
  const rows = await sql<Row[]>`
    update slots
    set booking_status = 'confirmed'
    where id = ${id} and booking_name is not null
    returning id, date, "time", duration_mins, booking_name, booking_phone, booking_email, booking_status, booked_at
  `;
  return rows.length > 0 ? toSlot(rows[0]) : null;
}

// Owner cancels/declines a booking. Clears the booking so the slot is open
// again, and returns the slot *with the cancelled booking still attached* so
// the customer can be notified. Returns null if there was no booking.
export async function cancelBooking(id: string): Promise<Slot | null> {
  await ensureSchema();
  const sql = client();
  const before = await sql<Row[]>`
    select id, date, "time", duration_mins, booking_name, booking_phone, booking_email, booking_status, booked_at
    from slots
    where id = ${id} and booking_name is not null
  `;
  if (before.length === 0) return null;
  await sql`
    update slots
    set booking_name = null, booking_phone = null, booking_email = null,
        booking_status = null, booked_at = null
    where id = ${id}
  `;
  return toSlot(before[0]);
}
