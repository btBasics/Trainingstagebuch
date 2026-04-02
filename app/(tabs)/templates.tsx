import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../theme/colors';
import {
  getAllTemplates, getTemplateExercises, getAllExercises,
  createTemplate, addExerciseToTemplate, deleteTemplate,
  Template, Exercise, TemplateExercise,
} from '../../db/queries';

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<(Template & {
    exercises: (TemplateExercise & { exercise: Exercise })[];
  })[]>([]);

  const loadData = useCallback(async () => {
    const tmpls = await getAllTemplates();
    const withExercises = await Promise.all(
      tmpls.map(async (t) => ({
        ...t,
        exercises: await getTemplateExercises(t.id),
      }))
    );
    setTemplates(withExercises);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddTemplate = async () => {
    const name = `Tag ${templates.length + 1}`;
    await createTemplate(name);
    loadData();
  };

  const handleDeleteTemplate = (id: number, name: string) => {
    Alert.alert(
      'Vorlage löschen?',
      `"${name}" wird unwiderruflich gelöscht.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            await deleteTemplate(id);
            loadData();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {templates.map((template) => (
        <View key={template.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{template.name}</Text>
            <TouchableOpacity
              onPress={() => handleDeleteTemplate(template.id, template.name)}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {template.exercises.map((te) => (
            <View key={te.id} style={styles.exerciseRow}>
              <Text style={styles.exerciseName}>{te.exercise.name}</Text>
              <Text style={styles.exerciseSchema}>
                {te.sets}×{te.reps}
              </Text>
            </View>
          ))}

          {template.exercises.length === 0 && (
            <Text style={styles.emptyHint}>Keine Übungen – bearbeite diese Vorlage</Text>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={handleAddTemplate}>
        <Ionicons name="add-circle-outline" size={24} color={Colors.accent} />
        <Text style={styles.addButtonText}>Neue Vorlage</Text>
      </TouchableOpacity>
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
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exerciseName: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  exerciseSchema: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  emptyHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: FontSize.lg,
    color: Colors.accent,
    fontWeight: '700',
  },
});
