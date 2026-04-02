import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, withSpring, Easing, runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EXERCISE_QUIPS: Record<string, string[]> = {
  squat: ['Maschine!', 'Bist a Viech!', 'Knie wie Stahl!', 'Woar des leicht oda wos?'],
  bench: ['Brustpanzer!', 'Push it!', 'Bänkdrück-Bestie!', 'Nächste Übung, los!'],
  press: ['Über den Kopf!', 'Schultern aus Granit!', 'Hoch damit!', 'Bist a Tier!'],
  deadlift: ['Heben wie ein Bär!', 'Rücken aus Stahl!', 'BEAST MODE!', 'Zerstörer!'],
  latpull: ['Rücken breit!', 'Ziiiehen!', 'V-Form incoming!', 'Maschine!'],
  hyperextension: ['Rücken stabil!', 'Unzerstörbar!', 'Core of Steel!', 'Weiter so!'],
  dips: ['Propeller-Modus!', 'Dip-Destroyer!', 'Arme wie Baumstämme!', 'Brutal!'],
  biceps: ['Pump-City!', 'Bizeps-Boss!', 'Kanonenkugeln!', 'GAINZ!'],
  triceps: ['Hufeisen-Arme!', 'Trizeps-Terror!', 'Spaghetti zu Stahl!', 'Maschine!'],
  rowing: ['Ruderbeast!', 'Zieh durch!', 'Rücken-Maschine!', 'Volle Kraft!'],
};

// Simple stick figure representations using text/emoji for now
// (Would be replaced with Lottie animations in production)
const EXERCISE_FIGURES: Record<string, string> = {
  squat: '🏋️',
  bench: '🏋️‍♂️',
  press: '🏋️',
  deadlift: '🏋️‍♂️',
  latpull: '💪',
  hyperextension: '🔄',
  dips: '⬇️⬆️',
  biceps: '💪',
  triceps: '💪',
  rowing: '🚣',
};

interface Props {
  animationKey: string;
  onDismiss: () => void;
}

export default function ExerciseDoneAnimation({ animationKey, onDismiss }: Props) {
  const [repCount, setRepCount] = useState(0);
  const [quip, setQuip] = useState('');

  const figureScale = useSharedValue(1);
  const figureTranslateY = useSharedValue(0);
  const figureRotate = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    // Pick random quip
    const quips = EXERCISE_QUIPS[animationKey] ?? ['Maschine!'];
    setQuip(quips[Math.floor(Math.random() * quips.length)]);

    // Fade in
    overlayOpacity.value = withTiming(1, { duration: 200 });

    // Animate figure – pump 15 times
    figureScale.value = withRepeat(
      withSequence(
        withSpring(1.4, { damping: 4, stiffness: 200 }),
        withSpring(0.9, { damping: 4, stiffness: 200 }),
      ),
      15,
      true
    );

    figureTranslateY.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 100, easing: Easing.bounce }),
      ),
      15,
      false
    );

    // Count reps
    const repInterval = setInterval(() => {
      setRepCount(prev => {
        if (prev >= 15) {
          clearInterval(repInterval);
          return 15;
        }
        Haptics.selectionAsync();
        return prev + 1;
      });
    }, 180);

    // Auto-dismiss after 3.5s
    const timer = setTimeout(() => {
      overlayOpacity.value = withTiming(0, { duration: 300 });
      setTimeout(onDismiss, 300);
    }, 3500);

    return () => {
      clearInterval(repInterval);
      clearTimeout(timer);
    };
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const figureStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: figureScale.value },
      { translateY: figureTranslateY.value },
    ],
  }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <TouchableOpacity
        style={styles.content}
        activeOpacity={1}
        onPress={onDismiss}
      >
        {/* Rep counter */}
        <Text style={styles.repCounter}>{repCount}/15</Text>

        {/* Figure */}
        <Animated.View style={[styles.figureContainer, figureStyle]}>
          <Text style={styles.figure}>
            {EXERCISE_FIGURES[animationKey] ?? '🏋️'}
          </Text>
        </Animated.View>

        {/* Exercise name */}
        <Text style={styles.exerciseName}>
          {animationKey.toUpperCase()} DONE!
        </Text>

        {/* Quip */}
        <Text style={styles.quip}>{quip}</Text>

        <Text style={styles.tapHint}>Tippe zum Schließen</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  repCounter: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.accent,
    fontVariant: ['tabular-nums'],
    marginBottom: Spacing.lg,
  },
  figureContainer: {
    marginBottom: Spacing.xl,
  },
  figure: {
    fontSize: 100,
  },
  exerciseName: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.success,
    letterSpacing: 3,
    marginBottom: Spacing.md,
  },
  quip: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  tapHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    position: 'absolute',
    bottom: 60,
  },
});
