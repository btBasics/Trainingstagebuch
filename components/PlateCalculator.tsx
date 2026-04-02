import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Colors, Spacing, FontSize } from '../theme/colors';
import { calculatePlates, getPlateList } from '../utils/plateCalc';

const PLATE_COLORS: Record<number, string> = {
  25: Colors.plate25,
  20: Colors.plate20,
  15: Colors.plate15,
  10: Colors.plate10,
  5: Colors.plate5,
  2.5: Colors.plate2_5,
  1.25: Colors.plate1_25,
};

const PLATE_HEIGHTS: Record<number, number> = {
  25: 120,
  20: 110,
  15: 95,
  10: 80,
  5: 65,
  2.5: 50,
  1.25: 40,
};

interface Props {
  weight: number;
  onDismiss: () => void;
}

export default function PlateCalculator({ weight, onDismiss }: Props) {
  const { perSide, barWeight } = calculatePlates(weight);
  const plates = getPlateList(weight);
  const perSideWeight = (weight - barWeight) / 2;

  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>Scheibenrechner</Text>
          <Text style={styles.totalWeight}>{weight} kg</Text>
          <Text style={styles.subtitle}>
            Stange: {barWeight}kg + je Seite: {perSideWeight}kg
          </Text>

          {/* Visual barbell */}
          <View style={styles.barbellContainer}>
            {/* Left plates (mirrored) */}
            <View style={styles.platesLeft}>
              {[...plates].reverse().map((plate, i) => (
                <View
                  key={`l${i}`}
                  style={[
                    styles.plate,
                    {
                      backgroundColor: PLATE_COLORS[plate] ?? Colors.textMuted,
                      height: PLATE_HEIGHTS[plate] ?? 50,
                      width: plate >= 10 ? 20 : 14,
                    },
                  ]}
                >
                  <Text style={styles.plateLabel}>{plate}</Text>
                </View>
              ))}
            </View>

            {/* Bar */}
            <View style={styles.bar}>
              <Text style={styles.barLabel}>{barWeight}kg</Text>
            </View>

            {/* Right plates */}
            <View style={styles.platesRight}>
              {plates.map((plate, i) => (
                <View
                  key={`r${i}`}
                  style={[
                    styles.plate,
                    {
                      backgroundColor: PLATE_COLORS[plate] ?? Colors.textMuted,
                      height: PLATE_HEIGHTS[plate] ?? 50,
                      width: plate >= 10 ? 20 : 14,
                    },
                  ]}
                >
                  <Text style={styles.plateLabel}>{plate}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Plate list */}
          <View style={styles.plateList}>
            <Text style={styles.plateListTitle}>Je Seite:</Text>
            {perSide.map(({ weight: w, count }) => (
              <View key={w} style={styles.plateListRow}>
                <View style={[styles.plateColorDot, { backgroundColor: PLATE_COLORS[w] ?? Colors.textMuted }]} />
                <Text style={styles.plateListText}>
                  {count}× {w}kg
                </Text>
              </View>
            ))}
            {perSide.length === 0 && (
              <Text style={styles.plateListText}>Nur die Stange</Text>
            )}
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <Text style={styles.closeText}>Schließen</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.xl,
    margin: Spacing.lg,
    width: '90%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  totalWeight: {
    fontSize: FontSize.hero,
    fontWeight: '900',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
    marginVertical: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  barbellContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    height: 140,
  },
  platesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  platesRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bar: {
    width: 80,
    height: 8,
    backgroundColor: Colors.textSecondary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 8,
    color: Colors.background,
    fontWeight: '700',
  },
  plate: {
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  plateLabel: {
    fontSize: 7,
    color: Colors.background,
    fontWeight: '800',
    transform: [{ rotate: '-90deg' }],
  },
  plateList: {
    width: '100%',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  plateListTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  plateListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  plateColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  plateListText: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
  },
  closeText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
