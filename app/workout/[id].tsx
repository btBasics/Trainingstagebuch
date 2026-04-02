import { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize } from '../../theme/colors';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { completeWorkoutSet, finishWorkout, getLastWeightForExercise, getPersonalRecord } from '../../db/queries';
import { checkStagnation, isPersonalRecord } from '../../utils/progression';
import { calculateWarmupSets, roundToPlate } from '../../utils/warmup';
import { getPlateList } from '../../utils/plateCalc';
import StagnationStorm from '../../components/StagnationStorm';
import ExerciseDoneAnimation from '../../components/ExerciseDoneAnimation';
import RestTimer from '../../components/RestTimer';
import PlateCalculator from '../../components/PlateCalculator';

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    exercises, currentExerciseIndex, setCurrentExercise,
    completeSet, templateName, workoutId, endWorkout,
  } = useWorkoutStore();

  const [showStorm, setShowStorm] = useState(false);
  const [showExerciseDone, setShowExerciseDone] = useState<string | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showPlateCalc, setShowPlateCalc] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [prMessage, setPrMessage] = useState<string | null>(null);
  const restTimerLong = useSettingsStore((s) => s.restTimerLong);
  const restTimerShort = useSettingsStore((s) => s.restTimerShort);

  const currentExercise = exercises[currentExerciseIndex];

  const handleCompleteSet = useCallback(async (
    exerciseId: number,
    setNumber: number,
    weightKg: number,
    repsTarget: number,
    isWarmup: boolean,
    setDbId: number,
  ) => {
    // Complete in DB
    await completeWorkoutSet(setDbId, weightKg, repsTarget);

    // Update store
    completeSet(exerciseId, setNumber, weightKg, repsTarget);

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isWarmup) {
      // Check stagnation
      const stagnationType = await checkStagnation(exerciseId, weightKg);

      if (stagnationType === 'stagnation' || stagnationType === 'first_entry') {
        setShowStorm(true);
      } else {
        // Progression success!
        setSuccessMessage('Hob i jo gsog dass geht!');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setSuccessMessage(null), 3000);

        // Check PR
        const pr = await getPersonalRecord(exerciseId);
        if (pr != null && isPersonalRecord(weightKg, pr)) {
          setPrMessage(`🏆 Neuer PR: ${weightKg} kg!`);
          setTimeout(() => setPrMessage(null), 4000);
        }
      }

      // Show rest timer
      const exercise = exercises.find(e => e.exerciseId === exerciseId);
      const currentSets = exercise?.sets.filter(s => !s.isWarmup) ?? [];
      const completedCount = currentSets.filter(s => s.completed || s.setNumber === setNumber).length;
      if (completedCount < currentSets.length) {
        setShowRestTimer(true);
      }
    }

    // Check if exercise is done (all working sets completed)
    const exercise = exercises.find(e => e.exerciseId === exerciseId);
    if (exercise) {
      const workingSets = exercise.sets.filter(s => !s.isWarmup);
      const allDone = workingSets.every(s =>
        s.completed || (s.setNumber === setNumber)
      );
      if (allDone && exercise.animationKey) {
        setTimeout(() => {
          setShowExerciseDone(exercise.animationKey);
        }, 500);
      }
    }
  }, [completeSet, exercises]);

  const handleFinishWorkout = useCallback(async () => {
    if (workoutId) {
      await finishWorkout(workoutId);
    }
    endWorkout();
    router.replace('/workout/summary');
  }, [workoutId, endWorkout, router]);

  const confirmFinish = () => {
    const allDone = exercises.every(e => e.allCompleted);
    if (!allDone) {
      Alert.alert(
        'Training beenden?',
        'Nicht alle Übungen sind abgeschlossen.',
        [
          { text: 'Weiter trainieren', style: 'cancel' },
          { text: 'Beenden', style: 'destructive', onPress: handleFinishWorkout },
        ]
      );
    } else {
      handleFinishWorkout();
    }
  };

  const getRestDuration = () => 210; // Always 3.5 minutes

  if (!currentExercise) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Kein Training aktiv</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Exercise tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {exercises.map((ex, i) => (
          <TouchableOpacity
            key={ex.exerciseId}
            style={[
              styles.tab,
              i === currentExerciseIndex && styles.tabActive,
              ex.allCompleted && styles.tabDone,
            ]}
            onPress={() => setCurrentExercise(i)}
          >
            <Text style={[
              styles.tabText,
              i === currentExerciseIndex && styles.tabTextActive,
              ex.allCompleted && styles.tabTextDone,
            ]}>
              {ex.allCompleted ? '✓' : ''} {ex.exerciseName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Current exercise */}
      <ScrollView style={styles.exerciseContainer} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.exerciseName}>{currentExercise.exerciseName}</Text>

        {/* Sets */}
        {currentExercise.sets.map((set) => (
          <SetRow
            key={set.setNumber}
            set={set}
            onComplete={handleCompleteSet}
            onShowPlates={(weight) => setShowPlateCalc(weight)}
          />
        ))}
      </ScrollView>

      {/* Success message */}
      {successMessage && (
        <View style={styles.successOverlay}>
          <Text style={styles.successEmoji}>💪</Text>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      {/* PR message */}
      {prMessage && (
        <View style={styles.prOverlay}>
          <Text style={styles.prText}>{prMessage}</Text>
        </View>
      )}

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.finishButton} onPress={confirmFinish}>
          <Text style={styles.finishButtonText}>TRAINING BEENDEN</Text>
        </TouchableOpacity>
      </View>

      {/* Overlays */}
      {showStorm && (
        <StagnationStorm onDismiss={() => setShowStorm(false)} />
      )}

      {showExerciseDone && (
        <ExerciseDoneAnimation
          animationKey={showExerciseDone}
          onDismiss={() => {
            setShowExerciseDone(null);
            // Auto-advance to next exercise
            if (currentExerciseIndex < exercises.length - 1) {
              setCurrentExercise(currentExerciseIndex + 1);
            }
          }}
        />
      )}

      {showRestTimer && (
        <RestTimer
          duration={getRestDuration()}
          onDismiss={() => setShowRestTimer(false)}
        />
      )}

      {showPlateCalc != null && (
        <PlateCalculator
          weight={showPlateCalc}
          onDismiss={() => setShowPlateCalc(null)}
        />
      )}
    </View>
  );
}

// --- SetRow Component ---

function SetRow({
  set,
  onComplete,
  onShowPlates,
}: {
  set: import('../../stores/workoutStore').ActiveSet;
  onComplete: (
    exerciseId: number, setNumber: number, weightKg: number,
    repsTarget: number, isWarmup: boolean, setDbId: number
  ) => void;
  onShowPlates: (weight: number) => void;
}) {
  const [weight, setWeight] = useState(set.weightKg ?? 0);

  const adjustWeight = (delta: number) => {
    const newWeight = Math.max(0, weight + delta);
    setWeight(newWeight);
    Haptics.selectionAsync();
  };

  const handleComplete = () => {
    onComplete(set.exerciseId, set.setNumber, weight, set.repsTarget, set.isWarmup, set.id);
  };

  return (
    <View style={[
      styles.setRow,
      set.isWarmup && styles.setRowWarmup,
      set.completed && styles.setRowCompleted,
    ]}>
      {/* Label */}
      <View style={styles.setLabel}>
        <Text style={[styles.setLabelText, set.isWarmup && styles.warmupText]}>
          {set.isWarmup ? 'W' : 'A'}{set.setNumber}
        </Text>
      </View>

      {/* Weight */}
      <View style={styles.weightSection}>
        <TouchableOpacity
          style={styles.weightButton}
          onPress={() => adjustWeight(-2.5)}
          disabled={set.completed}
        >
          <Text style={styles.weightButtonText}>−</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onShowPlates(weight)}>
          <Text style={[
            styles.weightValue,
            set.completed && styles.completedText,
          ]}>
            {weight}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.weightButton}
          onPress={() => adjustWeight(2.5)}
          disabled={set.completed}
        >
          <Text style={styles.weightButtonText}>+</Text>
        </TouchableOpacity>

        <Text style={styles.weightUnit}>kg</Text>
      </View>

      {/* Reps */}
      <Text style={[styles.repsText, set.isWarmup && styles.warmupText]}>
        ×{set.repsTarget}
      </Text>

      {/* Complete button */}
      <TouchableOpacity
        style={[styles.checkButton, set.completed && styles.checkButtonDone]}
        onPress={handleComplete}
        disabled={set.completed}
      >
        <Ionicons
          name={set.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={32}
          color={set.completed ? Colors.success : Colors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginTop: 100,
  },
  tabBar: {
    maxHeight: 48,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.xs,
    borderRadius: 8,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Colors.accent + '20',
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent,
  },
  tabDone: {
    opacity: 0.5,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.accent,
  },
  tabTextDone: {
    color: Colors.success,
  },
  exerciseContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  exerciseName: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  setRowWarmup: {
    backgroundColor: Colors.warmupGray + '30',
    borderColor: Colors.warmupGray,
  },
  setRowCompleted: {
    opacity: 0.5,
    borderColor: Colors.success + '40',
  },
  setLabel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  setLabelText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  warmupText: {
    color: Colors.warmupText,
  },
  weightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.xs,
  },
  weightButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightButtonText: {
    fontSize: FontSize.xl,
    color: Colors.accent,
    fontWeight: '700',
  },
  weightValue: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.text,
    minWidth: 70,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  completedText: {
    color: Colors.textSecondary,
  },
  weightUnit: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  repsText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginRight: Spacing.md,
    minWidth: 30,
  },
  checkButton: {
    padding: Spacing.xs,
  },
  checkButtonDone: {},
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.background + 'F0',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  finishButton: {
    backgroundColor: Colors.danger,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 1,
  },
  successOverlay: {
    position: 'absolute',
    top: '30%',
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.success + '20',
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.success,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  successText: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.success,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  prOverlay: {
    position: 'absolute',
    top: '20%',
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.gold + '30',
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  prText: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.gold,
    textAlign: 'center',
  },
});
