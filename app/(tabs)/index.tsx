import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../theme/colors';
import {
  getAllTemplates,
  getRecentWorkouts,
  getCurrentStreak,
  createWorkout,
  getTemplateExercises,
  getLastWeightForExercise,
  addWorkoutSet,
  getPersonalRecord,
  Template,
  Workout,
} from '../../db/queries';
import { getNextTemplateId, getNextTrainingDate, isToday, formatDate } from '../../utils/scheduler';
import { getNextWeight } from '../../utils/progression';
import { calculateWarmupSets } from '../../utils/warmup';
import { useWorkoutStore, ActiveExercise, ActiveSet } from '../../stores/workoutStore';

export default function HomeScreen() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [nextTemplate, setNextTemplate] = useState<Template | null>(null);
  const [nextDate, setNextDate] = useState<Date>(new Date());
  const [streak, setStreak] = useState(0);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);

  const loadData = useCallback(async () => {
    try {
      const tmpls = await getAllTemplates();
      setTemplates(tmpls);

      const recent = await getRecentWorkouts(5);
      setRecentWorkouts(recent);

      const templateIds = tmpls.map((t) => t.id);
      const nextId = await getNextTemplateId(templateIds);
      const next = tmpls.find((t) => t.id === nextId) ?? tmpls[0] ?? null;
      setNextTemplate(next);

      const lastDate = recent.length > 0 ? new Date(recent[0].started_at) : undefined;
      setNextDate(getNextTrainingDate(lastDate));

      const s = await getCurrentStreak();
      setStreak(s);
    } catch (e) {
      console.error('Failed to load home data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleStartTraining = async () => {
    if (!nextTemplate) return;

    const templateExercises = await getTemplateExercises(nextTemplate.id);
    const workoutId = await createWorkout(nextTemplate.id, nextTemplate.name);

    const exercises: ActiveExercise[] = [];

    for (const te of templateExercises) {
      const lastWeight = await getLastWeightForExercise(te.exercise_id);
      const suggestedWeight = lastWeight != null
        ? getNextWeight(lastWeight, te.exercise.name, te.exercise.progression_kg)
        : null;

      const sets: ActiveSet[] = [];
      let setNum = 1;

      // Add warm-up sets if applicable
      if (te.exercise.has_warmup && suggestedWeight != null) {
        const warmups = calculateWarmupSets(suggestedWeight);
        for (const wu of warmups) {
          const dbId = await addWorkoutSet(
            workoutId, te.exercise_id, te.exercise.name,
            setNum, true, wu.weight, wu.reps
          );
          sets.push({
            id: dbId,
            exerciseId: te.exercise_id,
            exerciseName: te.exercise.name,
            setNumber: setNum,
            isWarmup: true,
            weightKg: wu.weight,
            repsTarget: wu.reps,
            repsDone: null,
            completed: false,
          });
          setNum++;
        }
      }

      // Add working sets
      for (let i = 0; i < te.sets; i++) {
        const dbId = await addWorkoutSet(
          workoutId, te.exercise_id, te.exercise.name,
          setNum, false, suggestedWeight, te.reps
        );
        sets.push({
          id: dbId,
          exerciseId: te.exercise_id,
          exerciseName: te.exercise.name,
          setNumber: setNum,
          isWarmup: false,
          weightKg: suggestedWeight,
          repsTarget: te.reps,
          repsDone: null,
          completed: false,
        });
        setNum++;
      }

      exercises.push({
        exerciseId: te.exercise_id,
        exerciseName: te.exercise.name,
        animationKey: te.exercise.animation_key,
        hasWarmup: te.exercise.has_warmup,
        progressionKg: te.exercise.progression_kg,
        sets,
        allCompleted: false,
      });
    }

    startWorkout(workoutId, nextTemplate.id, nextTemplate.name, exercises);
    router.push(`/workout/${workoutId}`);
  };

  const todayIsTraining = isToday(nextDate);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Streak */}
      <View style={styles.streakContainer}>
        <Text style={styles.streakFire}>🔥</Text>
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>Trainings-Streak</Text>
      </View>

      {/* Next Training Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          {todayIsTraining ? 'Heute dran' : `Nächstes Training: ${formatDate(nextDate)}`}
        </Text>
        <Text style={styles.cardTitle}>
          {nextTemplate?.name ?? 'Kein Template'}
        </Text>
      </View>

      {/* START Button */}
      <TouchableOpacity
        style={[styles.startButton, !todayIsTraining && styles.startButtonDim]}
        onPress={handleStartTraining}
        activeOpacity={0.7}
      >
        <Ionicons name="barbell" size={28} color={Colors.background} />
        <Text style={styles.startButtonText}>TRAINING STARTEN</Text>
      </TouchableOpacity>

      {!todayIsTraining && (
        <Text style={styles.restDayHint}>
          Heute ist Ruhetag – aber du kannst trotzdem trainieren 💪
        </Text>
      )}

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Letzte Trainings</Text>
          {recentWorkouts.map((w) => (
            <View key={w.id} style={styles.recentItem}>
              <View>
                <Text style={styles.recentName}>{w.template_name ?? 'Training'}</Text>
                <Text style={styles.recentDate}>
                  {formatDate(new Date(w.started_at))}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  streakContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  streakFire: {
    fontSize: 48,
  },
  streakNumber: {
    fontSize: FontSize.hero,
    fontWeight: '900',
    color: Colors.warning,
    marginTop: -4,
  },
  streakLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  startButton: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  startButtonDim: {
    opacity: 0.7,
  },
  startButtonText: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.background,
    letterSpacing: 2,
  },
  restDayHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  recentSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recentItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  recentDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
