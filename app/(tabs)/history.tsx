import { useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { colors } from '../../constants/colors';
import { DailyGoal, Meal } from '../../lib/types';
import { deleteMeal, formatDayTitle, formatMealTime, getGoal, getMeals, isToday } from '../../lib/storage';
import { defaultGoal } from '../../lib/defaults';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function HistoryScreen() {
  const [period, setPeriod] = useState<'Semanal' | 'Mensal'>('Semanal');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [goal, setGoal] = useState<DailyGoal>(defaultGoal);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadData() {
        try {
          const [storedMeals, storedGoal] = await Promise.all([getMeals(), getGoal()]);
          if (!mounted) return;
          setMeals(storedMeals);
          setGoal(storedGoal);
        } finally {
          if (mounted) setLoading(false);
        }
      }

      loadData();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const todayMeals = meals.filter(meal => isToday(meal.createdAt));
  const todayCal = todayMeals.reduce((total, meal) => total + meal.calories, 0);
  const todayPct = goal.calories > 0 ? Math.round((todayCal / goal.calories) * 100) : 0;
  const weeklyCalories = useMemo(() => buildWeeklyCalories(meals), [meals]);
  const maxCal = Math.max(goal.calories, ...weeklyCalories, 1);
  const average = Math.round(weeklyCalories.reduce((a, b) => a + b, 0) / weeklyCalories.length);
  const groupedMeals = groupMealsByDay(meals);

  function confirmDelete(meal: Meal) {
    Alert.alert(
      'Excluir análise',
      `${meal.title} será removida do histórico.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => handleDelete(meal.id) },
      ]
    );
  }

  async function handleDelete(id: string) {
    try {
      await deleteMeal(id);
      setMeals(current => current.filter(meal => meal.id !== id));
    } catch {
      Alert.alert('Erro', 'Não foi possível excluir a análise.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Histórico</Text>
          <View style={styles.headerActions}>
            <View style={styles.periodToggle}>
              {(['Semanal', 'Mensal'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/profile')}>
              <Ionicons name="person-outline" size={18} color={colors.green} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.summaryLabel}>Hoje</Text>
              <Text style={styles.summaryCalories}>{todayCal} <Text style={styles.summaryUnit}>kcal</Text></Text>
              <Text style={styles.summaryGoal}>meta: {goal.calories} kcal · {todayPct}%</Text>
            </View>
            <View style={styles.summaryRing}>
              <View style={[styles.ringInner, { borderColor: todayPct >= 100 ? colors.orange : colors.green }]}>
                <Text style={styles.ringPct}>{Math.min(todayPct, 999)}%</Text>
              </View>
            </View>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.cardTitle}>Esta semana</Text>
              <Text style={styles.chartAvg}>média: {average} kcal</Text>
            </View>
            <View style={styles.chartArea}>
              <View style={styles.bars}>
                {weeklyCalories.map((cal, i) => {
                  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
                  const isTodayBar = i === todayIndex;
                  const height = Math.max(8, (cal / maxCal) * 120);
                  const over = cal > goal.calories;
                  return (
                    <View key={DAYS[i]} style={styles.barCol}>
                      <Text style={[styles.barValue, isTodayBar && styles.barValueActive]}>
                        {cal >= 1000 ? `${(cal / 1000).toFixed(1)}k` : cal}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height,
                              backgroundColor: isTodayBar
                                ? colors.green
                                : over ? colors.orange : colors.gray200,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barDay, isTodayBar && styles.barDayActive]}>{DAYS[i]}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={[styles.goalLine, { bottom: 26 + (goal.calories / maxCal) * 120 }]}>
                <View style={styles.goalLineDash} />
                <Text style={styles.goalLineLabel}>Meta</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Análises salvas</Text>
            <Text style={styles.sectionCount}>{meals.length} registros</Text>
          </View>

          {loading ? (
            <EmptyState title="Carregando histórico..." />
          ) : meals.length === 0 ? (
            <EmptyState title="Nenhuma análise salva" subtitle="Depois de uma análise, toque em salvar para vê-la aqui." />
          ) : (
            groupedMeals.map(group => (
              <View key={group.title} style={styles.group}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                {group.items.map(meal => (
                  <TouchableOpacity
                    key={meal.id}
                    style={styles.mealCard}
                    onPress={() => router.push({ pathname: '/result', params: { meal: JSON.stringify(meal), mode: 'saved' } })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.mealThumb}>
                      <Text style={styles.mealEmoji}>{meal.foods[0]?.emoji ?? '🥗'}</Text>
                    </View>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName}>{meal.title}</Text>
                      <Text style={styles.mealTime}>{meal.type} · {formatMealTime(meal.createdAt)}</Text>
                    </View>
                    <View style={styles.mealRight}>
                      <Text style={styles.mealCal}>{meal.calories}</Text>
                      <Text style={styles.mealCalUnit}>kcal</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => confirmDelete(meal)}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.gray300} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function buildWeeklyCalories(meals: Meal[]) {
  const values = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  const monday = new Date(now);
  const day = now.getDay() || 7;
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);

  meals.forEach(meal => {
    const date = new Date(meal.createdAt);
    const diff = Math.floor((date.getTime() - monday.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) values[diff] += meal.calories;
  });

  return values;
}

function groupMealsByDay(meals: Meal[]) {
  const groups = new Map<string, Meal[]>();
  meals.forEach(meal => {
    const title = formatDayTitle(meal.createdAt);
    groups.set(title, [...(groups.get(title) ?? []), meal]);
  });

  return Array.from(groups.entries()).map(([title, items]) => ({ title, items }));
}

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.gray900 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  periodToggle: { flexDirection: 'row', backgroundColor: colors.gray100, borderRadius: 10, padding: 3 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  periodBtnActive: { backgroundColor: colors.white },
  periodText: { fontSize: 13, color: colors.gray400, fontWeight: '500' },
  periodTextActive: { color: colors.gray900, fontWeight: '600' },
  body: { padding: 16, gap: 14 },
  summaryCard: { backgroundColor: colors.white, borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: colors.gray400, marginBottom: 4 },
  summaryCalories: { fontSize: 32, fontWeight: '700', color: colors.gray900 },
  summaryUnit: { fontSize: 16, fontWeight: '400', color: colors.gray400 },
  summaryGoal: { fontSize: 12, color: colors.gray400, marginTop: 4 },
  summaryRing: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 60, height: 60, borderRadius: 30, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontSize: 13, fontWeight: '700', color: colors.gray800 },
  chartCard: { backgroundColor: colors.white, borderRadius: 16, padding: 18 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.gray800 },
  chartAvg: { fontSize: 12, color: colors.gray400 },
  chartArea: { position: 'relative' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 168, paddingBottom: 26 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 9, color: colors.gray300, marginBottom: 2 },
  barValueActive: { color: colors.green, fontWeight: '600' },
  barTrack: { width: 28, alignItems: 'center', justifyContent: 'flex-end', flex: 1 },
  barFill: { width: 28, borderRadius: 6 },
  barDay: { fontSize: 10, color: colors.gray400 },
  barDayActive: { color: colors.green, fontWeight: '700' },
  goalLine: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalLineDash: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.orange },
  goalLineLabel: { fontSize: 9, color: colors.orange, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.gray800 },
  sectionCount: { fontSize: 12, color: colors.gray400 },
  group: { gap: 10 },
  groupTitle: { fontSize: 12, fontWeight: '700', color: colors.gray400, textTransform: 'capitalize', marginLeft: 4 },
  mealCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, padding: 14, gap: 12 },
  mealThumb: { width: 50, height: 50, borderRadius: 12, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  mealEmoji: { fontSize: 24 },
  mealInfo: { flex: 1 },
  mealName: { fontSize: 14, fontWeight: '500', color: colors.gray800 },
  mealTime: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  mealRight: { alignItems: 'flex-end', marginRight: 4 },
  mealCal: { fontSize: 15, fontWeight: '700', color: colors.gray900 },
  mealCalUnit: { fontSize: 10, color: colors.gray400 },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { backgroundColor: colors.white, borderRadius: 14, padding: 20, alignItems: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: colors.gray700 },
  emptySub: { fontSize: 12, color: colors.gray400, textAlign: 'center', marginTop: 4, lineHeight: 18 },
});
