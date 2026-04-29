import { Tabs, router } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.gray400,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="camera-tab"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: () => (
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={() => router.push('/camera')}
              activeOpacity={0.85}
            >
              <View style={styles.cameraBtnInner}>
                <Ionicons name="camera" size={22} color={colors.white} />
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="goals"
        options={{
          title: 'Metas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'radio-button-on' : 'radio-button-off'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.gray100,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  cameraBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
