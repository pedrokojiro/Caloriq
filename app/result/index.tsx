import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { createAnalyzedMeal } from '../../lib/mealAnalysis';
import { deleteMeal, saveMeal } from '../../lib/storage';
import { Meal } from '../../lib/types';

type ResultMode = 'new' | 'saved';

export default function ResultScreen() {
  const { meal: mealParam, mode } = useLocalSearchParams<{ meal?: string; mode?: ResultMode }>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(mode === 'saved');
  const [deleting, setDeleting] = useState(false);

  const parsed = useMemo(() => parseMeal(mealParam), [mealParam]);
  const meal = parsed.meal;
  const isSavedDetail = saved || mode === 'saved';
  const hasAnalysisError = meal.analysisSource === 'error';

  async function handleSave() {
    if (isSavedDetail || hasAnalysisError) return;

    try {
      setSaving(true);
      await saveMeal(meal);
      setSaved(true);
      router.replace({
        pathname: '/result',
        params: { meal: JSON.stringify(meal), mode: 'saved' },
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a análise. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Excluir análise',
      'Essa análise será removida do histórico.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    try {
      setDeleting(true);
      await deleteMeal(meal.id);
      router.replace('/(tabs)/history');
    } catch {
      Alert.alert('Erro', 'Não foi possível excluir a análise.');
    } finally {
      setDeleting(false);
    }
  }

  if (!parsed.valid) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={42} color={colors.orange} />
          <Text style={styles.errorTitle}>Análise indisponível</Text>
          <Text style={styles.errorText}>Não encontramos os dados dessa refeição.</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.errorBtnText}>Voltar ao início</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.hero}>
          {meal.imageUri ? (
            <Image source={{ uri: meal.imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text style={styles.heroPlaceholder}>🥗</Text>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.heroOverlay}>
            <Text style={styles.heroCalories}>{meal.calories} <Text style={styles.heroUnit}>kcal</Text></Text>
            <Text style={styles.heroMeal}>{meal.title} · {meal.type}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.badge}>
            <View style={[styles.badgeDot, isSavedDetail && styles.badgeDotSaved, hasAnalysisError && styles.badgeDotError]} />
            <Text style={styles.badgeText}>{getBadgeText(meal, isSavedDetail)}</Text>
            <Text style={[styles.badgePct, hasAnalysisError && styles.badgePctError]}>
              {hasAnalysisError ? 'Erro' : isSavedDetail ? 'Salva' : `${meal.confidence}%`}
            </Text>
          </View>

          {hasAnalysisError ? (
            <View style={styles.analysisErrorCard}>
              <Ionicons name="warning-outline" size={26} color={colors.orange} />
              <Text style={styles.analysisErrorTitle}>A IA não conseguiu concluir a análise</Text>
              <Text style={styles.analysisErrorText}>{meal.analysisError}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Alimentos identificados</Text>
              <View style={styles.foodList}>
                {meal.foods.map((food, i) => (
                  <View key={food.id} style={[styles.foodRow, i < meal.foods.length - 1 && styles.foodRowBorder]}>
                    <View style={styles.foodEmoji}>
                      <Text style={styles.foodEmojiText}>{food.emoji}</Text>
                    </View>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      <Text style={styles.foodPortion}>{food.portion}</Text>
                    </View>
                    <Text style={styles.foodCal}>{food.calories} kcal</Text>
                  </View>
                ))}
              </View>

              <View style={styles.macroCard}>
                <Text style={styles.sectionTitle}>Macronutrientes</Text>
                <View style={styles.macroRow}>
                  <MacroBlock label="Proteínas" value={`${meal.macros.protein}g`} bg={colors.proteinBg} textColor={colors.protein} />
                  <MacroBlock label="Carboidratos" value={`${meal.macros.carbs}g`} bg={colors.carbBg} textColor={colors.carb} />
                  <MacroBlock label="Gorduras" value={`${meal.macros.fat}g`} bg={colors.fatBg} textColor={colors.fat} />
                  <MacroBlock label="Fibras" value={`${meal.macros.fiber}g`} bg="#f0f9ff" textColor="#0ea5e9" />
                </View>
              </View>
            </>
          )}

          <View style={styles.actions}>
            {isSavedDetail ? (
              <>
                <TouchableOpacity
                  style={[styles.btnOutline, deleting && styles.btnDisabled]}
                  onPress={confirmDelete}
                  disabled={deleting}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  <Text style={styles.btnDangerText}>{deleting ? 'Excluindo...' : 'Excluir análise'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSave} onPress={() => router.replace('/camera')} activeOpacity={0.85}>
                  <Ionicons name="camera-outline" size={16} color={colors.white} />
                  <Text style={styles.btnSaveText}>Nova análise</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.btnOutline} onPress={() => router.replace('/camera')}>
                  <Ionicons name="camera-outline" size={16} color={colors.gray700} />
                  <Text style={styles.btnOutlineText}>Refazer</Text>
                </TouchableOpacity>
                {!hasAnalysisError && (
                  <TouchableOpacity
                    style={[styles.btnSave, saving && styles.btnDisabled]}
                    onPress={handleSave}
                    activeOpacity={0.85}
                    disabled={saving}
                  >
                    <Ionicons name="save-outline" size={16} color={colors.white} />
                    <Text style={styles.btnSaveText}>{saving ? 'Salvando...' : 'Salvar análise'}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getBadgeText(meal: Meal, isSavedDetail: boolean) {
  if (meal.analysisSource === 'error') return 'Falha na análise da IA';
  if (meal.analysisSource === 'demo' && meal.analysisError) return 'Estimativa local conservadora';
  if (meal.analysisSource === 'demo') return 'Resultado demonstrativo';
  if (isSavedDetail) return 'Análise salva no histórico';
  return 'Precisão estimada da análise';
}

function parseMeal(mealParam?: string): { meal: Meal; valid: boolean } {
  if (!mealParam) {
    return { meal: createAnalyzedMeal(), valid: false };
  }

  try {
    const meal = JSON.parse(mealParam) as Meal;
    const valid = Boolean(meal.id && meal.title && meal.createdAt && Array.isArray(meal.foods));
    return { meal: valid ? meal : createAnalyzedMeal(), valid };
  } catch {
    return { meal: createAnalyzedMeal(), valid: false };
  }
}

function MacroBlock({ label, value, bg, textColor }: {
  label: string; value: string; bg: string; textColor: string;
}) {
  return (
    <View style={[macroStyles.block, { backgroundColor: bg }]}>
      <Text style={[macroStyles.value, { color: textColor }]}>{value}</Text>
      <Text style={macroStyles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  hero: { height: 240, backgroundColor: '#2d5a3e', alignItems: 'center', justifyContent: 'center' },
  heroPlaceholder: { fontSize: 90 },
  backBtn: { position: 'absolute', top: 48, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 48, backgroundColor: 'rgba(0,0,0,0.22)' },
  heroCalories: { fontSize: 36, fontWeight: '700', color: colors.white },
  heroUnit: { fontSize: 16, fontWeight: '400', color: 'rgba(255,255,255,0.7)' },
  heroMeal: { fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 2 },
  body: { padding: 16, gap: 14 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 10, padding: 12 },
  badgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  badgeDotSaved: { backgroundColor: colors.orange },
  badgeDotError: { backgroundColor: '#ef4444' },
  badgeText: { flex: 1, fontSize: 13, color: colors.gray600 },
  badgePct: { fontSize: 14, fontWeight: '600', color: colors.green },
  badgePctError: { color: '#ef4444' },
  analysisErrorCard: { backgroundColor: colors.white, borderRadius: 14, padding: 18, alignItems: 'center' },
  analysisErrorTitle: { fontSize: 15, fontWeight: '700', color: colors.gray900, marginTop: 10 },
  analysisErrorText: { fontSize: 13, color: colors.gray500, textAlign: 'center', lineHeight: 18, marginTop: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.gray800, marginBottom: 10 },
  foodList: { backgroundColor: colors.white, borderRadius: 14, overflow: 'hidden' },
  foodRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  foodRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  foodEmoji: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.gray50, alignItems: 'center', justifyContent: 'center' },
  foodEmojiText: { fontSize: 22 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 14, fontWeight: '500', color: colors.gray800 },
  foodPortion: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  foodCal: { fontSize: 13, fontWeight: '600', color: colors.gray800 },
  macroCard: { backgroundColor: colors.white, borderRadius: 14, padding: 16 },
  macroRow: { flexDirection: 'row', gap: 8 },
  actions: { flexDirection: 'row', gap: 10, paddingBottom: 24 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 10, borderWidth: 1.5, borderColor: colors.gray200 },
  btnOutlineText: { fontSize: 14, color: colors.gray700 },
  btnDangerText: { fontSize: 14, color: '#ef4444', fontWeight: '500' },
  btnSave: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 10, backgroundColor: colors.gray900 },
  btnSaveText: { fontSize: 14, fontWeight: '500', color: colors.white },
  btnDisabled: { opacity: 0.65 },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: colors.gray900, marginTop: 12 },
  errorText: { fontSize: 14, color: colors.gray500, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  errorBtn: { backgroundColor: colors.gray900, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  errorBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
});

const macroStyles = StyleSheet.create({
  block: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  value: { fontSize: 18, fontWeight: '600' },
  label: { fontSize: 9, color: colors.gray400, marginTop: 4 },
});
