import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

type AuthProvider = 'Google' | 'Apple';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | 'email' | null>(null);

  function enterApp() {
    router.replace('/(tabs)');
  }

  function handleEmailLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Informe e-mail e senha para entrar.');
      return;
    }

    setLoadingProvider('email');
    setTimeout(enterApp, 450);
  }

  function handleSocialLogin(provider: AuthProvider) {
    setLoadingProvider(provider);
    setTimeout(enterApp, 450);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoRow}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoIconText}>Q</Text>
        </View>
        <Text style={styles.logoText}>CaloriQ</Text>
      </View>

      <Text style={styles.title}>Boas-vindas{'\n'}de volta</Text>
      <Text style={styles.subtitle}>Controle sua dieta com inteligência</Text>

      <View style={styles.form}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor={colors.gray300}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.gray300}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Esqueci a senha</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.btnPrimary, loadingProvider === 'email' && styles.disabled]}
        onPress={handleEmailLogin}
        activeOpacity={0.85}
        disabled={loadingProvider !== null}
      >
        <Text style={styles.btnPrimaryText}>{loadingProvider === 'email' ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou entre com</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.btnSocial, loadingProvider === 'Google' && styles.disabled]}
        onPress={() => handleSocialLogin('Google')}
        disabled={loadingProvider !== null}
        activeOpacity={0.85}
      >
        <Ionicons name="logo-google" size={18} color="#4285f4" />
        <Text style={styles.btnSocialText}>
          {loadingProvider === 'Google' ? 'Conectando...' : 'Continuar com Google'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btnSocial, loadingProvider === 'Apple' && styles.disabled]}
        onPress={() => handleSocialLogin('Apple')}
        disabled={loadingProvider !== null}
        activeOpacity={0.85}
      >
        <Ionicons name="logo-apple" size={20} color={colors.gray900} />
        <Text style={styles.btnSocialText}>
          {loadingProvider === 'Apple' ? 'Conectando...' : 'Continuar com Apple'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.guestRow}
        onPress={() => router.push('/signup')}
        disabled={loadingProvider !== null}
      >
        <Text style={styles.guestText}>
          Não tem conta? <Text style={styles.guestLink}>Cadastre-se</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.guestRow}
        onPress={enterApp}
        disabled={loadingProvider !== null}
      >
        <Text style={styles.guestText}>
          Continuar como <Text style={styles.guestLink}>visitante</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  logoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  logoIconText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  logoText: { fontSize: 20, fontWeight: '600', color: colors.gray900 },
  title: { fontSize: 30, fontWeight: '600', color: colors.gray900, lineHeight: 36, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.gray400, marginBottom: 32 },
  form: { gap: 6, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '500', color: colors.gray600, marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.gray800, backgroundColor: colors.white },
  forgotPassword: { color: colors.green, fontSize: 13, textAlign: 'right', marginTop: 8, marginBottom: 16 },
  btnPrimary: { backgroundColor: colors.gray900, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  btnPrimaryText: { color: colors.white, fontSize: 16, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.gray100 },
  dividerText: { fontSize: 13, color: colors.gray400 },
  btnSocial: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 10, paddingVertical: 14, marginBottom: 10 },
  btnSocialText: { fontSize: 14, fontWeight: '500', color: colors.gray700 },
  guestRow: { alignItems: 'center', marginTop: 16 },
  guestText: { fontSize: 14, color: colors.gray400 },
  guestLink: { color: colors.green, fontWeight: '500' },
  disabled: { opacity: 0.65 },
});
