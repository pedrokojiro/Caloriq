// app/(tabs)/goals.tsx — Tela Minhas Metas
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

const MACROS = [
  {
    label: 'Proteína',
    consumed: 98,
    goal: 120,
    unit: 'g',
    color: colors.green,
    bg: colors.proteinBg,
    icon: '🥩',
  },
  {
    label: 'Carboidrato',
    consumed: 142,
    goal: 220,
    unit: 'g',
    color: colors.orange,
    bg: '#fff7ed',
    icon: '🌾',
  },
  {
    label: 'Gordura',
    consumed: 41,
    goal: 65,
    unit: 'g',
    color: '#a855f7',
    bg: '#faf5ff',
    icon: '🫐',
  },
  {
    label: 'Fibra',
    consumed: 18,
    goal: 30,
    unit: 'g',
    color: '#0ea5e9',
    bg: '#f0f9ff',
    icon: '🥦',
  },
];

const TOTAL_CONSUMED = 1482;
const TOTAL_GOAL = 3000;
const TOTAL_PCT = Math.round((TOTAL_CONSUMED / TOTAL_GOAL) * 100);

const STATS = [
  { label: 'Peso atual', value: '68 kg' },
  { label: 'Peso meta', value: '65 kg' },
  { label: 'Altura', value: '165 cm' },
  { label: 'IMC', value: '25.0' },
];

export default function GoalsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Minhas metas</Text>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="create-outline" size={20} color={colors.green} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>

          {/* Caloria total */}
          <View style={styles.calorieCard}>
            <View style={styles.calorieLeft}>
              <Text style={styles.calorieLabel}>Calorias hoje</Text>
              <Text style={styles.calorieValue}>
                {TOTAL_CONSUMED.toLocaleString('pt-BR')}
                <Text style={styles.calorieUnit}> / {TOTAL_GOAL.toLocaleString('pt-BR')} kcal</Text>
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(TOTAL_PCT, 100)}%` as any }]} />
              </View>
              <Text style={styles.calorieRemaining}>
                {(TOTAL_GOAL - TOTAL_CONSUMED).toLocaleString('pt-BR')} kcal restantes
              </Text>
            </View>
            <View style={styles.calorieRing}>
              <View style={styles.calorieRingInner}>
                <Text style={styles.calorieRingPct}>{TOTAL_PCT}%</Text>
                <Text style={styles.calorieRingLabel}>da meta</Text>
              </View>
            </View>
          </View>

          {/* Macros */}
          <Text style={styles.sectionTitle}>Macronutrientes</Text>
          <View style={styles.macroGrid}>
            {MACROS.map((m, i) => {
              const pct = Math.round((m.consumed / m.goal) * 100);
              return (
                <View key={i} style={[styles.macroCard, { backgroundColor: m.bg }]}>
                  <View style={styles.macroTop}>
                    <Text style={styles.macroIcon}>{m.icon}</Text>
                    <Text style={[styles.macroPct, { color: m.color }]}>{pct}%</Text>
                  </View>
                  <Text style={[styles.macroValue, { color: m.color }]}>{m.consumed}{m.unit}</Text>
                  <Text style={styles.macroLabel}>{m.label}</Text>
                  <View style={styles.macroTrack}>
                    <View
                      style={[
                        styles.macroFill,
                        { width: `${Math.min(pct, 100)}%` as any, backgroundColor: m.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.macroGoal}>meta: {m.goal}{m.unit}</Text>
                </View>
              );
            })}
          </View>

          {/* Dados corporais */}
          <Text style={styles.sectionTitle}>Dados corporais</Text>
          <View style={styles.statsCard}>
            {STATS.map((s, i) => (
              <View key={i} style={[styles.statRow, i < STATS.length - 1 && styles.statRowBorder]}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* Objetivo */}
          <View style={styles.objectiveCard}>
            <View style={styles.objectiveIcon}>
              <Ionicons name="trophy" size={20} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.objectiveTitle}>Objetivo</Text>
              <Text style={styles.objectiveValue}>Perda de peso moderada</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.objectiveChange}>Alterar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.gray50 },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  headerTitle:       { fontSize: 22, fontWeight: '700', color: colors.gray900 },
  editBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  body:              { padding: 16, gap: 14 },

  // Calorie card
  calorieCard:       { backgroundColor: colors.white, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  calorieLeft:       { flex: 1 },
  calorieLabel:      { fontSize: 12, color: colors.gray400, marginBottom: 4 },
  calorieValue:      { fontSize: 26, fontWeight: '700', color: colors.gray900 },
  calorieUnit:       { fontSize: 13, fontWeight: '400', color: colors.gray400 },
  progressTrack:     { height: 8, backgroundColor: colors.gray100, borderRadius: 4, overflow: 'hidden', marginTop: 10, marginBottom: 6 },
  progressFill:      { height: 8, backgroundColor: colors.green, borderRadius: 4 },
  calorieRemaining:  { fontSize: 12, color: colors.gray400 },
  calorieRing:       { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  calorieRingInner:  { width: 68, height: 68, borderRadius: 34, borderWidth: 6, borderColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  calorieRingPct:    { fontSize: 15, fontWeight: '700', color: colors.gray900 },
  calorieRingLabel:  { fontSize: 9, color: colors.gray400 },

  // Section
  sectionTitle:      { fontSize: 15, fontWeight: '600', color: colors.gray800 },

  // Macro grid
  macroGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  macroCard:         { width: '47.5%', borderRadius: 14, padding: 14 },
  macroTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  macroIcon:         { fontSize: 20 },
  macroPct:          { fontSize: 12, fontWeight: '700' },
  macroValue:        { fontSize: 22, fontWeight: '700' },
  macroLabel:        { fontSize: 12, color: colors.gray500, marginTop: 2, marginBottom: 8 },
  macroTrack:        { height: 4, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  macroFill:         { height: 4, borderRadius: 2 },
  macroGoal:         { fontSize: 10, color: colors.gray400 },

  // Stats card
  statsCard:         { backgroundColor: colors.white, borderRadius: 14, overflow: 'hidden' },
  statRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  statRowBorder:     { borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  statLabel:         { fontSize: 14, color: colors.gray600 },
  statValue:         { fontSize: 14, fontWeight: '600', color: colors.gray900 },

  // Objective
  objectiveCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 14, padding: 16 },
  objectiveIcon:     { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  objectiveTitle:    { fontSize: 12, color: colors.gray400 },
  objectiveValue:    { fontSize: 14, fontWeight: '500', color: colors.gray800 },
  objectiveChange:   { fontSize: 13, color: colors.green, fontWeight: '500' },
});
