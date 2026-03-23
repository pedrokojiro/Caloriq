// app/index.tsx
// Tela de Login / Cadastro — primeira tela do app

import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../constants/colors';

export default function LoginScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoIconText}>Q</Text>
        </View>
        <Text style={styles.logoText}>CaloriQ</Text>
      </View>

      {/* Título */}
      <Text style={styles.title}>Boas-vindas{'\n'}de volta 👋</Text>
      <Text style={styles.subtitle}>Controle sua dieta com inteligência</Text>

      {/* Campos */}
      <View style={styles.form}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor={colors.gray300}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.gray300}
          secureTextEntry
        />

        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Esqueci a senha</Text>
        </TouchableOpacity>
      </View>

      {/* Botão entrar */}
      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => router.replace('/(tabs)')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnPrimaryText}>Entrar</Text>
      </TouchableOpacity>

      {/* Divisor */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou entre com</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social buttons */}
      <TouchableOpacity style={styles.btnSocial}>
        <Text style={[styles.btnSocialIcon, { color: '#4285f4' }]}>G</Text>
        <Text style={styles.btnSocialText}>Continuar com Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnSocial}>
        <Text style={[styles.btnSocialIcon, { color: colors.gray900 }]}>A</Text>
        <Text style={styles.btnSocialText}>Continuar com Apple</Text>
      </TouchableOpacity>

      {/* Pular login */}
      <TouchableOpacity
        style={styles.guestRow}
        onPress={() => router.replace('/(tabs)')}
      >
        <Text style={styles.guestText}>
          Continuar como{' '}
          <Text style={styles.guestLink}>visitante</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray900,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: colors.gray900,
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray400,
    marginBottom: 32,
  },
  form: {
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray600,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.gray800,
    backgroundColor: colors.white,
  },
  forgotPassword: {
    color: colors.green,
    fontSize: 13,
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 16,
  },
  btnPrimary: {
    backgroundColor: colors.gray900,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray100,
  },
  dividerText: {
    fontSize: 13,
    color: colors.gray400,
  },
  btnSocial: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 10,
  },
  btnSocialIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  btnSocialText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
  },
  guestRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  guestText: {
    fontSize: 14,
    color: colors.gray400,
  },
  guestLink: {
    color: colors.green,
    fontWeight: '500',
  },
});
