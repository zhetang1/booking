import { describe, it, expect } from "vitest";
import { formatDate, formatTime, groupByDate } from "@/lib/format";

describe("formatTime", () => {
  it("formats 24h times as 12h with AM/PM", () => {
    expect(formatTime("09:00")).toBe("9:00 AM");
    expect(formatTime("00:30")).toBe("12:30 AM");
    expect(formatTime("12:00")).toBe("12:00 PM");
    expect(formatTime("13:05")).toBe("1:05 PM");
    expect(formatTime("23:45")).toBe("11:45 PM");
  });
});

describe("formatDate", () => {
  it("formats an ISO date without timezone drift", () => {
    // Parsed as local date, so the day never shifts.
    expect(formatDate("2026-06-15")).toBe("Mon, Jun 15");
    expect(formatDate("2026-01-01")).toBe("Thu, Jan 1");
  });
});

describe("groupByDate", () => {
  it("groups items by their date in insertion order", () => {
    const items = [
      { date: "2026-06-15", time: "09:00" },
      { date: "2026-06-15", time: "10:00" },
      { date: "2026-06-16", time: "09:00" },
    ];
    const grouped = groupByDate(items);
    expect(grouped).toHaveLength(2);
    expect(grouped[0][0]).toBe("2026-06-15");
    expect(grouped[0][1]).toHaveLength(2);
    expect(grouped[1][0]).toBe("2026-06-16");
    expect(grouped[1][1]).toHaveLength(1);
  });
});
