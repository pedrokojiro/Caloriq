// app/(tabs)/history.tsx — Tela Histórico
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../constants/colors';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const CALORIES = [1820, 2100, 1650, 2300, 1480, 1900, 482];
const MAX_CAL = 2400;
const GOAL = 2000;

const MEALS = [
  { emoji: '🥗', name: 'Salada Caesar com frango', time: 'Almoço · 12:34', cal: 482 },
  { emoji: '🥞', name: 'Panqueca integral com mel', time: 'Café · 08:15', cal: 310 },
  { emoji: '🍗', name: 'Frango grelhado com arroz', time: 'Jantar · 19:45', cal: 520 },
  { emoji: '🍎', name: 'Maçã com pasta de amendoim', time: 'Lanche · 15:30', cal: 190 },
];

export default function HistoryScreen() {
  const [period, setPeriod] = useState<'Semanal' | 'Mensal'>('Semanal');
  const todayCal = CALORIES[CALORIES.length - 1];
  const todayPct = Math.round((todayCal / GOAL) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Histórico</Text>
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
        </View>

        <View style={styles.body}>

          {/* Resumo do dia */}
          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.summaryLabel}>Hoje</Text>
              <Text style={styles.summaryCalories}>{todayCal} <Text style={styles.summaryUnit}>kcal</Text></Text>
              <Text style={styles.summaryGoal}>meta: {GOAL} kcal · {todayPct}%</Text>
            </View>
            <View style={styles.summaryRing}>
              <View style={[styles.ringInner, { borderColor: todayPct >= 100 ? colors.orange : colors.green }]}>
                <Text style={styles.ringPct}>{todayPct}%</Text>
              </View>
            </View>
          </View>

          {/* Gráfico de barras */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.cardTitle}>Esta semana</Text>
              <Text style={styles.chartAvg}>média: {Math.round(CALORIES.reduce((a, b) => a + b, 0) / CALORIES.length)} kcal</Text>
            </View>
            {/* Linha da meta */}
            <View style={styles.chartArea}>
              <View style={styles.bars}>
                {CALORIES.map((cal, i) => {
                  const isToday = i === CALORIES.length - 1;
                  const height = Math.max(8, (cal / MAX_CAL) * 120);
                  const over = cal > GOAL;
                  return (
                    <View key={i} style={styles.barCol}>
                      <Text style={[styles.barValue, isToday && styles.barValueActive]}>
                        {cal >= 1000 ? `${(cal / 1000).toFixed(1)}k` : cal}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height,
                              backgroundColor: isToday
                                ? colors.green
                                : over ? colors.orange : colors.gray200,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barDay, isToday && styles.barDayActive]}>{DAYS[i]}</Text>
                    </View>
                  );
                })}
              </View>
              {/* Linha de meta */}
              <View style={[styles.goalLine, { bottom: 26 + (GOAL / MAX_CAL) * 120 }]}>
                <View style={styles.goalLineDash} />
                <Text style={styles.goalLineLabel}>Meta</Text>
              </View>
            </View>
          </View>

          {/* Refeições do dia */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Refeições de hoje</Text>
            <Text style={styles.sectionCount}>{MEALS.length} registros</Text>
          </View>

          {MEALS.map((meal, i) => (
            <TouchableOpacity
              key={i}
              style={styles.mealCard}
              onPress={() => router.push('/result')}
              activeOpacity={0.8}
            >
              <View style={styles.mealThumb}>
                <Text style={styles.mealEmoji}>{meal.emoji}</Text>
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealTime}>{meal.time}</Text>
              </View>
              <View style={styles.mealRight}>
                <Text style={styles.mealCal}>{meal.cal}</Text>
                <Text style={styles.mealCalUnit}>kcal</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.gray300} />
            </TouchableOpacity>
          ))}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.gray50 },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  headerTitle:      { fontSize: 22, fontWeight: '700', color: colors.gray900 },
  periodToggle:     { flexDirection: 'row', backgroundColor: colors.gray100, borderRadius: 10, padding: 3 },
  periodBtn:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  periodBtnActive:  { backgroundColor: colors.white },
  periodText:       { fontSize: 13, color: colors.gray400, fontWeight: '500' },
  periodTextActive: { color: colors.gray900, fontWeight: '600' },
  body:             { padding: 16, gap: 14 },

  // Summary card
  summaryCard:      { backgroundColor: colors.white, borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel:     { fontSize: 12, color: colors.gray400, marginBottom: 4 },
  summaryCalories:  { fontSize: 32, fontWeight: '700', color: colors.gray900 },
  summaryUnit:      { fontSize: 16, fontWeight: '400', color: colors.gray400 },
  summaryGoal:      { fontSize: 12, color: colors.gray400, marginTop: 4 },
  summaryRing:      { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  ringInner:        { width: 60, height: 60, borderRadius: 30, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  ringPct:          { fontSize: 13, fontWeight: '700', color: colors.gray800 },

  // Chart
  chartCard:        { backgroundColor: colors.white, borderRadius: 16, padding: 18 },
  chartHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle:        { fontSize: 15, fontWeight: '600', color: colors.gray800 },
  chartAvg:         { fontSize: 12, color: colors.gray400 },
  chartArea:        { position: 'relative' },
  bars:             { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 168, paddingBottom: 26 },
  barCol:           { flex: 1, alignItems: 'center', gap: 4 },
  barValue:         { fontSize: 9, color: colors.gray300, marginBottom: 2 },
  barValueActive:   { color: colors.green, fontWeight: '600' },
  barTrack:         { width: 28, alignItems: 'center', justifyContent: 'flex-end', flex: 1 },
  barFill:          { width: 28, borderRadius: 6 },
  barDay:           { fontSize: 10, color: colors.gray400 },
  barDayActive:     { color: colors.green, fontWeight: '700' },
  goalLine:         { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalLineDash:     { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.orange },
  goalLineLabel:    { fontSize: 9, color: colors.orange, fontWeight: '600' },

  // Meals
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:     { fontSize: 15, fontWeight: '600', color: colors.gray800 },
  sectionCount:     { fontSize: 12, color: colors.gray400 },
  mealCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, padding: 14, gap: 12 },
  mealThumb:        { width: 50, height: 50, borderRadius: 12, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  mealEmoji:        { fontSize: 24 },
  mealInfo:         { flex: 1 },
  mealName:         { fontSize: 14, fontWeight: '500', color: colors.gray800 },
  mealTime:         { fontSize: 12, color: colors.gray400, marginTop: 2 },
  mealRight:        { alignItems: 'flex-end', marginRight: 4 },
  mealCal:          { fontSize: 15, fontWeight: '700', color: colors.gray900 },
  mealCalUnit:      { fontSize: 10, color: colors.gray400 },
});
