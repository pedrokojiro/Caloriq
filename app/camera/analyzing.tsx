import { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../constants/colors';
import { analyzeMealImage } from '../../lib/mealAnalysis';

const STEPS = [
  { text: 'Imagem recebida e processada', done: true },
  { text: 'Enviando para a IA local', done: true },
  { text: 'Identificando alimentos visíveis...', done: false },
  { text: 'Estimando calorias e macros', done: false },
];

export default function AnalyzingScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    const makePulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1.4,
            duration: 900,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 900,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );

    const a1 = makePulse(pulse1, 0);
    const a2 = makePulse(pulse2, 300);
    const a3 = makePulse(pulse3, 600);
    a1.start();
    a2.start();
    a3.start();

    let canceled = false;

    async function runAnalysis() {
      const [meal] = await Promise.all([
        analyzeMealImage(imageUri),
        new Promise(resolve => setTimeout(resolve, 2600)),
      ]);

      if (canceled) return;
      router.replace({
        pathname: '/result',
        params: { meal: JSON.stringify(meal), mode: 'new' },
      });
    }

    runAnalysis();

    return () => {
      canceled = true;
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [fadeAnim, imageUri, pulse1, pulse2, pulse3]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.pulseWrapper}>
          {[pulse3, pulse2, pulse1].map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: anim }],
                  opacity: anim.interpolate({
                    inputRange: [1, 1.4],
                    outputRange: [0.15 + i * 0.08, 0],
                  }),
                },
              ]}
            />
          ))}

          <View style={styles.imageBox}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <Text style={styles.placeholder}>🥗</Text>
            )}
          </View>
        </View>

        <Text style={styles.label}>IA TRABALHANDO</Text>
        <Text style={styles.title}>Analisando alimentos e{'\n'}estimando calorias...</Text>
        <Text style={styles.subtitle}>No Ollama, a primeira análise pode levar mais tempo</Text>

        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.dot, step.done ? styles.dotDone : styles.dotPending]} />
              <Text style={[styles.stepText, step.done && styles.stepTextDone]}>
                {step.text}
              </Text>
              {step.done && <Text style={styles.checkmark}>✓</Text>}
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray900 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  pulseWrapper: { width: 224, height: 224, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  pulseRing: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: 112,
    backgroundColor: colors.green,
  },
  imageBox: { width: 160, height: 160, borderRadius: 28, backgroundColor: '#1a2e1f', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 10 },
  image: { width: '100%', height: '100%' },
  placeholder: { fontSize: 72 },
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '600', color: colors.white, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 40 },
  steps: { width: '100%', gap: 10 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  dotDone: { backgroundColor: colors.green },
  dotPending: { backgroundColor: 'rgba(255,255,255,0.2)' },
  stepText: { flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  stepTextDone: { color: colors.white, fontWeight: '500' },
  checkmark: { fontSize: 12, color: colors.green, fontWeight: '700' },
});
