import { getDB } from './schema';

interface SeedExercise {
  name: string;
  default_sets: number;
  default_reps: number;
  progression_kg: number;
  has_warmup: boolean;
  animation_key: string;
  sort_order: number;
}

const EXERCISES: SeedExercise[] = [
  { name: 'Squat',          default_sets: 3, default_reps: 5, progression_kg: 2.5,  has_warmup: true,  animation_key: 'squat',          sort_order: 0 },
  { name: 'Bench Press',    default_sets: 3, default_reps: 5, progression_kg: 2.5,  has_warmup: true,  animation_key: 'bench',          sort_order: 1 },
  { name: 'Press',          default_sets: 3, default_reps: 5, progression_kg: 1.25, has_warmup: true,  animation_key: 'press',          sort_order: 2 },
  { name: 'Deadlift',       default_sets: 1, default_reps: 5, progression_kg: 5.0,  has_warmup: true,  animation_key: 'deadlift',       sort_order: 3 },
  { name: 'Latpull',        default_sets: 3, default_reps: 8, progression_kg: 1.25, has_warmup: false, animation_key: 'latpull',        sort_order: 4 },
  { name: 'Hyperextension', default_sets: 3, default_reps: 8, progression_kg: 1.25, has_warmup: false, animation_key: 'hyperextension', sort_order: 5 },
  { name: 'Dips',           default_sets: 3, default_reps: 8, progression_kg: 1.25, has_warmup: false, animation_key: 'dips',           sort_order: 6 },
  { name: 'Bizeps',         default_sets: 3, default_reps: 8, progression_kg: 1.25, has_warmup: false, animation_key: 'biceps',         sort_order: 7 },
  { name: 'Trizeps',        default_sets: 3, default_reps: 8, progression_kg: 1.25, has_warmup: false, animation_key: 'triceps',        sort_order: 8 },
  { name: 'Rudern',         default_sets: 3, default_reps: 8, progression_kg: 1.25, has_warmup: false, animation_key: 'rowing',         sort_order: 9 },
];

interface SeedTemplate {
  name: string;
  exercises: { name: string; sets: number; reps: number }[];
}

const TEMPLATES: SeedTemplate[] = [
  {
    name: 'Tag 1',
    exercises: [
      { name: 'Squat',       sets: 3, reps: 5 },
      { name: 'Bench Press',  sets: 3, reps: 5 },
      { name: 'Deadlift',     sets: 1, reps: 5 },
      { name: 'Bizeps',       sets: 3, reps: 8 },
      { name: 'Trizeps',      sets: 3, reps: 8 },
    ],
  },
  {
    name: 'Tag 2',
    exercises: [
      { name: 'Squat',          sets: 3, reps: 5 },
      { name: 'Press',          sets: 3, reps: 5 },
      { name: 'Latpull',        sets: 3, reps: 8 },
      { name: 'Hyperextension', sets: 3, reps: 8 },
      { name: 'Dips',           sets: 3, reps: 8 },
    ],
  },
];

export async function seedDatabase(): Promise<void> {
  const db = await getDB();

  // Check if already seeded
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises'
  );
  if (existing && existing.count > 0) return;

  // Insert exercises
  for (const ex of EXERCISES) {
    await db.runAsync(
      `INSERT INTO exercises (name, default_sets, default_reps, progression_kg, has_warmup, animation_key, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ex.name, ex.default_sets, ex.default_reps, ex.progression_kg, ex.has_warmup ? 1 : 0, ex.animation_key, ex.sort_order]
    );
  }

  // Insert templates
  for (const tmpl of TEMPLATES) {
    const result = await db.runAsync('INSERT INTO templates (name) VALUES (?)', [tmpl.name]);
    const templateId = result.lastInsertRowId;

    for (let i = 0; i < tmpl.exercises.length; i++) {
      const ex = tmpl.exercises[i];
      const exerciseRow = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM exercises WHERE name = ?',
        [ex.name]
      );
      if (exerciseRow) {
        await db.runAsync(
          'INSERT INTO template_exercises (template_id, exercise_id, sets, reps, sort_order) VALUES (?, ?, ?, ?, ?)',
          [templateId, exerciseRow.id, ex.sets, ex.reps, i]
        );
      }
    }
  }
}
