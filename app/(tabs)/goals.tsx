import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { DailyGoal, Meal, UserProfile } from '../../lib/types';
import { getGoal, getMeals, getProfile, saveGoal } from '../../lib/storage';
import { defaultGoal, defaultProfile } from '../../lib/defaults';

type GoalForm = Record<keyof DailyGoal, string>;

const macroConfig = [
  { key: 'protein', label: 'Proteína', unit: 'g', color: colors.green, bg: colors.proteinBg, icon: '🥩' },
  { key: 'carbs', label: 'Carboidrato', unit: 'g', color: colors.orange, bg: '#fff7ed', icon: '🌾' },
  { key: 'fat', label: 'Gordura', unit: 'g', color: '#a855f7', bg: '#faf5ff', icon: '🥑' },
  { key: 'fiber', label: 'Fibra', unit: 'g', color: '#0ea5e9', bg: '#f0f9ff', icon: '🥦' },
] as const;

export default function GoalsScreen() {
  const [goal, setGoal] = useState<DailyGoal>(defaultGoal);
  const [form, setForm] = useState<GoalForm>(goalToForm(defaultGoal));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadData() {
        const [storedGoal, storedMeals, storedProfile] = await Promise.all([
          getGoal(),
          getMeals(),
          getProfile(),
        ]);
        if (!mounted) return;
        setGoal(storedGoal);
        setForm(goalToForm(storedGoal));
        setMeals(storedMeals);
        setProfile(storedProfile);
      }

      loadData();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const today = meals.filter(meal => {
    const date = new Date(meal.createdAt);
    const now = new Date();
    return date.toDateString() === now.toDateString();
  });
  const consumed = today.reduce((total, meal) => total + meal.calories, 0);
  const macros = today.reduce(
    (total, meal) => ({
      protein: total.protein + meal.macros.protein,
      carbs: total.carbs + meal.macros.carbs,
      fat: total.fat + meal.macros.fat,
      fiber: total.fiber + meal.macros.fiber,
    }),
    { protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
  const totalPct = Math.round((consumed / goal.calories) * 100) || 0;

  function updateForm(key: keyof DailyGoal, value: string) {
    setForm(current => ({ ...current, [key]: value.replace(/[^0-9]/g, '') }));
  }

  async function handleSave() {
    const nextGoal = formToGoal(form);
    if (Object.values(nextGoal).some(value => value <= 0)) {
      Alert.alert('Revise as metas', 'Todos os campos precisam ter valores maiores que zero.');
      return;
    }

    try {
      setSaving(true);
      await saveGoal(nextGoal);
      setGoal(nextGoal);
      setEditing(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar suas metas.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Minhas metas</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/profile')}>
              <Ionicons name="person-outline" size={18} color={colors.green} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(value => !value)}>
              <Ionicons name={editing ? 'close' : 'create-outline'} size={20} color={colors.green} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.calorieCard}>
            <View style={styles.calorieLeft}>
              <Text style={styles.calorieLabel}>Calorias hoje</Text>
              {editing ? (
                <Field label="Meta diária" value={form.calories} suffix="kcal" onChangeText={value => updateForm('calories', value)} />
              ) : (
                <>
                  <Text style={styles.calorieValue}>
                    {consumed.toLocaleString('pt-BR')}
                    <Text style={styles.calorieUnit}> / {goal.calories.toLocaleString('pt-BR')} kcal</Text>
                  </Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min(totalPct, 100)}%` as any }]} />
                  </View>
                  <Text style={styles.calorieRemaining}>
                    {Math.max(goal.calories - consumed, 0).toLocaleString('pt-BR')} kcal restantes
                  </Text>
                </>
              )}
            </View>
            {!editing && (
              <View style={styles.calorieRing}>
                <View style={styles.calorieRingInner}>
                  <Text style={styles.calorieRingPct}>{Math.min(totalPct, 999)}%</Text>
                  <Text style={styles.calorieRingLabel}>da meta</Text>
                </View>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Macronutrientes</Text>
          <View style={styles.macroGrid}>
            {macroConfig.map(item => {
              const consumedMacro = macros[item.key];
              const target = goal[item.key];
              const pct = Math.round((consumedMacro / target) * 100) || 0;

              return (
                <View key={item.key} style={[styles.macroCard, { backgroundColor: item.bg }]}>
                  <View style={styles.macroTop}>
                    <Text style={styles.macroIcon}>{item.icon}</Text>
                    {!editing && <Text style={[styles.macroPct, { color: item.color }]}>{pct}%</Text>}
                  </View>
                  {editing ? (
                    <Field label={item.label} value={form[item.key]} suffix={item.unit} onChangeText={value => updateForm(item.key, value)} />
                  ) : (
                    <>
                      <Text style={[styles.macroValue, { color: item.color }]}>{consumedMacro}{item.unit}</Text>
                      <Text style={styles.macroLabel}>{item.label}</Text>
                      <View style={styles.macroTrack}>
                        <View style={[styles.macroFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: item.color }]} />
                      </View>
                      <Text style={styles.macroGoal}>meta: {target}{item.unit}</Text>
                    </>
                  )}
                </View>
              );
            })}
          </View>

          {editing && (
            <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar metas'}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Dados corporais</Text>
          <TouchableOpacity style={styles.statsCard} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.85}>
            <StatRow label="Peso atual" value={`${profile.weightKg} kg`} />
            <StatRow label="Peso meta" value={`${profile.targetWeightKg} kg`} />
            <StatRow label="Altura" value={`${profile.heightCm} cm`} />
            <StatRow label="IMC" value={(profile.weightKg / ((profile.heightCm / 100) ** 2)).toFixed(1)} last />
          </TouchableOpacity>

          <TouchableOpacity style={styles.objectiveCard} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.85}>
            <View style={styles.objectiveIcon}>
              <Ionicons name="trophy" size={20} color={colors.green} />
            </View>
            <View style={styles.objectiveInfo}>
              <Text style={styles.objectiveTitle}>Objetivo</Text>
              <Text style={styles.objectiveValue}>{profile.objective}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.gray300} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, suffix, onChangeText }: {
  label: string;
  value: string;
  suffix: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          style={styles.input}
          placeholder="0"
          placeholderTextColor={colors.gray300}
        />
        <Text style={styles.fieldSuffix}>{suffix}</Text>
      </View>
    </View>
  );
}

function StatRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.statRow, !last && styles.statRowBorder]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function goalToForm(goal: DailyGoal): GoalForm {
  return {
    calories: String(goal.calories),
    protein: String(goal.protein),
    carbs: String(goal.carbs),
    fat: String(goal.fat),
    fiber: String(goal.fiber),
  };
}

function formToGoal(form: GoalForm): DailyGoal {
  return {
    calories: Number(form.calories),
    protein: Number(form.protein),
    carbs: Number(form.carbs),
    fat: Number(form.fat),
    fiber: Number(form.fiber),
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.gray900 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, gap: 14 },
  calorieCard: { backgroundColor: colors.white, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  calorieLeft: { flex: 1 },
  calorieLabel: { fontSize: 12, color: colors.gray400, marginBottom: 4 },
  calorieValue: { fontSize: 26, fontWeight: '700', color: colors.gray900 },
  calorieUnit: { fontSize: 13, fontWeight: '400', color: colors.gray400 },
  progressTrack: { height: 8, backgroundColor: colors.gray100, borderRadius: 4, overflow: 'hidden', marginTop: 10, marginBottom: 6 },
  progressFill: { height: 8, backgroundColor: colors.green, borderRadius: 4 },
  calorieRemaining: { fontSize: 12, color: colors.gray400 },
  calorieRing: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  calorieRingInner: { width: 68, height: 68, borderRadius: 34, borderWidth: 6, borderColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  calorieRingPct: { fontSize: 15, fontWeight: '700', color: colors.gray900 },
  calorieRingLabel: { fontSize: 9, color: colors.gray400 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.gray800 },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  macroCard: { width: '47.5%', borderRadius: 14, padding: 14 },
  macroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  macroIcon: { fontSize: 20 },
  macroPct: { fontSize: 12, fontWeight: '700' },
  macroValue: { fontSize: 22, fontWeight: '700' },
  macroLabel: { fontSize: 12, color: colors.gray500, marginTop: 2, marginBottom: 8 },
  macroTrack: { height: 4, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  macroFill: { height: 4, borderRadius: 2 },
  macroGoal: { fontSize: 10, color: colors.gray400 },
  fieldLabel: { fontSize: 11, color: colors.gray500, marginBottom: 6 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.gray900, backgroundColor: colors.white },
  fieldSuffix: { fontSize: 12, color: colors.gray500 },
  saveBtn: { backgroundColor: colors.gray900, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.65 },
  statsCard: { backgroundColor: colors.white, borderRadius: 14, overflow: 'hidden' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  statRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  statLabel: { fontSize: 14, color: colors.gray600 },
  statValue: { fontSize: 14, fontWeight: '600', color: colors.gray900 },
  objectiveCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 14, padding: 16 },
  objectiveIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  objectiveInfo: { flex: 1 },
  objectiveTitle: { fontSize: 12, color: colors.gray400 },
  objectiveValue: { fontSize: 14, fontWeight: '500', color: colors.gray800 },
});
