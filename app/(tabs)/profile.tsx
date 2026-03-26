// app/(tabs)/profile.tsx — Tela Perfil
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Switch, Alert,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../constants/colors';

const STATS = [
  { value: '128', label: 'dias de uso' },
  { value: '7',   label: 'sequência' },
  { value: '-2,4', label: 'kg perdidos' },
];

type MenuItem = {
  icon: string;
  label: string;
  sublabel?: string;
  value?: string;
  isSwitch?: boolean;
  danger?: boolean;
  onPress?: () => void;
};

export default function ProfileScreen() {
  const [notifications, setNotifications] = useState(true);

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Dados pessoais',
      items: [
        { icon: 'person-outline',   label: 'Nome',          value: 'Mariana Silva' },
        { icon: 'mail-outline',     label: 'E-mail',        value: 'mariana@email.com' },
        { icon: 'calendar-outline', label: 'Idade',         value: '28 anos' },
        { icon: 'body-outline',     label: 'Objetivo',      value: 'Perda de peso' },
      ],
    },
    {
      title: 'Preferências',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Notificações',
          isSwitch: true,
        },
        { icon: 'language-outline',   label: 'Idioma',   value: 'Português' },
        { icon: 'color-palette-outline', label: 'Tema', value: 'Claro' },
      ],
    },
    {
      title: 'Conta',
      items: [
        {
          icon: 'shield-checkmark-outline',
          label: 'Privacidade',
          onPress: () => Alert.alert('Privacidade', 'Em breve!'),
        },
        {
          icon: 'help-circle-outline',
          label: 'Ajuda e suporte',
          onPress: () => Alert.alert('Suporte', 'Em breve!'),
        },
        {
          icon: 'log-out-outline',
          label: 'Sair',
          danger: true,
          onPress: () => router.replace('/'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header com avatar */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>M</Text>
            </View>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={12} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>Mariana Silva</Text>
          <Text style={styles.profileSub}>Membro desde jan. 2024</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <View key={i} style={[styles.statItem, i < STATS.length - 1 && styles.statBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.body}>

          {/* Sections */}
          {sections.map((section, si) => (
            <View key={si}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionCard}>
                {section.items.map((item, ii) => (
                  <TouchableOpacity
                    key={ii}
                    style={[styles.menuRow, ii < section.items.length - 1 && styles.menuRowBorder]}
                    onPress={item.onPress}
                    activeOpacity={item.onPress ? 0.7 : 1}
                  >
                    <View style={[styles.menuIcon, item.danger && styles.menuIconDanger]}>
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={item.danger ? '#ef4444' : colors.gray600}
                      />
                    </View>
                    <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                      {item.label}
                    </Text>
                    <View style={styles.menuRight}>
                      {item.isSwitch ? (
                        <Switch
                          value={notifications}
                          onValueChange={setNotifications}
                          trackColor={{ false: colors.gray200, true: colors.green }}
                          thumbColor={colors.white}
                        />
                      ) : item.value ? (
                        <Text style={styles.menuValue}>{item.value}</Text>
                      ) : null}
                      {!item.isSwitch && (
                        <Ionicons name="chevron-forward" size={16} color={colors.gray300} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Versão */}
          <Text style={styles.version}>CaloriQ v1.0.0</Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.gray50 },

  // Profile header
  profileHeader:    { backgroundColor: colors.white, alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  avatarWrapper:    { position: 'relative', marginBottom: 12 },
  avatar:           { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  avatarText:       { fontSize: 32, fontWeight: '700', color: colors.white },
  editAvatarBtn:    { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.gray700, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  profileName:      { fontSize: 20, fontWeight: '700', color: colors.gray900 },
  profileSub:       { fontSize: 13, color: colors.gray400, marginTop: 2 },

  // Stats row
  statsRow:         { flexDirection: 'row', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray100, paddingVertical: 16 },
  statItem:         { flex: 1, alignItems: 'center' },
  statBorder:       { borderRightWidth: 1, borderRightColor: colors.gray100 },
  statValue:        { fontSize: 20, fontWeight: '700', color: colors.gray900 },
  statLabel:        { fontSize: 11, color: colors.gray400, marginTop: 2 },

  // Body
  body:             { padding: 16, gap: 14 },
  sectionTitle:     { fontSize: 13, fontWeight: '600', color: colors.gray400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginLeft: 4 },

  // Section card
  sectionCard:      { backgroundColor: colors.white, borderRadius: 14, overflow: 'hidden' },
  menuRow:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  menuRowBorder:    { borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  menuIcon:         { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  menuIconDanger:   { backgroundColor: '#fef2f2' },
  menuLabel:        { flex: 1, fontSize: 14, color: colors.gray800 },
  menuLabelDanger:  { color: '#ef4444' },
  menuRight:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuValue:        { fontSize: 13, color: colors.gray400 },

  // Version
  version:          { textAlign: 'center', fontSize: 12, color: colors.gray300, paddingBottom: 8 },
});
