// app/(tabs)/index.tsx
// Tela Home — hub central do app

import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bom dia ☀️</Text>
            <Text style={styles.name}>Mariana</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>M</Text>
          </View>
        </View>
        <View style={styles.streakRow}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 7 dias seguidos</Text>
          </View>
        </View>

        <View style={styles.body}>

          {/* Card de captura */}
          <View style={styles.captureCard}>
            <Text style={styles.captureLabel}>IA PRONTA</Text>
            <Text style={styles.captureTitle}>Descubra as calorias{'\n'}em segundos</Text>
            <Text style={styles.captureSub}>Fotografe e deixe a IA trabalhar</Text>
            <View style={styles.captureButtons}>
              <TouchableOpacity
                style={styles.btnCamera}
                onPress={() => router.push('/camera')}
                activeOpacity={0.85}
              >
                <Ionicons name="camera" size={16} color={colors.white} />
                <Text style={styles.btnCameraText}>Tirar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnGallery}
                onPress={() => router.push('/camera')}
                activeOpacity={0.85}
              >
                <Ionicons name="image-outline" size={16} color={colors.white} />
                <Text style={styles.btnGalleryText}>Galeria</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Resumo diário */}
          <View style={styles.dailyCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Hoje</Text>
              <Text style={styles.cardSub}>meta: 2.000 kcal</Text>
            </View>
            <View style={styles.dailyRow}>
              {/* Anel de progresso simplificado */}
              <View style={styles.ringPlaceholder}>
                <Text style={styles.ringCalories}>1.482</Text>
                <Text style={styles.ringLabel}>kcal</Text>
                <Text style={styles.ringPercent}>74%</Text>
              </View>
              <View style={styles.macrosCol}>
                <MacroRow label="Proteína"    value="98g"  percent={0.82} color={colors.green} />
                <MacroRow label="Carboidrato" value="142g" percent={0.65} color={colors.orange} />
                <MacroRow label="Gordura"     value="41g"  percent={0.52} color="#facc15" />
              </View>
            </View>
          </View>

          {/* Análises recentes */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Análises recentes</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text style={styles.sectionLink}>Ver tudo</Text>
            </TouchableOpacity>
          </View>

          <RecentMeal
            emoji="🥗"
            name="Salada Caesar com frango"
            time="Almoço · 12:34"
            calories="482"
            onPress={() => router.push('/result')}
          />
          <RecentMeal
            emoji="🥞"
            name="Panqueca integral com mel"
            time="Café · 8:15"
            calories="310"
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Componentes locais ────────────────────────────────────────────────────────

function MacroRow({ label, value, percent, color }: {
  label: string; value: string; percent: number; color: string;
}) {
  return (
    <View style={macroStyles.row}>
      <View style={macroStyles.barBg}>
        <View style={[macroStyles.barFill, { width: `${percent * 100}%` as any, backgroundColor: color }]} />
      </View>
      <View style={macroStyles.labels}>
        <Text style={macroStyles.label}>{label}</Text>
        <Text style={macroStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

function RecentMeal({ emoji, name, time, calories, onPress }: {
  emoji: string; name: string; time: string; calories: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={mealStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={mealStyles.thumb}>
        <Text style={mealStyles.emoji}>{emoji}</Text>
      </View>
      <View style={mealStyles.info}>
        <Text style={mealStyles.name}>{name}</Text>
        <Text style={mealStyles.time}>{time}</Text>
      </View>
      <Text style={mealStyles.calories}>{calories} <Text style={mealStyles.unit}>kcal</Text></Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.gray50 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: colors.white, paddingHorizontal: 24, paddingTop: 16 },
  greeting:     { fontSize: 13, color: colors.gray400 },
  name:         { fontSize: 22, fontWeight: '600', color: colors.gray900 },
  avatar:       { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { color: colors.white, fontWeight: '700', fontSize: 16 },
  streakRow:    { backgroundColor: colors.white, paddingHorizontal: 24, paddingBottom: 16 },
  streakBadge:  { alignSelf: 'flex-start', backgroundColor: colors.orangeLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  streakText:   { fontSize: 11, fontWeight: '600', color: '#ea580c' },
  body:         { padding: 16, gap: 16 },
  captureCard:  { backgroundColor: colors.darkGreenBg, borderRadius: 24, padding: 24 },
  captureLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 6 },
  captureTitle: { fontSize: 20, fontWeight: '600', color: colors.white, marginBottom: 4, lineHeight: 26 },
  captureSub:   { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },
  captureButtons: { flexDirection: 'row', gap: 10 },
  btnCamera:    { flex: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.green, borderRadius: 10, paddingVertical: 12 },
  btnCameraText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  btnGallery:   { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingVertical: 12 },
  btnGalleryText: { color: colors.white, fontSize: 14 },
  dailyCard:    { backgroundColor: colors.white, borderRadius: 16, padding: 18 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle:    { fontSize: 15, fontWeight: '600', color: colors.gray800 },
  cardSub:      { fontSize: 12, color: colors.gray400 },
  dailyRow:     { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ringPlaceholder: { width: 72, height: 72, borderRadius: 36, borderWidth: 7, borderColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  ringCalories: { fontSize: 13, fontWeight: '700', color: colors.gray900 },
  ringLabel:    { fontSize: 8, color: colors.gray400 },
  ringPercent:  { fontSize: 9, color: colors.green, fontWeight: '600' },
  macrosCol:    { flex: 1, gap: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:  { fontSize: 15, fontWeight: '600', color: colors.gray800 },
  sectionLink:   { fontSize: 13, color: colors.green, fontWeight: '500' },
});

const macroStyles = StyleSheet.create({
  row:    { gap: 4 },
  barBg:  { height: 4, backgroundColor: colors.gray100, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  label:  { fontSize: 10, color: colors.gray400 },
  value:  { fontSize: 11, fontWeight: '600', color: colors.gray800 },
});

const mealStyles = StyleSheet.create({
  card:  { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: 14, gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  info:  { flex: 1 },
  name:  { fontSize: 14, fontWeight: '500', color: colors.gray800 },
  time:  { fontSize: 12, color: colors.gray400, marginTop: 2 },
  calories: { fontSize: 15, fontWeight: '600', color: colors.gray800 },
  unit:  { fontSize: 11, fontWeight: '400', color: colors.gray400 },
});
