import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Slot } from "@/lib/db";
import {
  sendBookingRequestNotifications,
  sendConfirmedNotification,
  sendCancelledNotification,
} from "@/lib/notify";

function slot(overrides: Partial<Slot["booking"]> = {}): Slot {
  return {
    id: "s1",
    date: "2099-06-15",
    time: "10:00",
    durationMins: 30,
    booking: {
      name: "Jane Doe",
      phone: "2015550123",
      email: "jane@example.com",
      status: "pending",
      createdAt: new Date().toISOString(),
      ...overrides,
    },
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function configureResend() {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("EMAIL_FROM", "Natalie <bookings@example.com>");
  vi.stubEnv("ADMIN_EMAIL", "natalie@example.com");
}

describe("when Resend is not configured", () => {
  it("does not call fetch (no-op + logs)", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await sendBookingRequestNotifications(slot());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("sendBookingRequestNotifications", () => {
  it("emails both the admin and the customer", async () => {
    configureResend();
    await sendBookingRequestNotifications(slot());
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const recipients = fetchMock.mock.calls.map(
      ([, init]) => JSON.parse(init.body as string).to
    );
    expect(recipients).toContain("natalie@example.com");
    expect(recipients).toContain("jane@example.com");

    // Sanity-check the request shape.
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
  });

  it("emails only the admin when the customer left no email", async () => {
    configureResend();
    await sendBookingRequestNotifications(slot({ email: null }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.to).toBe("natalie@example.com");
  });
});

describe("sendConfirmedNotification", () => {
  it("emails the customer a confirmation", async () => {
    configureResend();
    await sendConfirmedNotification(slot({ status: "confirmed" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.to).toBe("jane@example.com");
    expect(body.subject).toMatch(/confirmed/i);
  });

  it("does nothing when the customer left no email", async () => {
    configureResend();
    await sendConfirmedNotification(slot({ email: null }));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("sendCancelledNotification", () => {
  it("uses 'cancelled' wording for a confirmed booking", async () => {
    configureResend();
    await sendCancelledNotification(slot({ status: "confirmed" }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.subject).toMatch(/cancelled/i);
  });

  it("uses 'request' wording for a pending booking", async () => {
    configureResend();
    await sendCancelledNotification(slot({ status: "pending" }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.subject).toMatch(/request/i);
  });
});
