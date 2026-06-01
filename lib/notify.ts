import type { Slot } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/format";

// Sends email via Resend's REST API (no SDK dependency). If Resend env vars are
// missing, this is a no-op so the app keeps working in development.

function resendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const cfg = resendConfig();
  if (!cfg) {
    console.log(`[notify] Resend not configured — would email ${to}: ${subject}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: cfg.from, to, subject, html }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[notify] Resend error ${res.status}: ${detail}`);
  }
}

function layout(body: string): string {
  return `<div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:0 auto;color:#0f172a">
    <div style="background:#3a5ba8;color:#f2e85c;padding:20px 24px;border-radius:12px 12px 0 0;font-weight:800;font-size:20px">
      🏊 Swim Lessons with Natalie
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      ${body}
    </div>
  </div>`;
}

// Fired when a customer submits a booking (pending). Emails Natalie so she can
// confirm, and, if provided, lets the customer know their request was received.
// Never throws — failures must not fail the booking.
export async function sendBookingRequestNotifications(slot: Slot): Promise<void> {
  if (!slot.booking) return;
  const when = `${formatDate(slot.date)} at ${formatTime(slot.time)}`;
  const { name, phone, email } = slot.booking;

  const tasks: Promise<void>[] = [];

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    tasks.push(
      sendEmail(
        adminEmail,
        `New lesson request — ${when}`,
        layout(`
          <h2 style="margin:0 0 12px">New lesson request 🏊</h2>
          <p style="margin:0 0 8px"><strong>When:</strong> ${when} (30 min)</p>
          <p style="margin:0 0 8px"><strong>Customer:</strong> ${name}</p>
          <p style="margin:0 0 8px"><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
          ${email ? `<p style="margin:0 0 8px"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>` : ""}
          <p style="margin:16px 0 0;color:#475569">Log in to your dashboard to <strong>confirm</strong> this booking. Remember to collect cash or Venmo at the lesson.</p>
        `)
      )
    );
  }

  if (email) {
    tasks.push(
      sendEmail(
        email,
        `Lesson request received — ${when}`,
        layout(`
          <h2 style="margin:0 0 12px">Request received! 🙌</h2>
          <p style="margin:0 0 8px">Hi ${name}, we got your request for a swimming lesson with Natalie:</p>
          <p style="margin:0 0 8px;font-size:18px"><strong>${when}</strong> · 30 minutes</p>
          <p style="margin:16px 0 0;color:#475569">Your spot is held while Natalie confirms — you'll get one more email once it's confirmed. Payment in cash or Venmo at the lesson.</p>
        `)
      )
    );
  }

  try {
    await Promise.all(tasks);
  } catch (err) {
    console.error("[notify] Failed to send booking request notifications:", err);
  }
}

// Fired when the admin cancels/declines a booking. Lets the customer know.
// The message is tailored to whether the booking was pending or confirmed.
// Never throws.
export async function sendCancelledNotification(slot: Slot): Promise<void> {
  if (!slot.booking?.email) return;
  const when = `${formatDate(slot.date)} at ${formatTime(slot.time)}`;
  const { name, email, status } = slot.booking;
  const wasConfirmed = status === "confirmed";

  try {
    await sendEmail(
      email!,
      wasConfirmed
        ? `Your swim lesson was cancelled — ${when}`
        : `Update on your lesson request — ${when}`,
      layout(`
        <h2 style="margin:0 0 12px">${wasConfirmed ? "Lesson cancelled" : "Request couldn't be confirmed"}</h2>
        <p style="margin:0 0 8px">Hi ${name},</p>
        <p style="margin:0 0 8px">${
          wasConfirmed
            ? `Unfortunately Natalie had to cancel your confirmed lesson on <strong>${when}</strong>.`
            : `Unfortunately Natalie wasn't able to confirm your requested lesson on <strong>${when}</strong>.`
        }</p>
        <p style="margin:16px 0 0;color:#475569">Feel free to book another slot, and sorry for the inconvenience!</p>
      `)
    );
  } catch (err) {
    console.error("[notify] Failed to send cancellation notification:", err);
  }
}

// Fired when the admin confirms a booking. Lets the customer know they're set.
// Never throws.
export async function sendConfirmedNotification(slot: Slot): Promise<void> {
  if (!slot.booking?.email) return;
  const when = `${formatDate(slot.date)} at ${formatTime(slot.time)}`;
  const { name, email } = slot.booking;

  try {
    await sendEmail(
      email!,
      `Your swim lesson is confirmed — ${when}`,
      layout(`
        <h2 style="margin:0 0 12px">You're confirmed! 🎉</h2>
        <p style="margin:0 0 8px">Hi ${name}, Natalie confirmed your swimming lesson:</p>
        <p style="margin:0 0 8px;font-size:18px"><strong>${when}</strong> · 30 minutes</p>
        <p style="margin:16px 0 0;color:#475569">Please bring cash or be ready to pay by Venmo at the lesson. See you at the pool!</p>
      `)
    );
  } catch (err) {
    console.error("[notify] Failed to send confirmation notification:", err);
  }
}
