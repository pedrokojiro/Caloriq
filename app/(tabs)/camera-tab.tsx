import { View, Text } from 'react-native';
import { colors } from '../../constants/colors';

const config: Record<string, {emoji: string, label: string}> = {
  history: { emoji: '📋', label: 'Histórico' },
  goals:   { emoji: '🎯', label: 'Metas' },
  profile: { emoji: '👤', label: 'Perfil' },
  'camera-tab': { emoji: '📷', label: '' },
};

export default function Screen() {
  const name = 'camera-tab';
  const info = config[name] || { emoji: '🔧', label: name };
  return (
    <View style={{ flex: 1, backgroundColor: colors.gray50, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 48 }}>{info.emoji}</Text>
      <Text style={{ fontSize: 22, fontWeight: '600', color: colors.gray900 }}>{info.label}</Text>
      <Text style={{ fontSize: 14, color: colors.gray400 }}>Em desenvolvimento</Text>
    </View>
  );
}
