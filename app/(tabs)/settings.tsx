import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSize } from '../../theme/colors';
import { useSettingsStore } from '../../stores/settingsStore';

export default function SettingsScreen() {
  const {
    notificationHour, notificationMinute,
    restTimerLong, restTimerShort, barWeight,
  } = useSettingsStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training</Text>
        <SettingRow
          label="Stangengewicht"
          value={`${barWeight} kg`}
        />
        <SettingRow
          label="Pause (5er Sätze)"
          value={`${Math.floor(restTimerLong / 60)}:${(restTimerLong % 60).toString().padStart(2, '0')} min`}
        />
        <SettingRow
          label="Pause (8er Sätze)"
          value={`${Math.floor(restTimerShort / 60)}:${(restTimerShort % 60).toString().padStart(2, '0')} min`}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Benachrichtigungen</Text>
        <SettingRow
          label="Erinnerung"
          value={`${notificationHour.toString().padStart(2, '0')}:${notificationMinute.toString().padStart(2, '0')} Uhr`}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <SettingRow label="Version" value="1.0.0" />
        <SettingRow label="Theme" value="Dark" />
      </View>
    </ScrollView>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
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
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
