import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize } from '../../theme/colors';
import { getRecentWorkouts, getWorkoutSets, Workout, WorkoutSet } from '../../db/queries';
import { formatDateFull } from '../../utils/scheduler';

export default function HistoryScreen() {
  const [workouts, setWorkouts] = useState<(Workout & { sets: WorkoutSet[] })[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const recent = await getRecentWorkouts(20);
        const withSets = await Promise.all(
          recent.map(async (w) => ({
            ...w,
            sets: await getWorkoutSets(w.id),
          }))
        );
        setWorkouts(withSets);
      })();
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {workouts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>Noch keine Trainings.</Text>
          <Text style={styles.emptyHint}>Starte dein erstes Training!</Text>
        </View>
      ) : (
        workouts.map((w) => {
          const workingSets = w.sets.filter(s => !s.is_warmup && s.completed);
          const totalVolume = workingSets.reduce(
            (sum, s) => sum + (s.weight_kg ?? 0) * (s.reps_done ?? 0), 0
          );
          const exercises = [...new Set(workingSets.map(s => s.exercise_name))];

          return (
            <View key={w.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{w.template_name ?? 'Training'}</Text>
                <Text style={styles.cardDate}>
                  {formatDateFull(new Date(w.started_at))}
                </Text>
              </View>
              <View style={styles.cardStats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{exercises.length}</Text>
                  <Text style={styles.statLabel}>Übungen</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{workingSets.length}</Text>
                  <Text style={styles.statLabel}>Sätze</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{Math.round(totalVolume)}</Text>
                  <Text style={styles.statLabel}>kg Volumen</Text>
                </View>
              </View>
              <View style={styles.exerciseList}>
                {exercises.map((name) => {
                  const exSets = workingSets.filter(s => s.exercise_name === name);
                  const maxWeight = Math.max(...exSets.map(s => s.weight_kg ?? 0));
                  return (
                    <View key={name} style={styles.exerciseRow}>
                      <Text style={styles.exerciseName}>{name}</Text>
                      <Text style={styles.exerciseWeight}>{maxWeight} kg</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })
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
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  cardDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  cardStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.accent,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  exerciseList: {
    gap: Spacing.xs,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  exerciseWeight: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
