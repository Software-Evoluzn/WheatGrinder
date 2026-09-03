import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  Animated,
  Pressable,
} from 'react-native';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Feather from 'react-native-vector-icons/Feather';
import { useAppTheme } from '../services/theme';
import { colors, spacing, radii, typography, shadows, layout } from './theme';
import { Screen, MainHeader, Card, SecondaryButton } from './ui';

const SettingsScreen = ({ navigation }) => {
  // Kept for the status-bar / dark-mode contract; visuals use brand tokens so
  // Settings matches the rest of the app instead of the old copied dark theme.
  const { isDark } = useAppTheme();

  // Local static/UI state
  const [user] = useState({
    name: 'Sejal Sharma',
    email: 'sejal@rasoishop.com',
    contact: '9876543210',
  });

  const [productCount] = useState(2);

  // Notification preferences
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsNumber, setSmsNumber] = useState(user.contact);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState(user.email);
  const [notificationErrors, setNotificationErrors] = useState({});

  // Content fade-in animation
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [headerFade]);

  const userName = user?.name || '';
  const email = user?.email || '';
  const contact = user?.contact || '';

  const validateNotificationSettings = useCallback(() => {
    const newErrors = {};

    if (smsEnabled) {
      const digitsOnly = (smsNumber || '').replace(/\D/g, '');
      if (!digitsOnly) {
        newErrors.smsNumber = 'Enter a phone number for SMS alerts';
      } else if (digitsOnly.length !== 10) {
        newErrors.smsNumber = 'Phone number must be 10 digits';
      }
    }

    if (emailEnabled) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!notificationEmail || !notificationEmail.trim()) {
        newErrors.notificationEmail = 'Enter an email for alerts';
      } else if (!emailRegex.test(notificationEmail.trim())) {
        newErrors.notificationEmail = 'Enter a valid email address';
      }
    }

    setNotificationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [smsEnabled, smsNumber, emailEnabled, notificationEmail]);

  const handleSaveNotifications = useCallback(() => {
    const isValid = validateNotificationSettings();

    if (!isValid) {
      Alert.alert('Please fix the highlighted fields', 'Some information needs your attention.');
      return;
    }

    Alert.alert('Success', 'Notification preferences saved locally.');
  }, [validateNotificationSettings]);

  // Small reusable section header with a tinted icon chip on the left.
  const SectionLabel = ({ icon, title }) => (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionIconChip}>
        <Feather name={icon} size={15} color={colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <Screen barStyle={isDark ? 'light-content' : 'dark-content'}>
      {/* Shared primary-screen header (System A keeps the bottom tab bar). */}
      <MainHeader title="Settings" right={null} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile hero — anchors the screen with brand identity */}
        <Animated.View style={{ opacity: headerFade }}>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroAvatar}>
                <Text style={styles.heroAvatarText}>
                  {userName ? userName.charAt(0).toUpperCase() : 'R'}
                </Text>
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {userName || '—'}
                </Text>
                <Text style={styles.heroEmail} numberOfLines={1}>
                  {email || '—'}
                </Text>
              </View>
              <View style={styles.verifiedPill}>
                <Feather name="check-circle" size={12} color={colors.textOnPrimary} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>

            <View style={styles.heroDivider} />

            {/* Quick stats strip */}
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{productCount}</Text>
                <Text style={styles.heroStatLabel}>Machines</Text>
              </View>
              <View style={styles.heroStatSep} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>Active</Text>
                <Text style={styles.heroStatLabel}>Account</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Profile Section */}
        <View style={styles.section}>
          <SectionLabel icon="user" title="Profile Details" />

          <Card padded={false} style={styles.cardInner}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Name</Text>
              <Text style={styles.dataValue} numberOfLines={1}>
                {userName || 'Not set'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Email</Text>
              <Text style={styles.dataValue} numberOfLines={1}>
                {email || 'Not set'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Phone</Text>
              <Text style={styles.dataValue} numberOfLines={1}>
                {contact || 'Not available'}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Edit Profile as a list row */}
            <Pressable
              style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
              onPress={() => navigation.navigate('EditProfile')}
              accessibilityRole="button"
            >
              <View style={styles.linkRowLeft}>
                <View style={styles.rowIconChip}>
                  <Feather name="edit-3" size={15} color={colors.primary} />
                </View>
                <Text style={styles.linkRowText}>Edit Profile</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textMuted} />
            </Pressable>
          </Card>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <SectionLabel icon="bell" title="Notifications & Alerts" />

          <Card padded={false} style={styles.cardInner}>
            {/* SMS Alerts */}
            <View style={styles.switchRow}>
              <View style={styles.rowIconChip}>
                <Feather name="message-square" size={15} color={colors.primary} />
              </View>
              <View style={styles.switchTextWrapper}>
                <Text style={styles.itemLabel}>SMS Alerts</Text>
                <Text style={styles.itemSubLabel}>
                  Get grinding and maintenance alerts by text
                </Text>
              </View>
              <Switch
                value={smsEnabled}
                onValueChange={setSmsEnabled}
                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.borderStrong}
              />
            </View>

            {smsEnabled ? (
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Send SMS To</Text>
                <View
                  style={[
                    styles.inputRow,
                    notificationErrors.smsNumber && styles.inputRowError,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    value={smsNumber}
                    onChangeText={setSmsNumber}
                    placeholder="Enter 10-digit phone number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
                {notificationErrors.smsNumber ? (
                  <Text style={styles.errorText}>{notificationErrors.smsNumber}</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.divider} />

            {/* Email Alerts */}
            <View style={styles.switchRow}>
              <View style={styles.rowIconChip}>
                <Feather name="mail" size={15} color={colors.primary} />
              </View>
              <View style={styles.switchTextWrapper}>
                <Text style={styles.itemLabel}>Email Alerts</Text>
                <Text style={styles.itemSubLabel}>
                  Get service and maintenance updates by email
                </Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.borderStrong}
              />
            </View>

            {emailEnabled ? (
              <View style={[styles.fieldWrapper, styles.fieldWrapperLast]}>
                <Text style={styles.fieldLabel}>Send Email To</Text>
                <View
                  style={[
                    styles.inputRow,
                    notificationErrors.notificationEmail && styles.inputRowError,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    value={notificationEmail}
                    onChangeText={setNotificationEmail}
                    placeholder="Enter email address"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {notificationErrors.notificationEmail ? (
                  <Text style={styles.errorText}>
                    {notificationErrors.notificationEmail}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {smsEnabled || emailEnabled ? (
              <SecondaryButton
                title="Save Notification Preferences"
                icon="check"
                onPress={handleSaveNotifications}
                style={styles.inlineButton}
              />
            ) : null}
          </Card>
        </View>

        {/* Devices Section */}
        <View style={styles.section}>
          <SectionLabel icon="cpu" title="My Devices" />

          <Card padded={false} style={styles.cardInner}>
            <View style={styles.deviceRow}>
              <View style={styles.rowIconChip}>
                <Feather name="hard-drive" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={styles.itemLabel}>Registered Machines</Text>
                <Text style={styles.itemSubLabel}>
                  Connected to your Rasoi account
                </Text>
              </View>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{productCount}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.85 }]}
          onPress={() => navigation.replace('Login')}
          accessibilityRole="button"
        >
          <Feather name="log-out" size={18} color={colors.danger} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Text style={styles.version}>Rasoi Shop App v1.0.0</Text>
      </ScrollView>
    </Screen>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },

  // Profile hero
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    ...shadows.card,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  heroAvatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  heroInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textOnPrimary,
    marginBottom: 2,
  },
  heroEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    gap: 5,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textOnPrimary,
    letterSpacing: 0.3,
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginVertical: spacing.lg,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStat: {
    flex: 1,
    alignItems: 'flex-start',
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.4,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  heroStatSep: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: spacing.lg,
  },

  // Sections
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionIconChip: {
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },

  cardInner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },

  // Row icon chip (used in list/switch/device rows)
  rowIconChip: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },

  // Tappable list row
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  linkRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkRowText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  inlineButton: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },

  // Switches & inputs
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  switchTextWrapper: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  itemSubLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  fieldWrapper: {
    paddingBottom: spacing.lg,
  },
  fieldWrapperLast: {
    paddingBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.eyebrow,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputRowError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerTint,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
    marginTop: 6,
  },

  // Devices
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  countPill: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryTintBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },

  // Logout
  logoutButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.dangerTint,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: spacing.sm,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 15,
  },

  version: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});