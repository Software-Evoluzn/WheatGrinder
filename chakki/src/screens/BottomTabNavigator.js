import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from './HomeScreen';
import ProductRegistrationScreen from './ProductRegistrationScreen';
import SettingsScreen from './SettingsScreen';
import { useAppTheme } from '../services/theme';

const Tab = createBottomTabNavigator();

export default function BottomNavigator() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.subText,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 4, // Text aur bottom edge ke beech perfect space
        },
        tabBarItemStyle: {
          paddingVertical: 4, // Icons aur text ko vertically centered rakhta hai
        },
        tabBarStyle: {
          height: 60 + (insets.bottom > 0 ? insets.bottom : 6),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 4,
          backgroundColor: colors.card,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 8,
        },
        tabBarIcon: ({ color, focused }) => {
          let icon = 'circle';
          if (route.name === 'Home') icon = 'home';
          if (route.name === 'ProductRegister') icon = 'camera';
          if (route.name === 'Settings') icon = 'settings';

          return (
            <Feather
              name={icon}
              size={focused ? 22 : 20}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="ProductRegister" component={ProductRegistrationScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}