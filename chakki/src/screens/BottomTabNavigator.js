import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from './HomeScreen';
import ProductRegistrationScreen from './ProductRegistrationScreen';
import SettingsScreen from './SettingsScreen';
import { colors, spacing, radii, shadows, layout } from './theme';

const Tab = createBottomTabNavigator();

// Maps each existing route to its icon. Routes/names are unchanged.
const ICONS = {
  Home: 'home',
  ProductRegister: 'camera',
  Settings: 'settings',
};

/**
 * Custom, brand-consistent bottom navigation (System A).
 * Presentation only — tap handling replicates React Navigation's default
 * behavior exactly (tabPress event + guarded navigate), so routing,
 * focus state and long-press events all work as before.
 */
function BrandTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.sm },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;
        const iconName = ICONS[route.name] || 'circle';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        const tint = isFocused ? colors.primary : colors.iconMuted;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            style={styles.item}
            android_ripple={{ color: colors.primarySubtle, borderless: true, radius: 40 }}
          >
            <View style={[styles.iconChip, isFocused && styles.iconChipActive]}>
              <Feather name={iconName} size={22} color={tint} />
            </View>
            <Text
              numberOfLines={1}
              style={[styles.label, { color: tint }, isFocused && styles.labelActive]}
            >
              {typeof label === 'string' ? label : route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function BottomNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BrandTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="ProductRegister" component={ProductRegistrationScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    // soft upward elevation so the bar reads as a floating surface
    shadowColor: shadows.card.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 12,
  },
  item: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  iconChip: {
    width: 56,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconChipActive: {
    backgroundColor: colors.primaryTint,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  labelActive: {
    fontWeight: '800',
  },
});