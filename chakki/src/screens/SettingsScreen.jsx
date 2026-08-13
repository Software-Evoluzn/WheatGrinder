import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Feather from 'react-native-vector-icons/Feather';
import { useAppTheme } from '../services/theme';

// Rasoi Shop Brand Color Palette
const RASOI_BRAND = {
  primary: '#C2410C', // Deep Terracotta / Spice Red
  primaryDark: '#9A3412',
  primaryLight: '#FFF7ED', // Warm Cream Background Tint
  accentGold: '#D97706', // Warm Amber / Saffron
  statusGreen: '#16A34A',
  statusGreenBg: 'rgba(22, 163, 74, 0.16)',
  darkCard: '#1C1917', // Cast Iron Warm Black
};

const SettingsScreen = ({ navigation }) => {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors);

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

  // Header fade-in animation
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header without 'Rasoi Account' */}
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <Text style={styles.screenTitle}>Settings</Text>
      </Animated.View>

      {/* Identity Card */}
      <View style={styles.identityCard}>
        <View style={styles.identityTop}>
          <View style={styles.identityAvatar}>
            <Text style={styles.identityAvatarText}>
              {userName ? userName.charAt(0).toUpperCase() : 'R'}
            </Text>
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.identityName} numberOfLines={1}>
              {userName || '—'}
            </Text>
            <Text style={styles.identityEmail} numberOfLines={1}>
              {email || '—'}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>VERIFIED</Text>
          </View>
        </View>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          <Feather name="user" size={16} color={RASOI_BRAND.primary} />
        </View>

        <View style={styles.card}>
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

          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
            <Feather name="arrow-right" size={16} color={RASOI_BRAND.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Notifications & Alerts</Text>
          <Feather name="bell" size={16} color={RASOI_BRAND.primary} />
        </View>

        <View style={styles.card}>
          {/* SMS Alerts */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextWrapper}>
              <Text style={styles.deviceLabel}>SMS Alerts</Text>
              <Text style={styles.deviceSubLabel}>
                Receive recipe & appliance updates via text
              </Text>
            </View>
            <Switch
              value={smsEnabled}
              onValueChange={setSmsEnabled}
              trackColor={{ false: '#E5E7EB', true: RASOI_BRAND.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E5E7EB"
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
                  placeholderTextColor={colors.subText}
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
            <View style={styles.switchTextWrapper}>
              <Text style={styles.deviceLabel}>Email Alerts</Text>
              <Text style={styles.deviceSubLabel}>
                Receive order & service updates via email
              </Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ false: '#E5E7EB', true: RASOI_BRAND.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E5E7EB"
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
                  placeholderTextColor={colors.subText}
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
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.85}
              onPress={handleSaveNotifications}
            >
              <Text style={styles.editButtonText}>Save Notification Preferences</Text>
              <Feather name="check" size={16} color={RASOI_BRAND.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Devices Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Appliances</Text>
          <Feather name="cpu" size={16} color={RASOI_BRAND.primary} />
        </View>

        <View style={styles.card}>
          <View style={styles.deviceRow}>
            <View>
              <Text style={styles.deviceLabel}>Registered Kitchen Devices</Text>
              <Text style={styles.deviceSubLabel}>
                Connected to your Rasoi account
              </Text>
            </View>
            <Text style={styles.deviceCount}>{productCount}</Text>
          </View>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        activeOpacity={0.85}
        onPress={() => navigation.replace('Login')}
      >
        <Feather
          name="log-out"
          size={18}
          color="#DC2626"
          style={styles.logoutIcon}
        />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Rasoi Shop App v1.0.0</Text>
    </ScrollView>
  );
};

export default SettingsScreen;

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingHorizontal: 24,
      paddingTop: 48, // Increased top padding for better breathing space
      paddingBottom: 48,
    },

    // Header
    header: {
      width: '100%',
      marginBottom: 24,
    },
    screenTitle: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.6,
      width: '100%',
    },

    // Identity Card
    identityCard: {
      backgroundColor: RASOI_BRAND.darkCard,
      borderRadius: 24,
      padding: 22,
      marginBottom: 32,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 4,
      borderWidth: 1,
      borderColor: 'rgba(217, 119, 6, 0.2)',
    },
    identityTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    identityAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: RASOI_BRAND.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    identityAvatarText: {
      fontSize: 22,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    identityInfo: {
      flex: 1,
      marginRight: 10,
    },
    identityName: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    identityEmail: {
      fontSize: 13,
      fontWeight: '400',
      color: 'rgba(255,255,255,0.6)',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: RASOI_BRAND.statusGreenBg,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: RASOI_BRAND.statusGreen,
      marginRight: 6,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '800',
      color: RASOI_BRAND.statusGreen,
      letterSpacing: 0.5,
    },

    // Sections
    section: {
      marginBottom: 28,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingHorizontal: 18,
      paddingVertical: 6,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.04,
      shadowRadius: 16,
      elevation: 1,
      borderWidth: 1,
      borderColor: colors.border,
    },

    dataRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
    },
    dataLabel: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.subText,
    },
    dataValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      maxWidth: '60%',
      textAlign: 'right',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },

    editButton: {
      marginTop: 10,
      marginBottom: 16,
      backgroundColor: RASOI_BRAND.primaryLight,
      borderWidth: 1,
      borderColor: 'rgba(194, 65, 12, 0.15)',
      borderRadius: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    editButtonText: {
      color: RASOI_BRAND.primary,
      fontWeight: '700',
      fontSize: 14,
    },

    // Switches & inputs
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
    },
    switchTextWrapper: {
      flex: 1,
      marginRight: 12,
    },
    fieldWrapper: {
      paddingBottom: 16,
    },
    fieldWrapperLast: {
      paddingBottom: 6,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: RASOI_BRAND.accentGold,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputRowError: {
      borderColor: '#FCA5A5',
      backgroundColor: '#FEF2F2',
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      padding: 0,
    },
    errorText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#DC2626',
      marginTop: 6,
    },

    // Devices
    deviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 18,
    },
    deviceLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 3,
    },
    deviceSubLabel: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.subText,
    },
    deviceCount: {
      fontSize: 22,
      fontWeight: '800',
      color: RASOI_BRAND.primary,
      letterSpacing: -0.4,
    },

    // Logout
    logoutButton: {
      marginTop: 8,
      marginBottom: 24,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: '#FEE2E2',
      paddingVertical: 16,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutIcon: {
      marginRight: 8,
    },
    logoutText: {
      color: '#DC2626',
      fontWeight: '700',
      fontSize: 15,
    },

    version: {
      textAlign: 'center',
      color: colors.subText,
      fontSize: 12,
      fontWeight: '500',
      letterSpacing: 0.2,
    },
  });