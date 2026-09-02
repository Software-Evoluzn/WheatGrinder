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
  ActivityIndicator,
} from 'react-native';

import IP_CONFIG from '../services/ip.json';

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
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
            <Text style={styles.cardSubtitle}>
              Create a new password for your account
            </Text>

            {/* NEW PASSWORD INPUT */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="New Password"
                placeholderTextColor="#A0AEC0"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Text style={styles.eyeText}>{showNewPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            {/* CONFIRM PASSWORD INPUT */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm New Password"
                placeholderTextColor="#A0AEC0"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.eyeText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleResetPassword}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },

  /* TOP HALF (WHITE BACKGROUND) */
  topSection: {
    height: '42%',
    backgroundColor: '#FFFFFF',
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

  /* BOTTOM HALF (PURPLE BACKGROUND) */
  bottomSection: {
    height: '58%',
    backgroundColor: '#492971',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 140,
    paddingBottom: 24,
  },
  backToLoginText: {
    color: '#E0D6EC',
    fontSize: 14,
    fontWeight: '500',
  },
  loginBoldText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footerBrandText: {
    color: '#D8CEE6',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#7C7C7C',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },

  /* INPUT CONTAINERS */
  inputContainer: {
    width: '100%',
    height: 50,
    backgroundColor: '#F1F3F6',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  eyeButton: {
    paddingLeft: 10,
  },
  eyeText: {
    color: '#492971',
    fontSize: 13,
    fontWeight: '600',
  },

  /* SUBMIT BUTTON */
  submitButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#492971',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});