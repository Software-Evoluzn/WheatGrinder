import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Pressable, Animated, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { colors, spacing, radii, typography, shadows, zIndex } from '../screens/theme';

const SLOT_SIZE = 40;
const DROPDOWN_WIDTH = 200;

const AppHeader = ({ title, eyebrow, onBack, logoPosition = 'none', rightIcon, onRightPress, menuItems }) => {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const hasMenu = Array.isArray(menuItems) && menuItems.length > 0;
  const effectiveRightIcon = rightIcon || (hasMenu ? 'more-vertical' : undefined);

  const showLogoLeft = logoPosition === 'left' && !onBack;
  const showLogoRight = logoPosition === 'right' && !effectiveRightIcon;

  const handleRightPress = () => {
    if (hasMenu) {
      setMenuOpen((open) => !open);
    } else {
      onRightPress?.();
    }
  };

  const handleSelectItem = (item) => {
    setMenuOpen(false);
    item.onPress?.();
  };

  return (
    <>
      <View style={[headerStyles.container, { paddingTop: insets.top + spacing.sm }]}>
        <View style={headerStyles.row}>
          <View style={headerStyles.leftSlot}>
            {onBack ? (
              <TouchableOpacity style={headerStyles.roundButton} activeOpacity={0.8} onPress={onBack}>
                <Feather name="arrow-left" size={18} color={colors.primary} />
              </TouchableOpacity>
            ) : showLogoLeft ? (
              <Image
                source={require('./assets/images/Softel Millet mill logo 2.png')}
                style={headerStyles.logoSmall}
                resizeMode="contain"
              />
            ) : null}
          </View>

          <View style={headerStyles.titleBlock}>
            {eyebrow ? (
              <Text style={headerStyles.eyebrow} numberOfLines={1}>
                {eyebrow}
              </Text>
            ) : null}
            <Text style={headerStyles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>

          <View style={headerStyles.rightSlot}>
            {effectiveRightIcon ? (
              <TouchableOpacity style={headerStyles.roundButton} activeOpacity={0.8} onPress={handleRightPress}>
                <Feather name={effectiveRightIcon} size={18} color={colors.primary} />
              </TouchableOpacity>
            ) : showLogoRight ? (
              <Image
                source={require('./assets/images/Softel Millet mill logo 2.png')}
                style={headerStyles.logoSmall}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </View>

      {hasMenu && menuOpen ? (
        <>
          <Pressable style={headerStyles.dismissLayer} onPress={() => setMenuOpen(false)} />
          <View style={[headerStyles.dropdown, { top: insets.top + spacing.sm + SLOT_SIZE + spacing.md }]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[headerStyles.dropdownRow, index < menuItems.length - 1 && headerStyles.dropdownRowDivider]}
                activeOpacity={0.75}
                onPress={() => handleSelectItem(item)}
              >
                {item.icon ? (
                  <Feather name={item.icon} size={16} color={colors.primary} style={headerStyles.dropdownIcon} />
                ) : null}
                <Text style={headerStyles.dropdownLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}
    </>
  );
};

const headerStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    ...shadows.header,
    zIndex: zIndex.header,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  leftSlot: { width: SLOT_SIZE, alignItems: 'flex-start', justifyContent: 'center' },
  rightSlot: { width: SLOT_SIZE, alignItems: 'flex-end', justifyContent: 'center' },
  roundButton: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: SLOT_SIZE / 2,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSmall: { width: 52, height: 30 },
  titleBlock: { flex: 1, alignItems: 'center' },
  eyebrow: { ...typography.eyebrow, color: colors.primary, marginBottom: 2 },
  title: { ...typography.title, color: colors.textPrimary, textAlign: 'center' },
  dismissLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: zIndex.overlay },
  dropdown: {
    position: 'absolute',
    right: spacing.lg,
    width: DROPDOWN_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    zIndex: zIndex.modal,
    ...shadows.card,
  },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  dropdownRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  dropdownIcon: { marginRight: spacing.sm },
  dropdownLabel: { ...typography.body, color: colors.textPrimary },
});

/* ------------------------------------------------------------------ */
/* AppCard (copy of components/AppCard.jsx)                            */
/* ------------------------------------------------------------------ */
const AppCard = ({ children, style, padded = true }) => (
  <View style={[cardStyles.card, padded && cardStyles.padded, style]}>{children}</View>
);

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  padded: { padding: spacing.xxl },
});

/* ------------------------------------------------------------------ */
/* PrimaryButton (copy of components/PrimaryButton.jsx)                */
/* ------------------------------------------------------------------ */
const VARIANTS = {
  primary: { bg: colors.primary, text: '#FFFFFF', border: null },
  secondary: { bg: colors.surface, text: colors.textPrimary, border: colors.borderStrong },
  success: { bg: colors.success, text: '#FFFFFF', border: null },
  danger: { bg: colors.danger, text: '#FFFFFF', border: null },
};



const PrimaryButton = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  fullWidth = true,
  disabled = false,
  loading = false,
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const v = VARIANTS[variant] || VARIANTS.primary;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  return (
    <Animated.View style={[fullWidth && buttonStyles.fullWidth, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        style={[
          buttonStyles.button,
          { backgroundColor: v.bg, borderColor: v.border || 'transparent', borderWidth: v.border ? 1.5 : 0 },
          variant === 'primary' && shadows.button,
          disabled && buttonStyles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.text} />
        ) : (
          <View style={buttonStyles.content}>
            {icon && iconPosition === 'left' ? (
              <Feather name={icon} size={16} color={v.text} style={buttonStyles.iconLeft} />
            ) : null}
            <Text style={[buttonStyles.text, { color: v.text }]}>{title}</Text>
            {icon && iconPosition === 'right' ? (
              <Feather name={icon} size={16} color={v.text} style={buttonStyles.iconRight} />
            ) : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const buttonStyles = StyleSheet.create({
  fullWidth: { width: '100%' },
  button: {
    borderRadius: radii.pill,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 15, fontWeight: '800', letterSpacing: 0.8 },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
});

/* ------------------------------------------------------------------ */
/* BottomNavigation (copy of components/BottomNavigation.jsx)          */
/* ------------------------------------------------------------------ */
const BottomNavigation = ({ tabs, activeKey, onChange }) => {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const translateX = React.useRef(new Animated.Value(0)).current;

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.key === activeKey));
  const segmentWidth = tabs.length > 0 ? barWidth / tabs.length : 0;

  React.useEffect(() => {
    if (!barWidth) return;
    Animated.spring(translateX, {
      toValue: activeIndex * segmentWidth,
      useNativeDriver: true,
      friction: 9,
      tension: 90,
    }).start();
  }, [activeIndex, segmentWidth, barWidth, translateX]);

  return (
    <View style={[navStyles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={navStyles.bar} onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
        {barWidth > 0 && segmentWidth > 0 && (
          <Animated.View
            style={[navStyles.activePill, { width: segmentWidth - spacing.sm, transform: [{ translateX }] }]}
          />
        )}

        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <TouchableOpacity key={tab.key} style={navStyles.tab} activeOpacity={0.75} onPress={() => onChange?.(tab.key)}>
              <Feather name={tab.icon} size={20} color={isActive ? colors.primary : colors.textMuted} />
              <Text style={[navStyles.label, isActive && navStyles.labelActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        
      </View>
      
    </View>
  );
};

export const APP_TABS = [
  { key: 'Home', label: 'Home', icon: 'home' },
  { key: 'ProductRegister', label: 'Add Product', icon: 'camera' },
  { key: 'Settings', label: 'Settings', icon: 'settings' },
];
 

const navStyles = StyleSheet.create({
  wrapper: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm / 2,
    ...shadows.floatingNav,
  },
  activePill: {
    position: 'absolute',
    top: spacing.sm,
    bottom: spacing.sm,
    left: spacing.sm / 2,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.lg,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, gap: 4 },
  label: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  labelActive: { color: colors.primary, fontWeight: '800' },
});

const REAL_TABS = [
  { key: 'Home', label: 'Home', icon: 'home' },
  { key: 'ProductRegister', label: 'Add Product', icon: 'camera' },
  { key: 'Settings', label: 'Settings', icon: 'settings' },
];

/* ------------------------------------------------------------------ */
/* The actual showcase screen                                          */
/* ------------------------------------------------------------------ */
const ComponentShowcaseScreen = () => {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <SafeAreaView style={screenStyles.safe} edges={['left', 'right', 'bottom']}>
      <AppHeader
        title="Grinder Setup"
        eyebrow="STEP 2 OF 4"
        onBack={() => {}}
        menuItems={[
          { label: 'Duplicate', icon: 'copy', onPress: () => {} },
          { label: 'Delete', icon: 'trash-2', onPress: () => {} },
        ]}
      />

      <ScrollView contentContainerStyle={screenStyles.content}>
        <AppCard style={screenStyles.cardSpacing}>
          <Text style={screenStyles.cardTitle}>AppCard</Text>
          <Text style={screenStyles.cardBody}>
            A consistent surface for grouped content — shared radius, subtle border, soft shadow instead of a
            different one-off style per screen.
          </Text>
        </AppCard>

        <Text style={screenStyles.sectionLabel}>Header</Text>
        <Text style={screenStyles.cardBody}>
          Tap the "⋮" button in the top-right of the header above to see the new dropdown menu.
        </Text>
        <View style={screenStyles.gap} />

        <Text style={screenStyles.sectionLabel}>Bottom Navigation (your real tabs)</Text>
        <Text style={screenStyles.cardBody}>
          Tap a tab below — this is the same component wired into your real BottomNavigator.jsx.
        </Text>
        <View style={screenStyles.gap} />

        <Text style={screenStyles.sectionLabel}>Buttons</Text>
        <PrimaryButton title="PRIMARY" icon="play" onPress={() => {}} />
        <View style={screenStyles.gap} />
        <PrimaryButton title="SECONDARY" variant="secondary" onPress={() => {}} />
        <View style={screenStyles.gap} />
        <PrimaryButton title="SUCCESS" variant="success" onPress={() => {}} />
        <View style={screenStyles.gap} />
        <PrimaryButton title="DANGER" variant="danger" onPress={() => {}} />
      </ScrollView>

      <BottomNavigation tabs={REAL_TABS} activeKey={activeTab} onChange={setActiveTab} />
    </SafeAreaView>
  );
};

export default ComponentShowcaseScreen;

const screenStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.huge + 90 },
  cardSpacing: { marginBottom: spacing.xxl },
  cardTitle: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.sm },
  cardBody: { ...typography.body, color: colors.textSecondary, lineHeight: 20 },
  sectionLabel: { ...typography.eyebrow, color: colors.textMuted, marginBottom: spacing.md },
  gap: { height: spacing.md },
});