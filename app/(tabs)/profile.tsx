import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Switch, Alert, TextInput,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { UserProfile } from '../../lib/types';
import { getMeals, getProfile, saveProfile } from '../../lib/storage';
import { defaultProfile } from '../../lib/defaults';

type ProfileForm = {
  name: string;
  email: string;
  age: string;
  weightKg: string;
  targetWeightKg: string;
  heightCm: string;
  objective: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [form, setForm] = useState<ProfileForm>(profileToForm(defaultProfile));
  const [mealCount, setMealCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'privacy' | 'support' | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadData() {
        const [storedProfile, meals] = await Promise.all([getProfile(), getMeals()]);
        if (!mounted) return;
        setProfile(storedProfile);
        setForm(profileToForm(storedProfile));
        setMealCount(meals.length);
      }

      loadData();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const firstName = profile.name.split(' ')[0] || 'M';
  const lostWeight = Math.max(profile.weightKg - profile.targetWeightKg, 0).toFixed(1).replace('.', ',');

  function updateForm(key: keyof ProfileForm, value: string) {
    const numericFields: Array<keyof ProfileForm> = ['age', 'weightKg', 'targetWeightKg', 'heightCm'];
    setForm(current => ({
      ...current,
      [key]: numericFields.includes(key) ? value.replace(/[^0-9]/g, '') : value,
    }));
  }

  async function handleSave() {
    const nextProfile = formToProfile(form, profile);
    if (!nextProfile.name.trim()) {
      Alert.alert('Nome obrigatório', 'Informe um nome para o perfil.');
      return;
    }

    try {
      setSaving(true);
      await saveProfile(nextProfile);
      setProfile(nextProfile);
      setEditing(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o perfil.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleNotifications(value: boolean) {
    const nextProfile = { ...profile, notifications: value };
    setProfile(nextProfile);
    await saveProfile(nextProfile);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={12} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileSub}>Membro desde {profile.memberSince}</Text>
        </View>

        <View style={styles.statsRow}>
          <Stat value={String(mealCount)} label="refeições" />
          <Stat value={profile.notifications ? 'on' : 'off'} label="lembretes" bordered />
          <Stat value={`-${lostWeight}`} label="kg meta" />
        </View>

        <View style={styles.body}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dados pessoais</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(value => !value)}>
              <Ionicons name={editing ? 'close' : 'create-outline'} size={18} color={colors.green} />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            {editing ? (
              <>
                <Field label="Nome" value={form.name} onChangeText={value => updateForm('name', value)} />
                <Field label="E-mail" value={form.email} onChangeText={value => updateForm('email', value)} keyboardType="email-address" />
                <Field label="Idade" value={form.age} onChangeText={value => updateForm('age', value)} keyboardType="number-pad" suffix="anos" />
                <Field label="Peso atual" value={form.weightKg} onChangeText={value => updateForm('weightKg', value)} keyboardType="number-pad" suffix="kg" />
                <Field label="Peso meta" value={form.targetWeightKg} onChangeText={value => updateForm('targetWeightKg', value)} keyboardType="number-pad" suffix="kg" />
                <Field label="Altura" value={form.heightCm} onChangeText={value => updateForm('heightCm', value)} keyboardType="number-pad" suffix="cm" />
                <Field label="Objetivo" value={form.objective} onChangeText={value => updateForm('objective', value)} />
              </>
            ) : (
              <>
                <MenuRow icon="person-outline" label="Nome" value={profile.name} />
                <MenuRow icon="mail-outline" label="E-mail" value={profile.email} />
                <MenuRow icon="calendar-outline" label="Idade" value={`${profile.age} anos`} />
                <MenuRow icon="body-outline" label="Objetivo" value={profile.objective} last />
              </>
            )}
          </View>

          {editing && (
            <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar perfil'}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Preferências</Text>
          <View style={styles.sectionCard}>
            <View style={[styles.menuRow, styles.menuRowBorder]}>
              <View style={styles.menuIcon}>
                <Ionicons name="notifications-outline" size={18} color={colors.gray600} />
              </View>
              <Text style={styles.menuLabel}>Notificações</Text>
              <Switch
                value={profile.notifications}
                onValueChange={toggleNotifications}
                trackColor={{ false: colors.gray200, true: colors.green }}
                thumbColor={colors.white}
              />
            </View>
            <MenuRow icon="language-outline" label="Idioma" value={profile.language} />
            <MenuRow icon="color-palette-outline" label="Tema" value={profile.theme} last />
          </View>

          <Text style={styles.sectionTitle}>Conta</Text>
          <View style={styles.sectionCard}>
            <MenuRow
              icon="shield-checkmark-outline"
              label="Privacidade"
              value={expandedSection === 'privacy' ? 'Aberto' : undefined}
              onPress={() => setExpandedSection(current => current === 'privacy' ? null : 'privacy')}
            />
            <MenuRow
              icon="help-circle-outline"
              label="Ajuda e suporte"
              value={expandedSection === 'support' ? 'Aberto' : undefined}
              onPress={() => setExpandedSection(current => current === 'support' ? null : 'support')}
            />
            <MenuRow icon="log-out-outline" label="Sair" danger onPress={() => router.replace('/login')} last />
          </View>

          {expandedSection === 'privacy' && (
            <InfoPanel
              icon="shield-checkmark"
              title="Privacidade"
              items={[
                'Suas refeições, metas e perfil ficam salvos apenas neste dispositivo.',
                'As imagens são usadas somente para gerar a análise local simulada deste MVP.',
                'Ao sair, você volta para o login; os dados locais continuam disponíveis para o próximo acesso.',
              ]}
            />
          )}

          {expandedSection === 'support' && (
            <InfoPanel
              icon="help-circle"
              title="Ajuda e suporte"
              items={[
                'Para registrar uma refeição, use a câmera ou a galeria na tela Início.',
                'Para remover uma análise, abra o Histórico ou o detalhe salvo e toque em Excluir análise.',
                'Para alterar dados corporais e objetivo, toque no lápis em Dados pessoais.',
              ]}
            />
          )}

          <Text style={styles.version}>CaloriQ v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label, bordered }: { value: string; label: string; bordered?: boolean }) {
  return (
    <View style={[styles.statItem, bordered && styles.statBorder]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Field({ label, value, suffix, keyboardType, onChangeText }: {
  label: string;
  value: string;
  suffix?: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          style={styles.input}
          placeholderTextColor={colors.gray300}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function MenuRow({ icon, label, value, danger, onPress, last }: {
  icon: string;
  label: string;
  value?: string;
  danger?: boolean;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, !last && styles.menuRowBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon as any} size={18} color={danger ? '#ef4444' : colors.gray600} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <View style={styles.menuRight}>
        {value ? <Text style={styles.menuValue} numberOfLines={1}>{value}</Text> : null}
        {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.gray300} /> : null}
      </View>
    </TouchableOpacity>
  );
}

function InfoPanel({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  return (
    <View style={styles.infoPanel}>
      <View style={styles.infoHeader}>
        <View style={styles.infoIcon}>
          <Ionicons name={icon as any} size={18} color={colors.green} />
        </View>
        <Text style={styles.infoTitle}>{title}</Text>
      </View>
      {items.map(item => (
        <View key={item} style={styles.infoItem}>
          <View style={styles.infoDot} />
          <Text style={styles.infoText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function profileToForm(profile: UserProfile): ProfileForm {
  return {
    name: profile.name,
    email: profile.email,
    age: String(profile.age),
    weightKg: String(profile.weightKg),
    targetWeightKg: String(profile.targetWeightKg),
    heightCm: String(profile.heightCm),
    objective: profile.objective,
  };
}

function formToProfile(form: ProfileForm, current: UserProfile): UserProfile {
  return {
    ...current,
    name: form.name.trim(),
    email: form.email.trim(),
    age: Number(form.age) || current.age,
    weightKg: Number(form.weightKg) || current.weightKg,
    targetWeightKg: Number(form.targetWeightKg) || current.targetWeightKg,
    heightCm: Number(form.heightCm) || current.heightCm,
    objective: form.objective.trim() || current.objective,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  profileHeader: { backgroundColor: colors.white, alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.white },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.gray700, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  profileName: { fontSize: 20, fontWeight: '700', color: colors.gray900 },
  profileSub: { fontSize: 13, color: colors.gray400, marginTop: 2 },
  statsRow: { flexDirection: 'row', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray100, paddingVertical: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderRightWidth: 1, borderRightColor: colors.gray100, borderLeftWidth: 1, borderLeftColor: colors.gray100 },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.gray900 },
  statLabel: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  body: { padding: 16, gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.gray400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginLeft: 4 },
  editBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  sectionCard: { backgroundColor: colors.white, borderRadius: 14, overflow: 'hidden' },
  field: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  fieldLabel: { fontSize: 12, color: colors.gray500, marginBottom: 6 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.gray900 },
  suffix: { fontSize: 12, color: colors.gray500 },
  saveBtn: { backgroundColor: colors.gray900, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.65 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  menuIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  menuIconDanger: { backgroundColor: '#fef2f2' },
  menuLabel: { flex: 1, fontSize: 14, color: colors.gray800 },
  menuLabelDanger: { color: '#ef4444' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 180 },
  menuValue: { fontSize: 13, color: colors.gray400 },
  infoPanel: { backgroundColor: colors.white, borderRadius: 14, padding: 16, gap: 12 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 15, fontWeight: '700', color: colors.gray900 },
  infoItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  infoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green, marginTop: 6 },
  infoText: { flex: 1, fontSize: 13, color: colors.gray600, lineHeight: 18 },
  version: { textAlign: 'center', fontSize: 12, color: colors.gray300, paddingBottom: 8 },
});
