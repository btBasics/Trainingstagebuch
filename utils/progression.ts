import { getLastTwoWeightsForExercise } from '../db/queries';

/**
 * Default progression increments per exercise (kg).
 */
const PROGRESSION_DEFAULTS: Record<string, number> = {
  'Squat': 2.5,
  'Bench Press': 2.5,
  'Press': 1.25,
  'Deadlift': 5.0,
};
const DEFAULT_INCREMENT = 1.25;

export function getProgressionIncrement(exerciseName: string, customIncrement?: number): number {
  if (customIncrement != null) return customIncrement;
  return PROGRESSION_DEFAULTS[exerciseName] ?? DEFAULT_INCREMENT;
}

/**
 * Calculates the suggested weight for the next training session.
 */
export function getNextWeight(lastWeight: number, exerciseName: string, customIncrement?: number): number {
  const increment = getProgressionIncrement(exerciseName, customIncrement);
  return lastWeight + increment;
}

/**
 * Checks if the entered weight is a stagnation (same or lower than last time).
 * Also triggers on first-ever entry (welcome shock).
 * Returns the type of event.
 */
export async function checkStagnation(
  exerciseId: number,
  enteredWeight: number
): Promise<'stagnation' | 'first_entry' | 'progression'> {
  const lastWeights = await getLastTwoWeightsForExercise(exerciseId);

  if (lastWeights.length === 0) {
    return 'first_entry';
  }

  const lastWeight = lastWeights[0];
  if (enteredWeight <= lastWeight) {
    return 'stagnation';
  }

  return 'progression';
}

/**
 * Checks if current weight is a new personal record.
 */
export function isPersonalRecord(currentWeight: number, previousPR: number | null): boolean {
  if (previousPR == null) return true;
  return currentWeight > previousPR;
}
