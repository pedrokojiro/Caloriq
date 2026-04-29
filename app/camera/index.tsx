import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/colors';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    ImagePicker.requestMediaLibraryPermissionsAsync();
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="camera-outline" size={60} color="rgba(255,255,255,0.4)" />
        <Text style={styles.permTitle}>Acesso à câmera necessário</Text>
        <Text style={styles.permSub}>
          O CaloriQ precisa da câmera para fotografar seus pratos e analisar as calorias.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Permitir acesso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permBack} onPress={() => router.back()}>
          <Text style={styles.permBackText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleTakePhoto() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      router.push({
        pathname: '/camera/analyzing',
        params: { imageUri: photo?.uri ?? '' },
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível tirar a foto. Tente novamente.');
    }
  }

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      router.push({
        pathname: '/camera/analyzing',
        params: { imageUri: result.assets[0].uri },
      });
    }
  }

  function handleFlip() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

      <View style={styles.tip}>
        <Text style={styles.tipText}>Centralize o prato e evite sombras</Text>
      </View>

      <View style={styles.circle} pointerEvents="none" />
      <Text style={styles.hint}>Aproxime até o prato preencher o círculo</Text>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.auxBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shutter} onPress={handleTakePhoto} activeOpacity={0.75} />

        <TouchableOpacity style={styles.auxBtn} onPress={handlePickImage}>
          <Ionicons name="image-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.flipBtn} onPress={handleFlip}>
        <Ionicons name="camera-reverse-outline" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  permTitle: { fontSize: 20, fontWeight: '600', color: colors.white, textAlign: 'center', marginTop: 16, marginBottom: 8 },
  permSub: { fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  permBtn: { backgroundColor: colors.green, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12 },
  permBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  permBack: { paddingVertical: 10 },
  permBackText: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
  tip: { position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center' },
  tipText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden' },
  circle: { position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -140, width: 280, height: 280, borderRadius: 140, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  hint: { position: 'absolute', bottom: 130, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  controls: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.75)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40, paddingVertical: 20, paddingBottom: 44 },
  auxBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.white, borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)' },
  flipBtn: { position: 'absolute', top: 76, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
});
