import React, { useState, useCallback, useEffect, memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  SafeAreaView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAppTheme } from '../services/theme';

// Rasoi Shop Brand Color Palette
const RASOI_BRAND = {
  primary: '#C2410C', // Deep Terracotta / Spice Red
  primaryDark: '#9A3412',
  primaryLight: '#FFF7ED', // Warm Cream Background Tint
  accentGold: '#D97706', // Warm Amber / Saffron
  statusGreen: '#16A34A',
  darkCard: '#1C1917', // Cast Iron Warm Black
};

/* -------------------------------------------------------------------------- */
/*  Reusable Sub-Components                                                   */
/* -------------------------------------------------------------------------- */

const SectionCard = memo(({ title, icon, children, style }) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return (
    <View style={[styles.section, style]}>
      {title ? (
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {icon ? <Feather name={icon} size={16} color={RASOI_BRAND.primary} /> : null}
        </View>
      ) : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
});

const InputField = memo(
  ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    error,
    isPassword = false,
    passwordVisible = false,
    onTogglePassword,
    autoCapitalize = 'sentences',
    isLast = false,
  }) => {
    const { colors } = useAppTheme();
    const styles = createStyles(colors);
    return (
      <View style={[styles.fieldWrapper, isLast && styles.fieldWrapperLast]}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={[styles.inputRow, error && styles.inputRowError]}>
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.subText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={isPassword && !passwordVisible}
          />
          {isPassword ? (
            <TouchableOpacity
              onPress={onTogglePassword}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather
                name={passwordVisible ? 'eye-off' : 'eye'}
                size={18}
                color={colors.subText}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }
);

const NotificationSwitch = memo(({ label, subLabel, value, onValueChange, isLast = false }) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return (
    <View>
      <View style={styles.switchRow}>
        <View style={styles.switchTextWrapper}>
          <Text style={styles.deviceLabel}>{label}</Text>
          {subLabel ? <Text style={styles.deviceSubLabel}>{subLabel}</Text> : null}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#E5E7EB', true: RASOI_BRAND.primary }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#E5E7EB"
        />
      </View>
      {!isLast ? <View style={styles.divider} /> : null}
    </View>
  );
});

const ActionButton = memo(({ label, onPress, variant = 'primary', icon }) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      style={[styles.actionButton, isPrimary ? styles.primaryButton : styles.secondaryButton]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {icon ? (
        <Feather
          name={icon}
          size={16}
          color={isPrimary ? '#FFFFFF' : colors.text}
          style={{ marginRight: 8 }}
        />
      ) : null}
      <Text style={isPrimary ? styles.primaryButtonText : styles.secondaryButtonText}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

const ProfileHeader = memo(({ name, email, phone, onChangePicture }) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const initial = name ? name.charAt(0).toUpperCase() : 'R';
  return (
    <View style={styles.identityCard}>
      <View style={styles.identityTop}>
        <View style={styles.identityAvatarWrapper}>
          <View style={styles.identityAvatar}>
            <Text style={styles.identityAvatarText}>{initial}</Text>
          </View>
          <TouchableOpacity
            style={styles.editAvatarBadge}
            activeOpacity={0.85}
            onPress={onChangePicture}
          >
            <Feather name="camera" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.identityInfo}>
          <Text style={styles.identityName} numberOfLines={1}>
            {name || '—'}
          </Text>
          <Text style={styles.identityEmail} numberOfLines={1}>
            {email || '—'}
          </Text>
          <Text style={styles.identityPhone} numberOfLines={1}>
            {phone || '—'}
          </Text>
        </View>
      </View>
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/*  Main Screen                                                               */
/* -------------------------------------------------------------------------- */

const EditProfileScreen = ({ navigation }) => {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors);

  // Local static user profile fields
  const [name, setName] = useState('Sejal Sharma');
  const [email, setEmail] = useState('sejal@rasoishop.com');
  const [phone, setPhone] = useState('9876543210');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification settings
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Errors state
  const [errors, setErrors] = useState({});

  // Local account details
  const [accountInfo] = useState({
    registeredDevices: 2,
  });

  const handleChangePicture = useCallback(() => {
    Alert.alert('Change Profile Picture', 'Photo picker option will be displayed here.');
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!name || !name.trim()) {
      newErrors.name = 'Name cannot be empty';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) {
      newErrors.email = 'Email cannot be empty';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    const digitsOnly = (phone || '').replace(/\D/g, '');
    if (!digitsOnly) {
      newErrors.phone = 'Phone number cannot be empty';
    } else if (digitsOnly.length !== 10) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        newErrors.currentPassword = 'Enter your current password';
      }
      if (newPassword && newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, email, phone, currentPassword, newPassword, confirmPassword]);

  const handleSave = useCallback(() => {
    const isValid = validateForm();

    if (!isValid) {
      Alert.alert(
        'Please fix highlighted fields',
        'Some information needs your attention.'
      );
      return;
    }

    Alert.alert('Success', 'Profile Updated Successfully', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  }, [validateForm, navigation]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="arrow-left" size={20} color={colors.text} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Edit Profile</Text>
          </View>

          {/* Profile Identity Card */}
          <ProfileHeader
            name={name}
            email={email}
            phone={phone}
            onChangePicture={handleChangePicture}
          />

          {/* Personal Information */}
          <SectionCard title="Personal Information" icon="user">
            <InputField
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              error={errors.name}
            />
            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <InputField
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              error={errors.phone}
              isLast
            />
          </SectionCard>

          {/* Notifications */}
          <SectionCard title="Notifications & Alerts" icon="bell">
            <NotificationSwitch
              label="SMS Alerts"
              subLabel="Receive recipe & appliance updates via text"
              value={smsEnabled}
              onValueChange={setSmsEnabled}
            />
            <NotificationSwitch
              label="Email Alerts"
              subLabel="Receive order & service updates via email"
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              isLast
            />
          </SectionCard>

          {/* Appliances Preference */}
          <SectionCard title="My Appliances" icon="cpu">
            <View style={styles.deviceRow}>
              <View>
                <Text style={styles.deviceLabel}>Registered Kitchen Devices</Text>
                <Text style={styles.deviceSubLabel}>Connected to your Rasoi account</Text>
              </View>
              <Text style={styles.deviceCount}>{accountInfo.registeredDevices}</Text>
            </View>
          </SectionCard>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <ActionButton label="Save Changes" onPress={handleSave} variant="primary" icon="check" />
            <ActionButton label="Cancel" onPress={handleCancel} variant="secondary" />
          </View>

          <Text style={styles.version}>Rasoi Shop App v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flexOne: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingHorizontal: 24,
      paddingTop: 36, // Increased top padding for better breathing space
      paddingBottom: 48,
    },

    // Header
    header: {
      marginBottom: 24,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginBottom: 12,
    },
    backButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 6,
    },
    screenTitle: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.6,
    },

    // Identity Card (Rasoi Dark Cast Iron Style)
    identityCard: {
      backgroundColor: RASOI_BRAND.darkCard,
      borderRadius: 24,
      padding: 22,
      marginBottom: 28,
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
    identityAvatarWrapper: {
      position: 'relative',
      marginRight: 16,
    },
    identityAvatar: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: RASOI_BRAND.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    identityAvatarText: {
      fontSize: 26,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    editAvatarBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: RASOI_BRAND.accentGold,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: RASOI_BRAND.darkCard,
    },
    identityInfo: {
      flex: 1,
    },
    identityName: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 3,
    },
    identityEmail: {
      fontSize: 13,
      fontWeight: '400',
      color: 'rgba(255,255,255,0.6)',
      marginBottom: 2,
    },
    identityPhone: {
      fontSize: 13,
      fontWeight: '400',
      color: 'rgba(255,255,255,0.6)',
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

    // Input fields
    fieldWrapper: {
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    fieldWrapperLast: {
      borderBottomWidth: 0,
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
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
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

    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
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

    // Switch rows
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

    // Buttons
    buttonGroup: {
      marginTop: 8,
      gap: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 16,
    },
    primaryButton: {
      backgroundColor: RASOI_BRAND.primary,
      shadowColor: RASOI_BRAND.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 3,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
    secondaryButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 15,
    },

    version: {
      textAlign: 'center',
      color: colors.subText,
      fontSize: 12,
      fontWeight: '500',
      letterSpacing: 0.2,
      marginTop: 24,
    },
  });