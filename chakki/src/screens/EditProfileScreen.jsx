import React, { useState, useCallback, memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAppTheme } from '../services/theme';
import { Screen, MainHeader, Card, PrimaryButton, SecondaryButton } from './ui';
import { colors, spacing, radii, typography, shadows, layout } from './theme';

/* -------------------------------------------------------------------------- */
/*  Reusable Sub-Components (brand-themed)                                     */
/* -------------------------------------------------------------------------- */

const SectionCard = memo(({ title, icon, children }) => (
  <View style={styles.section}>
    {title ? (
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionIconChip}>
          <Feather name={icon} size={15} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    ) : null}
    <Card padded={false} style={styles.cardInner}>{children}</Card>
  </View>
));

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
  }) => (
    <View style={[styles.fieldWrapper, isLast && styles.fieldWrapperLast]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputRow, error && styles.inputRowError]}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={isPassword && !passwordVisible}
        />
        {isPassword ? (
          <Pressable onPress={onTogglePassword} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name={passwordVisible ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
);

const NotificationSwitch = memo(({ label, subLabel, value, onValueChange, icon, isLast = false }) => (
  <View>
    <View style={styles.switchRow}>
      {icon ? (
        <View style={styles.rowIconChip}>
          <Feather name={icon} size={15} color={colors.primary} />
        </View>
      ) : null}
      <View style={styles.switchTextWrapper}>
        <Text style={styles.itemLabel}>{label}</Text>
        {subLabel ? <Text style={styles.itemSubLabel}>{subLabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.borderStrong, true: colors.primary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={colors.borderStrong}
      />
    </View>
    {!isLast ? <View style={styles.divider} /> : null}
  </View>
));

const ProfileHero = memo(({ name, email, phone, onChangePicture }) => {
  const initial = name ? name.charAt(0).toUpperCase() : 'R';
  return (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Pressable style={styles.editAvatarBadge} onPress={onChangePicture} accessibilityLabel="Change picture">
            <Feather name="camera" size={13} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.heroInfo}>
          <Text style={styles.heroName} numberOfLines={1}>{name || '—'}</Text>
          <Text style={styles.heroSub} numberOfLines={1}>{email || '—'}</Text>
          <Text style={styles.heroSub} numberOfLines={1}>{phone || '—'}</Text>
        </View>
      </View>
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/*  Main Screen                                                               */
/* -------------------------------------------------------------------------- */

const EditProfileScreen = ({ navigation }) => {
  // Kept for the status-bar / dark-mode contract; visuals use brand tokens.
  const { isDark } = useAppTheme();

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
      Alert.alert('Please fix highlighted fields', 'Some information needs your attention.');
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
    <Screen barStyle={isDark ? 'light-content' : 'dark-content'}>
      <MainHeader
        title="Edit Profile"
        onBack={navigation?.goBack ? () => navigation.goBack() : undefined}
        right={null}
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
          {/* Profile Identity Hero */}
          <ProfileHero
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
              subLabel="Get grinding and maintenance alerts by text"
              value={smsEnabled}
              onValueChange={setSmsEnabled}
              icon="message-square"
            />
            <NotificationSwitch
              label="Email Alerts"
              subLabel="Get service and maintenance updates by email"
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              icon="mail"
              isLast
            />
          </SectionCard>

          {/* Devices */}
          <SectionCard title="My Devices" icon="cpu">
            <View style={styles.deviceRow}>
              <View style={styles.rowIconChip}>
                <Feather name="hard-drive" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={styles.itemLabel}>Registered Machines</Text>
                <Text style={styles.itemSubLabel}>Connected to your Rasoi account</Text>
              </View>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{accountInfo.registeredDevices}</Text>
              </View>
            </View>
          </SectionCard>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <PrimaryButton title="Save Changes" icon="check" onPress={handleSave} />
            <SecondaryButton title="Cancel" onPress={handleCancel} style={{ marginTop: spacing.md }} />
          </View>

          <Text style={styles.version}>Rasoi Shop App v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

export default EditProfileScreen;

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  container: { flex: 1 },
  contentContainer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },

  // Profile hero (brand purple)
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    ...shadows.card,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: { position: 'relative', marginRight: spacing.lg },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: colors.textOnPrimary },
  editAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 18, fontWeight: '800', color: colors.textOnPrimary, marginBottom: 3 },
  heroSub: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.72)', marginBottom: 2 },

  // Sections
  section: { marginBottom: spacing.xxl },
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
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.2 },

  cardInner: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },

  rowIconChip: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  // Inputs
  fieldWrapper: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  fieldWrapperLast: { borderBottomWidth: 0 },
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
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputRowError: { borderColor: colors.danger, backgroundColor: colors.dangerTint },
  textInput: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary, padding: 0 },
  errorText: { fontSize: 12, fontWeight: '600', color: colors.danger, marginTop: 6 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },

  // Switch rows
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg },
  switchTextWrapper: { flex: 1, marginRight: spacing.md },
  itemLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 },
  itemSubLabel: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },

  // Devices
  deviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg },
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
  countPillText: { fontSize: 15, fontWeight: '800', color: colors.primary },

  // Buttons
  buttonGroup: { marginTop: spacing.sm },

  version: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: spacing.xxl,
  },
});