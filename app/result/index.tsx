// app/result/index.tsx — Resultado da análise
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

const FOODS = [
  { emoji: '🥬', name: 'Alface romana',   portion: '120g · 1 porção',    cal: '18 kcal' },
  { emoji: '🍗', name: 'Frango grelhado', portion: '150g · 1 filé médio', cal: '248 kcal' },
  { emoji: '🧀', name: 'Parmesão ralado', portion: '20g · 1 colher',      cal: '83 kcal' },
  { emoji: '🫙', name: 'Molho Caesar',    portion: '30ml · 2 colheres',   cal: '133 kcal' },
];

export default function ResultScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray50 }}>
      <ScrollView>
        {/* Hero */}
        <View style={styles.hero}>
          {imageUri
            ? <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            : <Text style={{ fontSize: 90 }}>🥗</Text>
          }
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.heroOverlay}>
            <Text style={styles.heroCalories}>482 <Text style={styles.heroUnit}>kcal</Text></Text>
            <Text style={styles.heroMeal}>Salada Caesar com frango  ·  Almoço</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Precisão */}
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Precisão estimada da análise</Text>
            <Text style={styles.badgePct}>82%</Text>
          </View>

          {/* Alimentos */}
          <Text style={styles.sectionTitle}>Alimentos identificados</Text>
          <View style={styles.foodList}>
            {FOODS.map((f, i) => (
              <View key={i} style={[styles.foodRow, i < FOODS.length - 1 && styles.foodRowBorder]}>
                <View style={styles.foodEmoji}>
                  <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foodName}>{f.name}</Text>
                  <Text style={styles.foodPortion}>{f.portion}</Text>
                </View>
                <Text style={styles.foodCal}>{f.cal}</Text>
              </View>
            ))}
          </View>

          {/* Macros */}
          <View style={styles.macroCard}>
            <Text style={styles.sectionTitle}>Macronutrientes</Text>
            <View style={styles.macroRow}>
              <MacroBlock label="Proteínas"    value="42g" bg={colors.proteinBg} textColor={colors.protein} />
              <MacroBlock label="Carboidratos" value="18g" bg={colors.carbBg}    textColor={colors.carb} />
              <MacroBlock label="Gorduras"     value="28g" bg={colors.fatBg}     textColor={colors.fat} />
            </View>
          </View>

          {/* Ações */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnOutline}>
              <Text style={styles.btnOutlineText}>Editar itens</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSave}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.85}
            >
              <Ionicons name="save-outline" size={16} color={colors.white} />
              <Text style={styles.btnSaveText}>Salvar refeição</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  hero:        { height: 220, backgroundColor: '#2d5a3e', alignItems: 'center', justifyContent: 'center' },
  backBtn:     { position: 'absolute', top: 48, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 40 },
  heroCalories:{ fontSize: 36, fontWeight: '700', color: colors.white },
  heroUnit:    { fontSize: 16, fontWeight: '400', color: 'rgba(255,255,255,0.7)' },
  heroMeal:    { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  body:        { padding: 16, gap: 14 },
  badge:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 10, padding: 12 },
  badgeDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  badgeText:   { flex: 1, fontSize: 13, color: colors.gray600 },
  badgePct:    { fontSize: 14, fontWeight: '600', color: colors.green },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.gray800, marginBottom: 10 },
  foodList:    { backgroundColor: colors.white, borderRadius: 14, overflow: 'hidden' },
  foodRow:     { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  foodRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  foodEmoji:   { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.gray50, alignItems: 'center', justifyContent: 'center' },
  foodName:    { fontSize: 14, fontWeight: '500', color: colors.gray800 },
  foodPortion: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  foodCal:     { fontSize: 13, fontWeight: '600', color: colors.gray800 },
  macroCard:   { backgroundColor: colors.white, borderRadius: 14, padding: 16 },
  macroRow:    { flexDirection: 'row', gap: 12 },
  actions:     { flexDirection: 'row', gap: 10, paddingBottom: 24 },
  btnOutline:  { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1.5, borderColor: colors.gray200, alignItems: 'center' },
  btnOutlineText: { fontSize: 14, color: colors.gray700 },
  btnSave:     { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 10, backgroundColor: colors.gray900 },
  btnSaveText: { fontSize: 14, fontWeight: '500', color: colors.white },
});

const macroStyles = StyleSheet.create({
  block: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  value: { fontSize: 20, fontWeight: '600' },
  label: { fontSize: 10, color: colors.gray400, marginTop: 4 },
});
