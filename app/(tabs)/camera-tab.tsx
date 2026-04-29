import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../constants/colors';

export default function CameraTabScreen() {
  useEffect(() => {
    router.replace('/camera');
  }, []);

  return <View style={{ flex: 1, backgroundColor: colors.gray50 }} />;
}
