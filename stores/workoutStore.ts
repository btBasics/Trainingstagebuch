import { create } from 'zustand';

export interface ActiveSet {
  id: number;        // DB id (workout_sets)
  exerciseId: number;
  exerciseName: string;
  setNumber: number;
  isWarmup: boolean;
  weightKg: number | null;
  repsTarget: number;
  repsDone: number | null;
  completed: boolean;
}

export interface ActiveExercise {
  exerciseId: number;
  exerciseName: string;
  animationKey: string | null;
  hasWarmup: boolean;
  progressionKg: number;
  sets: ActiveSet[];
  allCompleted: boolean;
}

interface WorkoutState {
  workoutId: number | null;
  templateId: number | null;
  templateName: string | null;
  exercises: ActiveExercise[];
  currentExerciseIndex: number;
  isActive: boolean;
  startedAt: string | null;

  // Actions
  startWorkout: (workoutId: number, templateId: number | null, templateName: string | null, exercises: ActiveExercise[]) => void;
  completeSet: (exerciseId: number, setNumber: number, weightKg: number, repsDone: number) => void;
  setCurrentExercise: (index: number) => void;
  updateSetWeight: (exerciseId: number, setNumber: number, weightKg: number) => void;
  endWorkout: () => void;
  isExerciseCompleted: (exerciseId: number) => boolean;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workoutId: null,
  templateId: null,
  templateName: null,
  exercises: [],
  currentExerciseIndex: 0,
  isActive: false,
  startedAt: null,

  startWorkout: (workoutId, templateId, templateName, exercises) => {
    set({
      workoutId,
      templateId,
      templateName,
      exercises,
      currentExerciseIndex: 0,
      isActive: true,
      startedAt: new Date().toISOString(),
    });
  },

  completeSet: (exerciseId, setNumber, weightKg, repsDone) => {
    set((state) => ({
      exercises: state.exercises.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        const updatedSets = ex.sets.map((s) => {
          if (s.setNumber !== setNumber) return s;
          return { ...s, weightKg, repsDone, completed: true };
        });
        return {
          ...ex,
          sets: updatedSets,
          allCompleted: updatedSets.filter(s => !s.isWarmup).every(s => s.completed),
        };
      }),
    }));
  },

  setCurrentExercise: (index) => set({ currentExerciseIndex: index }),

  updateSetWeight: (exerciseId, setNumber, weightKg) => {
    set((state) => ({
      exercises: state.exercises.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.setNumber !== setNumber) return s;
            return { ...s, weightKg };
          }),
        };
      }),
    }));
  },

  endWorkout: () => {
    set({
      workoutId: null,
      templateId: null,
      templateName: null,
      exercises: [],
      currentExerciseIndex: 0,
      isActive: false,
      startedAt: null,
    });
  },

  isExerciseCompleted: (exerciseId) => {
    const state = get();
    const ex = state.exercises.find(e => e.exerciseId === exerciseId);
    return ex?.allCompleted ?? false;
  },
}));
