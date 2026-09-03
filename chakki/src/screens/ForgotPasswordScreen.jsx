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
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

import IP_CONFIG from '../services/ip.json';
import { PrimaryButton } from './ui';
import { colors, spacing, radii, typography, shadows } from './theme';

const API_BASE_URL = IP_CONFIG.BASE_URL;

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendResetLink = async () => {
    console.log('Reset link requested for:', email);

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your registered email address');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message || 'OTP sent to your email');

        if (navigation?.navigate) {
          navigation.navigate('VerifyOtpScreen', { email: email.trim() });
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to send OTP.');
      }
    } catch (error) {
      console.error('API Error:', error);
      Alert.alert('Error', 'Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (navigation?.navigate) {
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

          {/* FLOATING FORGOT PASSWORD CARD */}
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>Forgot Password</Text>
            <Text style={styles.cardSubtitle}>
              Enter your registered email address to receive a password reset link
            </Text>

            {/* EMAIL INPUT FIELD */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.emailInput}
                placeholder="Enter your email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* SUBMIT BUTTON */}
            <PrimaryButton
              title="Send Reset Link"
              onPress={handleSendResetLink}
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default ForgotPasswordScreen;

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
    paddingTop: 130, // Space below floating card
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
    top: '30%',
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
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 18,
  },

  /* EMAIL INPUT BOX */
  inputContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  emailInput: {
    width: '100%',
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});