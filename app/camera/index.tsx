// app/camera/index.tsx — Tela de câmera
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

export default function CameraScreen() {
  return (
    <View style={styles.container}>
      {/* Tip */}
      <View style={styles.tip}>
        <Text style={styles.tipText}>Centralize o prato e evite sombras</Text>
      </View>

      {/* Guia circular */}
      <View style={styles.circle}>
        <Text style={{ fontSize: 80 }}>🍽️</Text>
      </View>

      <Text style={styles.hint}>Aproxime até o prato preencher o círculo</Text>

      {/* Controles */}
      <View style={styles.controls}>
        {/* Fechar */}
        <TouchableOpacity style={styles.auxBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={colors.white} />
        </TouchableOpacity>

        {/* Shutter */}
        <TouchableOpacity
          style={styles.shutter}
          onPress={() => router.push('/camera/analyzing')}
          activeOpacity={0.85}
        />

        {/* Galeria */}
        <TouchableOpacity
          style={styles.auxBtn}
          onPress={() => router.push('/camera/analyzing')}
        >
          <Ionicons name="image-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cameraBg, alignItems: 'center', justifyContent: 'center' },
  tip:       { position: 'absolute', top: 80, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tipText:   { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  circle:    { width: 280, height: 280, borderRadius: 140, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(22,163,74,0.1)' },
  hint:      { position: 'absolute', bottom: 130, color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  controls:  { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.gray900, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40, paddingVertical: 20, paddingBottom: 40 },
  auxBtn:    { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  shutter:   { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.white, borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)' },
});
