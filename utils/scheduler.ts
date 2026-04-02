import { getRecentWorkouts } from '../db/queries';

/**
 * Training schedule pattern: T-R-T-R-T-R-R
 * (Train, Rest, Train, Rest, Train, Rest, Rest)
 * Repeating 7-day cycle.
 *
 * Templates alternate: Tag 1, Tag 2, Tag 1, Tag 2...
 */

const SCHEDULE_PATTERN = [true, false, true, false, true, false, false]; // 7-day cycle

/**
 * Gets the next training date from today based on the T-R-T-R-T-R-R pattern.
 * Anchored to the last training date or today if no history.
 */
export function getNextTrainingDate(lastTrainingDate?: Date): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!lastTrainingDate) {
    return today; // First training is today
  }

  const anchor = new Date(lastTrainingDate);
  anchor.setHours(0, 0, 0, 0);

  // Find which day in the cycle the last training was
  const daysSinceAnchor = Math.floor((today.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));

  // If today is the same day, next training is in 2 days (skip rest day)
  if (daysSinceAnchor === 0) {
    const next = new Date(today);
    next.setDate(next.getDate() + 2);
    return next;
  }

  // Walk forward from anchor through the pattern to find next training day >= today
  for (let offset = daysSinceAnchor; offset < daysSinceAnchor + 7; offset++) {
    const cycleDay = offset % SCHEDULE_PATTERN.length;
    if (SCHEDULE_PATTERN[cycleDay]) {
      const candidate = new Date(anchor);
      candidate.setDate(candidate.getDate() + offset);
      if (candidate >= today) {
        return candidate;
      }
    }
  }

  // Fallback: today
  return today;
}

/**
 * Gets the next template ID to use (alternating 1-2-1-2...).
 */
export async function getNextTemplateId(templateIds: number[]): Promise<number> {
  if (templateIds.length === 0) return 1;
  if (templateIds.length === 1) return templateIds[0];

  const recent = await getRecentWorkouts(1);
  if (recent.length === 0) return templateIds[0];

  const lastTemplateId = recent[0].template_id;
  const lastIndex = templateIds.indexOf(lastTemplateId ?? templateIds[0]);
  const nextIndex = (lastIndex + 1) % templateIds.length;
  return templateIds[nextIndex];
}

/**
 * Checks if today is a training day based on the pattern.
 */
export function isTrainingDay(lastTrainingDate?: Date): boolean {
  const nextDate = getNextTrainingDate(lastTrainingDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate.getTime() === today.getTime();
}

/**
 * Returns the next N scheduled training dates with template IDs.
 */
export function getUpcomingSchedule(
  startDate: Date,
  templateIds: number[],
  startTemplateIndex: number,
  count: number
): { date: Date; templateId: number }[] {
  const schedule: { date: Date; templateId: number }[] = [];
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  let templateIndex = startTemplateIndex;
  let cycleDay = 0;

  while (schedule.length < count) {
    if (SCHEDULE_PATTERN[cycleDay % SCHEDULE_PATTERN.length]) {
      schedule.push({
        date: new Date(currentDate),
        templateId: templateIds[templateIndex % templateIds.length],
      });
      templateIndex++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
    cycleDay++;
  }

  return schedule;
}

/**
 * Format a date for display (German).
 */
export function formatDate(date: Date): string {
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const day = days[date.getDay()];
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}, ${d}.${m}.`;
}

export function formatDateFull(date: Date): string {
  const months = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate()
    && date.getMonth() === today.getMonth()
    && date.getFullYear() === today.getFullYear();
}
