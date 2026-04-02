export interface PlateResult {
  perSide: { weight: number; count: number }[];
  totalWeight: number;
  barWeight: number;
}

const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

/**
 * Calculates which plates to load on each side of the bar.
 * Uses a greedy algorithm: largest plates first.
 */
export function calculatePlates(totalWeight: number, barWeight = 20): PlateResult {
  const result: PlateResult = {
    perSide: [],
    totalWeight,
    barWeight,
  };

  let remaining = (totalWeight - barWeight) / 2;

  if (remaining <= 0) {
    return result;
  }

  for (const plate of AVAILABLE_PLATES) {
    if (remaining >= plate) {
      const count = Math.floor(remaining / plate);
      result.perSide.push({ weight: plate, count });
      remaining -= count * plate;
      remaining = Math.round(remaining * 100) / 100; // Fix floating point
    }
  }

  return result;
}

/**
 * Returns a flat list of plates per side (e.g., [25, 10, 5, 2.5]).
 */
export function getPlateList(totalWeight: number, barWeight = 20): number[] {
  const { perSide } = calculatePlates(totalWeight, barWeight);
  const plates: number[] = [];
  for (const { weight, count } of perSide) {
    for (let i = 0; i < count; i++) {
      plates.push(weight);
    }
  }
  return plates;
}
