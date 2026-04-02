/**
 * Rounds weight to the nearest 2.5 kg (achievable with 1.25 kg plates per side).
 */
export function roundToPlate(weight: number): number {
  return Math.round(weight / 2.5) * 2.5;
}

export interface WarmupSet {
  weight: number;
  reps: number;
  percentage: number | null; // null = empty bar
}

/**
 * Calculates warm-up sets for a given working weight.
 * Pattern: Empty bar ×5, 45% ×4, 60% ×3, 80% ×2
 * All weights rounded to nearest 2.5 kg.
 */
export function calculateWarmupSets(workingWeight: number, barWeight = 20): WarmupSet[] {
  if (workingWeight <= barWeight) {
    return []; // No warm-up needed if working with empty bar
  }

  const sets: WarmupSet[] = [
    { weight: barWeight, reps: 5, percentage: null },
  ];

  const percentages = [
    { pct: 0.45, reps: 4 },
    { pct: 0.60, reps: 3 },
    { pct: 0.80, reps: 2 },
  ];

  for (const { pct, reps } of percentages) {
    const w = roundToPlate(workingWeight * pct);
    // Skip if same as bar weight or previous set
    if (w > barWeight && w < workingWeight) {
      // Avoid duplicates
      const lastWeight = sets[sets.length - 1].weight;
      if (w > lastWeight) {
        sets.push({ weight: w, reps, percentage: pct * 100 });
      }
    }
  }

  return sets;
}
