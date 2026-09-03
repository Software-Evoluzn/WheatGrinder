import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import IP_CONFIG from '../services/ip.json';
import { PrimaryButton } from './ui';
import { colors, spacing, radii, typography, shadows } from './theme';

// ⚠️ Update with your local IP or backend URL
// Android Emulator: 'http://10.0.2.2:5007'
// iOS Simulator: 'http://localhost:5007'
const API_BASE_URL = IP_CONFIG.BASE_URL;

const ResetPasswordScreen = ({ route, navigation }) => {
  // Receive params passed from VerifyOtpScreen
  const email = route?.params?.email || '';
  const otp = route?.params?.otp || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Toggle visible passwords
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async () => {
    // 1. Client-side validations
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (!email || !otp) {
      Alert.alert('Error', 'Session expired. Please restart the forgot password process.');
      return;
    }

    setLoading(true);

    try {
      // 2. Call Flask backend endpoint `/reset-password`
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: otp,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message || 'Password successfully reset!', [
          {
            text: 'Login Now',
            onPress: () => {
              if (navigation?.navigate) {
                // Navigates back to your Login screen
                navigation.navigate('Login');
              }
            },
          },
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to reset password.');
      }
    } catch (error) {
      console.error('Reset Password Error:', error);
      Alert.alert('Error', 'Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    if (navigation?.navigate) {
      navigation.navigate('LoginScreen');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

        <View style={styles.mainContainer}>
          {/* TOP SECTION WITH LOGO */}
          <View style={styles.topSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/capture.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* BOTTOM PURPLE SECTION */}
          <View style={styles.bottomSection}>
            <TouchableOpacity onPress={handleBackToLogin} activeOpacity={0.7}>
              <Text style={styles.backToLoginText}>
                Remember your password? <Text style={styles.loginBoldText}>Login</Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.footerBrandText}>Powered by EVOLUZN</Text>
          </View>

          {/* FLOATING RESET PASSWORD CARD */}
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>Reset Password</Text>
            <Text style={styles.cardSubtitle}>Create a new password for your account</Text>

            {/* NEW PASSWORD INPUT */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="New Password"
                placeholderTextColor={colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name={showNewPassword ? 'eye-off' : 'eye'} size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* CONFIRM PASSWORD INPUT */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm New Password"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* SUBMIT BUTTON */}
            <PrimaryButton
              title="Update Password"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading}
              style={{ marginTop: spacing.xs }}
            />
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },

  /* TOP HALF (WHITE BACKGROUND) */
  topSection: {
    height: '42%',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  logoContainer: {
    width: 220,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },

  /* BOTTOM HALF (BRAND PURPLE BACKGROUND) */
  bottomSection: {
    height: '58%',
    backgroundColor: colors.primary,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 140,
    paddingBottom: spacing.xxl,
  },
  backToLoginText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  loginBoldText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  footerBrandText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  /* OVERLAY CARD DESIGN */
  cardContainer: {
    position: 'absolute',
    top: '26%',
    left: '8%',
    right: '8%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 18,
  },

  /* INPUT CONTAINERS */
  inputContainer: {
    width: '100%',
    height: 52,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  eyeButton: {
    paddingLeft: spacing.md,
  },
});