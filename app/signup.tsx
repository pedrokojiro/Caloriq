import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

type AuthProvider = 'Google' | 'Apple';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | 'email' | null>(null);

  function enterApp() {
    router.replace('/(tabs)');
  }

  function handleCreateAccount() {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos para criar sua conta.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Senha curta', 'Use uma senha com pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Senhas diferentes', 'Confirme a senha digitada para continuar.');
      return;
    }

    setLoadingProvider('email');
    setTimeout(enterApp, 450);
  }

  function handleSocialSignup(provider: AuthProvider) {
    setLoadingProvider(provider);
    setTimeout(enterApp, 450);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/login')}>
        <Ionicons name="chevron-back" size={20} color={colors.gray900} />
      </TouchableOpacity>

      <View style={styles.logoRow}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoIconText}>Q</Text>
        </View>
        <Text style={styles.logoText}>CaloriQ</Text>
      </View>

      <Text style={styles.title}>Crie sua conta</Text>
      <Text style={styles.subtitle}>Configure seu acompanhamento nutricional</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu nome"
          placeholderTextColor={colors.gray300}
          value={name}
          onChangeText={setName}
        />

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

        <Text style={styles.label}>Confirmar senha</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.gray300}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      <TouchableOpacity
        style={[styles.btnPrimary, loadingProvider === 'email' && styles.disabled]}
        onPress={handleCreateAccount}
        activeOpacity={0.85}
        disabled={loadingProvider !== null}
      >
        <Text style={styles.btnPrimaryText}>
          {loadingProvider === 'email' ? 'Criando conta...' : 'Criar conta'}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou cadastre-se com</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.btnSocial, loadingProvider === 'Google' && styles.disabled]}
        onPress={() => handleSocialSignup('Google')}
        disabled={loadingProvider !== null}
        activeOpacity={0.85}
      >
        <Ionicons name="logo-google" size={18} color="#4285f4" />
        <Text style={styles.btnSocialText}>
          {loadingProvider === 'Google' ? 'Conectando...' : 'Cadastrar com Google'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btnSocial, loadingProvider === 'Apple' && styles.disabled]}
        onPress={() => handleSocialSignup('Apple')}
        disabled={loadingProvider !== null}
        activeOpacity={0.85}
      >
        <Ionicons name="logo-apple" size={20} color={colors.gray900} />
        <Text style={styles.btnSocialText}>
          {loadingProvider === 'Apple' ? 'Conectando...' : 'Cadastrar com Apple'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginRow} onPress={() => router.replace('/login')}>
        <Text style={styles.loginText}>
          Já tem conta? <Text style={styles.loginLink}>Entrar</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 24, paddingTop: 48, paddingBottom: 40 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  logoIconText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  logoText: { fontSize: 20, fontWeight: '600', color: colors.gray900 },
  title: { fontSize: 30, fontWeight: '600', color: colors.gray900, lineHeight: 36, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.gray400, marginBottom: 28 },
  form: { gap: 6, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '500', color: colors.gray600, marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.gray800, backgroundColor: colors.white },
  btnPrimary: { backgroundColor: colors.gray900, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  btnPrimaryText: { color: colors.white, fontSize: 16, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.gray100 },
  dividerText: { fontSize: 13, color: colors.gray400 },
  btnSocial: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 10, paddingVertical: 14, marginBottom: 10 },
  btnSocialText: { fontSize: 14, fontWeight: '500', color: colors.gray700 },
  loginRow: { alignItems: 'center', marginTop: 16 },
  loginText: { fontSize: 14, color: colors.gray400 },
  loginLink: { color: colors.green, fontWeight: '500' },
  disabled: { opacity: 0.65 },
});
