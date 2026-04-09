import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Fonts } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0D9488',
        tabBarInactiveTintColor: '#4B5563',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" label="Home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          title: 'Circles',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="groups" label="Circles" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="map" label="Map" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" label="Profile" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  name,
  label,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      <MaterialIcons name={name} size={24} color={color} />
      {focused && <Text style={styles.activeLabel}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0D1117',
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
    height: 68,
    paddingTop: 8,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  activeLabel: {
    marginTop: 2,
    color: '#0D9488',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Fonts.secondary,
  },
});
