import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/colors';
import { DailyGoal, Meal, UserProfile } from '../../lib/types';
import { formatMealTime, getGoal, getMeals, getProfile, isToday } from '../../lib/storage';
import { defaultGoal, defaultProfile } from '../../lib/defaults';

export default function HomeScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [goal, setGoal] = useState<DailyGoal>(defaultGoal);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadData() {
        try {
          const [storedMeals, storedGoal, storedProfile] = await Promise.all([
            getMeals(),
            getGoal(),
            getProfile(),
          ]);

          if (!mounted) return;
          setMeals(storedMeals);
          setGoal(storedGoal);
          setProfile(storedProfile);
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
  const todayCalories = todayMeals.reduce((total, meal) => total + meal.calories, 0);
  const todayMacros = todayMeals.reduce(
    (total, meal) => ({
      protein: total.protein + meal.macros.protein,
      carbs: total.carbs + meal.macros.carbs,
      fat: total.fat + meal.macros.fat,
      fiber: total.fiber + meal.macros.fiber,
    }),
    { protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
  const todayPct = goal.calories > 0 ? Math.round((todayCalories / goal.calories) * 100) : 0;
  const firstName = profile.name.split(' ')[0] || 'Mariana';

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      router.push({
        pathname: '/camera/analyzing',
        params: { imageUri: result.assets[0].uri },
      });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bom dia</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
            <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.streakRow}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>{todayMeals.length} refeições hoje</Text>
          </View>
        </View>

        <View style={styles.body}>
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
                onPress={handlePickImage}
                activeOpacity={0.85}
              >
                <Ionicons name="image-outline" size={16} color={colors.white} />
                <Text style={styles.btnGalleryText}>Galeria</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dailyCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Hoje</Text>
              <Text style={styles.cardSub}>meta: {goal.calories.toLocaleString('pt-BR')} kcal</Text>
            </View>
            <View style={styles.dailyRow}>
              <View style={styles.ringPlaceholder}>
                <Text style={styles.ringCalories}>{todayCalories.toLocaleString('pt-BR')}</Text>
                <Text style={styles.ringLabel}>kcal</Text>
                <Text style={styles.ringPercent}>{Math.min(todayPct, 999)}%</Text>
              </View>
              <View style={styles.macrosCol}>
                <MacroRow label="Proteína" value={`${todayMacros.protein}g`} percent={todayMacros.protein / goal.protein} color={colors.green} />
                <MacroRow label="Carboidrato" value={`${todayMacros.carbs}g`} percent={todayMacros.carbs / goal.carbs} color={colors.orange} />
                <MacroRow label="Gordura" value={`${todayMacros.fat}g`} percent={todayMacros.fat / goal.fat} color="#facc15" />
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Análises recentes</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text style={styles.sectionLink}>Ver tudo</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <EmptyState title="Carregando refeições..." />
          ) : meals.length === 0 ? (
            <EmptyState title="Nenhuma análise salva" subtitle="Use a câmera para registrar sua primeira refeição." />
          ) : (
            meals.slice(0, 3).map(meal => (
              <RecentMeal
                key={meal.id}
                meal={meal}
                onPress={() => router.push({ pathname: '/result', params: { meal: JSON.stringify(meal), mode: 'saved' } })}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroRow({ label, value, percent, color }: {
  label: string; value: string; percent: number; color: string;
}) {
  const width = `${Math.min(Math.max(percent || 0, 0), 1) * 100}%`;
  return (
    <View style={macroStyles.row}>
      <View style={macroStyles.barBg}>
        <View style={[macroStyles.barFill, { width: width as any, backgroundColor: color }]} />
      </View>
      <View style={macroStyles.labels}>
        <Text style={macroStyles.label}>{label}</Text>
        <Text style={macroStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

function RecentMeal({ meal, onPress }: { meal: Meal; onPress: () => void }) {
  return (
    <TouchableOpacity style={mealStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={mealStyles.thumb}>
        <Text style={mealStyles.emoji}>{meal.foods[0]?.emoji ?? '🥗'}</Text>
      </View>
      <View style={mealStyles.info}>
        <Text style={mealStyles.name}>{meal.title}</Text>
        <Text style={mealStyles.time}>{meal.type} · {formatMealTime(meal.createdAt)}</Text>
      </View>
      <Text style={mealStyles.calories}>{meal.calories} <Text style={mealStyles.unit}>kcal</Text></Text>
    </TouchableOpacity>
  );
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: colors.white, paddingHorizontal: 24, paddingTop: 16 },
  greeting: { fontSize: 13, color: colors.gray400 },
  name: { fontSize: 22, fontWeight: '600', color: colors.gray900 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  streakRow: { backgroundColor: colors.white, paddingHorizontal: 24, paddingBottom: 16 },
  streakBadge: { alignSelf: 'flex-start', backgroundColor: colors.orangeLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  streakText: { fontSize: 11, fontWeight: '600', color: '#ea580c' },
  body: { padding: 16, gap: 16 },
  captureCard: { backgroundColor: colors.darkGreenBg, borderRadius: 24, padding: 24 },
  captureLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 6 },
  captureTitle: { fontSize: 20, fontWeight: '600', color: colors.white, marginBottom: 4, lineHeight: 26 },
  captureSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },
  captureButtons: { flexDirection: 'row', gap: 10 },
  btnCamera: { flex: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.green, borderRadius: 10, paddingVertical: 12 },
  btnCameraText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  btnGallery: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingVertical: 12 },
  btnGalleryText: { color: colors.white, fontSize: 14 },
  dailyCard: { backgroundColor: colors.white, borderRadius: 16, padding: 18 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.gray800 },
  cardSub: { fontSize: 12, color: colors.gray400 },
  dailyRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ringPlaceholder: { width: 78, height: 78, borderRadius: 39, borderWidth: 7, borderColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  ringCalories: { fontSize: 13, fontWeight: '700', color: colors.gray900 },
  ringLabel: { fontSize: 8, color: colors.gray400 },
  ringPercent: { fontSize: 9, color: colors.green, fontWeight: '600' },
  macrosCol: { flex: 1, gap: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.gray800 },
  sectionLink: { fontSize: 13, color: colors.green, fontWeight: '500' },
  emptyCard: { backgroundColor: colors.white, borderRadius: 14, padding: 18, alignItems: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: colors.gray700 },
  emptySub: { fontSize: 12, color: colors.gray400, textAlign: 'center', marginTop: 4 },
});

const macroStyles = StyleSheet.create({
  row: { gap: 4 },
  barBg: { height: 4, backgroundColor: colors.gray100, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 10, color: colors.gray400 },
  value: { fontSize: 11, fontWeight: '600', color: colors.gray800 },
});

const mealStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: 14, gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500', color: colors.gray800 },
  time: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  calories: { fontSize: 15, fontWeight: '600', color: colors.gray800 },
  unit: { fontSize: 11, fontWeight: '400', color: colors.gray400 },
});
