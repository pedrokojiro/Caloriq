// app/camera/analyzing.tsx — Tela de análise com IA
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../constants/colors';

const STEPS = [
  { text: 'Imagem recebida e processada', done: true },
  { text: 'Alimentos identificados: 4 itens', done: true },
  { text: 'Calculando porções e calorias...', done: false },
  { text: 'Gerando estimativa nutricional', done: false },
];

export default function AnalyzingScreen() {
  useEffect(() => {
    // Simula tempo de análise — substituir pela chamada real à API de IA
    const timer = setTimeout(() => {
      router.replace('/result');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Imagem do prato */}
      <View style={styles.imageBox}>
        <Text style={{ fontSize: 90 }}>🥗</Text>
      </View>

      <Text style={styles.label}>IA TRABALHANDO</Text>
      <Text style={styles.title}>Analisando alimentos e{'\n'}estimando calorias...</Text>
      <Text style={styles.subtitle}>Isso leva apenas alguns segundos</Text>

      {/* Steps */}
      <View style={styles.steps}>
        {STEPS.map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={[styles.dot, step.done ? styles.dotDone : styles.dotPending]} />
            <Text style={[styles.stepText, step.done && styles.stepTextDone]}>
              {step.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray900, alignItems: 'center', justifyContent: 'center', padding: 40 },
  imageBox:  { width: 224, height: 224, borderRadius: 32, backgroundColor: '#1a2e1f', alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  label:     { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 12 },
  title:     { fontSize: 22, fontWeight: '600', color: colors.white, textAlign: 'center', marginBottom: 8 },
  subtitle:  { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 40 },
  steps:     { width: '100%', gap: 10 },
  step:      { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  dotDone:   { backgroundColor: colors.green },
  dotPending: { backgroundColor: 'rgba(255,255,255,0.2)' },
  stepText:  { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  stepTextDone: { color: colors.white, fontWeight: '500' },
});
