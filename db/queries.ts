import { getDB } from './schema';

export interface Exercise {
  id: number;
  name: string;
  default_sets: number;
  default_reps: number;
  progression_kg: number;
  has_warmup: boolean;
  animation_key: string | null;
  sort_order: number;
}

export interface Template {
  id: number;
  name: string;
}

export interface TemplateExercise {
  id: number;
  template_id: number;
  exercise_id: number;
  sets: number;
  reps: number;
  sort_order: number;
}

export interface Workout {
  id: number;
  template_id: number | null;
  template_name: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface WorkoutSet {
  id: number;
  workout_id: number;
  exercise_id: number;
  exercise_name: string;
  set_number: number;
  is_warmup: boolean;
  weight_kg: number | null;
  reps_target: number;
  reps_done: number | null;
  completed: boolean;
  timestamp: string | null;
}

// --- Exercises ---

export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<any>('SELECT * FROM exercises ORDER BY sort_order');
  return rows.map(r => ({ ...r, has_warmup: !!r.has_warmup }));
}

export async function getExerciseById(id: number): Promise<Exercise | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<any>('SELECT * FROM exercises WHERE id = ?', [id]);
  return row ? { ...row, has_warmup: !!row.has_warmup } : null;
}

// --- Templates ---

export async function getAllTemplates(): Promise<Template[]> {
  const db = await getDB();
  return db.getAllAsync<Template>('SELECT * FROM templates ORDER BY id');
}

export async function getTemplateExercises(templateId: number): Promise<(TemplateExercise & { exercise: Exercise })[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(
    `SELECT te.*, e.name, e.default_sets, e.default_reps, e.progression_kg, e.has_warmup, e.animation_key, e.sort_order as ex_sort
     FROM template_exercises te
     JOIN exercises e ON te.exercise_id = e.id
     WHERE te.template_id = ?
     ORDER BY te.sort_order`,
    [templateId]
  );
  return rows.map(r => ({
    id: r.id,
    template_id: r.template_id,
    exercise_id: r.exercise_id,
    sets: r.sets,
    reps: r.reps,
    sort_order: r.sort_order,
    exercise: {
      id: r.exercise_id,
      name: r.name,
      default_sets: r.default_sets,
      default_reps: r.default_reps,
      progression_kg: r.progression_kg,
      has_warmup: !!r.has_warmup,
      animation_key: r.animation_key,
      sort_order: r.ex_sort,
    },
  }));
}

export async function createTemplate(name: string): Promise<number> {
  const db = await getDB();
  const result = await db.runAsync('INSERT INTO templates (name) VALUES (?)', [name]);
  return result.lastInsertRowId;
}

export async function addExerciseToTemplate(
  templateId: number, exerciseId: number, sets: number, reps: number, sortOrder: number
): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT INTO template_exercises (template_id, exercise_id, sets, reps, sort_order) VALUES (?, ?, ?, ?, ?)',
    [templateId, exerciseId, sets, reps, sortOrder]
  );
}

export async function deleteTemplate(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM templates WHERE id = ?', [id]);
}

export async function updateTemplateExercises(
  templateId: number,
  exercises: { exercise_id: number; sets: number; reps: number; sort_order: number }[]
): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM template_exercises WHERE template_id = ?', [templateId]);
  for (const ex of exercises) {
    await db.runAsync(
      'INSERT INTO template_exercises (template_id, exercise_id, sets, reps, sort_order) VALUES (?, ?, ?, ?, ?)',
      [templateId, ex.exercise_id, ex.sets, ex.reps, ex.sort_order]
    );
  }
}

// --- Workouts ---

export async function createWorkout(templateId: number | null, templateName: string | null): Promise<number> {
  const db = await getDB();
  const result = await db.runAsync(
    'INSERT INTO workouts (template_id, template_name, started_at) VALUES (?, ?, ?)',
    [templateId, templateName, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function finishWorkout(workoutId: number): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE workouts SET finished_at = ? WHERE id = ?',
    [new Date().toISOString(), workoutId]
  );
}

export async function getWorkoutById(id: number): Promise<Workout | null> {
  const db = await getDB();
  return db.getFirstAsync<Workout>('SELECT * FROM workouts WHERE id = ?', [id]);
}

export async function getRecentWorkouts(limit = 10): Promise<Workout[]> {
  const db = await getDB();
  return db.getAllAsync<Workout>(
    'SELECT * FROM workouts WHERE finished_at IS NOT NULL ORDER BY started_at DESC LIMIT ?',
    [limit]
  );
}

export async function getWorkoutCount(): Promise<number> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM workouts WHERE finished_at IS NOT NULL'
  );
  return row?.count ?? 0;
}

// --- Workout Sets ---

export async function addWorkoutSet(
  workoutId: number, exerciseId: number, exerciseName: string,
  setNumber: number, isWarmup: boolean, weightKg: number | null, repsTarget: number
): Promise<number> {
  const db = await getDB();
  const result = await db.runAsync(
    `INSERT INTO workout_sets (workout_id, exercise_id, exercise_name, set_number, is_warmup, weight_kg, reps_target)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [workoutId, exerciseId, exerciseName, setNumber, isWarmup ? 1 : 0, weightKg, repsTarget]
  );
  return result.lastInsertRowId;
}

export async function completeWorkoutSet(
  setId: number, weightKg: number, repsDone: number
): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'UPDATE workout_sets SET weight_kg = ?, reps_done = ?, completed = 1, timestamp = ? WHERE id = ?',
    [weightKg, repsDone, new Date().toISOString(), setId]
  );
}

export async function getWorkoutSets(workoutId: number): Promise<WorkoutSet[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM workout_sets WHERE workout_id = ? ORDER BY exercise_id, set_number',
    [workoutId]
  );
  return rows.map(r => ({ ...r, is_warmup: !!r.is_warmup, completed: !!r.completed }));
}

export async function getLastWeightForExercise(exerciseId: number): Promise<number | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ weight_kg: number }>(
    `SELECT weight_kg FROM workout_sets
     WHERE exercise_id = ? AND is_warmup = 0 AND completed = 1 AND weight_kg IS NOT NULL
     ORDER BY timestamp DESC LIMIT 1`,
    [exerciseId]
  );
  return row?.weight_kg ?? null;
}

export async function getLastTwoWeightsForExercise(exerciseId: number): Promise<number[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{ weight_kg: number }>(
    `SELECT DISTINCT weight_kg FROM (
       SELECT weight_kg, MAX(timestamp) as latest
       FROM workout_sets
       WHERE exercise_id = ? AND is_warmup = 0 AND completed = 1 AND weight_kg IS NOT NULL
       GROUP BY workout_id
       ORDER BY latest DESC
       LIMIT 2
     )`,
    [exerciseId]
  );
  return rows.map(r => r.weight_kg);
}

export async function getPersonalRecord(exerciseId: number): Promise<number | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ max_weight: number }>(
    `SELECT MAX(weight_kg) as max_weight FROM workout_sets
     WHERE exercise_id = ? AND is_warmup = 0 AND completed = 1`,
    [exerciseId]
  );
  return row?.max_weight ?? null;
}

// --- Streak ---

export async function getCurrentStreak(): Promise<number> {
  const db = await getDB();
  const workouts = await db.getAllAsync<{ day: string }>(
    `SELECT DISTINCT date(started_at) as day FROM workouts
     WHERE finished_at IS NOT NULL
     ORDER BY day DESC`
  );
  if (workouts.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < workouts.length; i++) {
    const workoutDate = new Date(workouts[i].day);
    workoutDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));

    // Allow gaps for rest days (max 2 days gap in T-R-T-R-T-R-R pattern)
    if (i === 0 && diffDays > 2) break;
    if (i > 0) {
      const prevDate = new Date(workouts[i - 1].day);
      const gap = Math.floor((prevDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      if (gap > 3) break; // More than 2 rest days = streak broken
    }
    streak++;
  }
  return streak;
}

// --- Settings ---

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}
