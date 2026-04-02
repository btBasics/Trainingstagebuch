import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withSequence, withRepeat, withDelay, runOnJS, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STAGNATION_MESSAGES = [
  'MEHR GEWICHT, KRIEGER! 💥',
  'Des geht no! ⚡',
  'Stagnation is da Feind! 🔥',
  '+2.5kg drauf. JETZT. 💀',
  'Du bist stärker als gestern! 👊',
  'PROGRESSIVE OVERLOAD! 💥',
  'De Stange woart ned! ⚡',
  'Wos is mit dir los?! 🔥',
  'Aufhören gibts ned! 💀',
  'SCHWERER. IMMER SCHWERER. 👊',
];

const FINAL_TEXT = 'M E H R   G E W I C H T .';

interface Props {
  onDismiss: () => void;
}

export default function StagnationStorm({ onDismiss }: Props) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [finalLetters, setFinalLetters] = useState(0);

  // Phase 1: Strobe
  const strobeOpacity = useSharedValue(1);
  const strobeColor = useSharedValue(0);
  const warningScale = useSharedValue(0.5);

  // Phase 2: Messages fly in
  const messageAnims = STAGNATION_MESSAGES.map(() => ({
    translateX: useSharedValue(0),
    translateY: useSharedValue(0),
    opacity: useSharedValue(0),
    scale: useSharedValue(0),
    rotate: useSharedValue(0),
  }));

  // Phase 3: Screen shake + final text
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);

  useEffect(() => {
    // Phase 1: Strobe (0-2s)
    strobeColor.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      ),
      10, true
    );

    warningScale.value = withRepeat(
      withSequence(
        withSpring(1.2, { damping: 3 }),
        withSpring(0.8, { damping: 3 }),
      ),
      5, true
    );

    // Haptic strobe
    const hapticInterval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 200);

    // Phase 2 at 2s
    const phase2Timer = setTimeout(() => {
      setPhase(2);
      clearInterval(hapticInterval);

      // Fly in messages one by one
      STAGNATION_MESSAGES.forEach((_, i) => {
        setTimeout(() => {
          setVisibleMessages(prev => [...prev, i]);

          const fromLeft = Math.random() > 0.5;
          const startX = fromLeft ? -SCREEN_WIDTH : SCREEN_WIDTH;
          const startY = (Math.random() - 0.5) * SCREEN_HEIGHT * 0.6;

          messageAnims[i].translateX.value = startX;
          messageAnims[i].translateY.value = startY;
          messageAnims[i].opacity.value = 0;
          messageAnims[i].scale.value = 0.3;
          messageAnims[i].rotate.value = (Math.random() - 0.5) * 30;

          messageAnims[i].translateX.value = withSpring(0, { damping: 8, stiffness: 100 });
          messageAnims[i].translateY.value = withSpring(
            (i - STAGNATION_MESSAGES.length / 2) * 45,
            { damping: 8 }
          );
          messageAnims[i].opacity.value = withTiming(1, { duration: 200 });
          messageAnims[i].scale.value = withSpring(1, { damping: 6 });

          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, i * 200);
      });
    }, 2000);

    // Phase 3 at 4s
    const phase3Timer = setTimeout(() => {
      setPhase(3);

      // Screen shake
      shakeX.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 50 }),
          withTiming(8, { duration: 50 }),
        ),
        15, true
      );
      shakeY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 60 }),
          withTiming(4, { duration: 60 }),
        ),
        12, true
      );

      // Final text letter by letter
      const letters = FINAL_TEXT.length;
      for (let i = 0; i < letters; i++) {
        setTimeout(() => {
          setFinalLetters(i + 1);
          if (FINAL_TEXT[i] !== ' ') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }
        }, i * 120);
      }
    }, 4000);

    // Dismiss at 7s
    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, 7000);

    return () => {
      clearInterval(hapticInterval);
      clearTimeout(phase2Timer);
      clearTimeout(phase3Timer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const strobeStyle = useAnimatedStyle(() => ({
    backgroundColor: strobeColor.value > 0.5
      ? Colors.stagnationRed
      : Colors.stagnationBlack,
  }));

  const warningStyle = useAnimatedStyle(() => ({
    transform: [{ scale: warningScale.value }],
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeX.value },
      { translateY: shakeY.value },
    ],
  }));

  return (
    <TouchableOpacity
      style={StyleSheet.absoluteFill}
      activeOpacity={1}
      onPress={() => { /* No early dismiss */ }}
    >
      <Animated.View style={[styles.container, strobeStyle]}>
        <Animated.View style={[styles.contentContainer, shakeStyle]}>
          {/* Phase 1: Warning */}
          {phase === 1 && (
            <Animated.View style={[styles.warningContainer, warningStyle]}>
              <Text style={styles.warningText}>GLEICHES{'\n'}GEWICHT?!</Text>
            </Animated.View>
          )}

          {/* Phase 2: Messages */}
          {(phase === 2 || phase === 3) && visibleMessages.map((idx) => {
            const anim = messageAnims[idx];
            const msgStyle = useAnimatedStyle(() => ({
              transform: [
                { translateX: anim.translateX.value },
                { translateY: anim.translateY.value },
                { scale: anim.scale.value },
                { rotate: `${anim.rotate.value}deg` },
              ],
              opacity: anim.opacity.value,
            }));

            return (
              <Animated.View key={idx} style={[styles.messageContainer, msgStyle]}>
                <Text style={styles.messageText}>{STAGNATION_MESSAGES[idx]}</Text>
              </Animated.View>
            );
          })}

          {/* Phase 3: Final text */}
          {phase === 3 && (
            <View style={styles.finalContainer}>
              <Text style={styles.finalText}>
                {FINAL_TEXT.slice(0, finalLetters)}
                <Text style={styles.finalCursor}>▌</Text>
              </Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  warningContainer: {
    alignItems: 'center',
  },
  warningText: {
    fontSize: FontSize.hero,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
    textShadowColor: Colors.stagnationRed,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  messageContainer: {
    position: 'absolute',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.stagnationRed + '80',
    borderWidth: 1,
    borderColor: Colors.stagnationRed,
  },
  messageText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  finalContainer: {
    position: 'absolute',
    bottom: '25%',
    paddingHorizontal: 20,
  },
  finalText: {
    fontSize: FontSize.xxxl,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 4,
    textShadowColor: Colors.stagnationRed,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  finalCursor: {
    color: Colors.stagnationRed,
  },
});
