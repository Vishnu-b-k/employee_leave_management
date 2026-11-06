import { prisma } from "@/lib/prisma";

export interface WorkingDaysResult {
  workingDays: number;
  totalDays: number;
  holidayCount: number;
  weekendCount: number;
  holidaysEncountered: string[];
}

/**
 * Normalizes a date to UTC midnight for consistent date-only comparison.
 */
export function normalizeDate(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date.getTime());
  if (isNaN(d.getTime())) {
    throw new Error("Invalid date provided.");
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Calculates working days between start_date and end_date (inclusive),
 * excluding Saturdays, Sundays, and configured public holidays.
 */
export async function calculateWorkingDays(
  startDateInput: Date | string,
  endDateInput: Date | string
): Promise<WorkingDaysResult> {
  const start = normalizeDate(startDateInput);
  const end = normalizeDate(endDateInput);

  if (start.getTime() > end.getTime()) {
    throw new Error("Start date cannot be after end date.");
  }

  // Fetch configured holidays in the given date window
  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  const holidayDateSet = new Set<string>();
  const holidayNames: string[] = [];

  for (const h of holidays) {
    const holidayNorm = normalizeDate(h.date);
    const dateStr = holidayNorm.toISOString().split("T")[0];
    holidayDateSet.add(dateStr);
    holidayNames.push(`${h.name} (${dateStr})`);
  }

  let workingDays = 0;
  let totalDays = 0;
  let weekendCount = 0;
  let holidayCount = 0;

  const current = new Date(start.getTime());

  while (current.getTime() <= end.getTime()) {
    totalDays++;
    const dayOfWeek = current.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const dateStr = current.toISOString().split("T")[0];

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayDateSet.has(dateStr);

    if (isWeekend) {
      weekendCount++;
    } else if (isHoliday) {
      holidayCount++;
    } else {
      workingDays++;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return {
    workingDays,
    totalDays,
    weekendCount,
    holidayCount,
    holidaysEncountered: holidayNames,
  };
}
