import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6bd8cb',
        tabBarInactiveTintColor: '#3d4947',
        headerShown: false,
        tabBarStyle: { display: 'none' },
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconType="community" name="console" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          title: 'Circles',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconType="material" name="timer" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconType="material" name="leaderboard" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconType="material" name="settings" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconType="community" name="hub" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  iconType,
  name,
  color,
  focused,
}: {
  iconType: 'material' | 'community';
  name: string;
  color: string;
  focused: boolean;
}) {
  const iconSize = 24;

  if (focused) {
    return (
      <View style={styles.activeIconPill}>
        {iconType === 'community' ? (
          <MaterialCommunityIcons name={name as any} size={iconSize} color="#6bd8cb" />
        ) : (
          <MaterialIcons name={name as any} size={iconSize} color="#6bd8cb" />
        )}
      </View>
    );
  }

  return (
    <View style={styles.inactiveIconWrap}>
      {iconType === 'community' ? (
        <MaterialCommunityIcons name={name as any} size={iconSize} color="#3d4947" />
      ) : (
        <MaterialIcons name={name as any} size={iconSize} color="#3d4947" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0c1322',
    borderTopWidth: 0,
    height: 84,
    paddingTop: 10,
    paddingBottom: 20,
    elevation: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    position: 'absolute',
    // Neumorphic shadow (upward)
    boxShadow: [
      { offsetX: -4, offsetY: -4, blurRadius: 12, color: 'rgba(27,37,55,0.5)' },
      { offsetX: 4, offsetY: 4, blurRadius: 12, color: '#080c14' },
    ],
  },
  activeIconPill: {
    backgroundColor: '#141b2b',
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // Neumorphic inset shadow
    boxShadow: [
      { offsetX: 4, offsetY: 4, blurRadius: 8, color: '#080c14', inset: true },
      { offsetX: -4, offsetY: -4, blurRadius: 8, color: 'rgba(27,37,55,0.5)', inset: true },
    ],
  },
  inactiveIconWrap: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
