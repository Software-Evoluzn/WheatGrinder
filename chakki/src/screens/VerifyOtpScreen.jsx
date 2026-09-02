import React, { useState, useRef } from 'react';
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

const API_BASE_URL = IP_CONFIG.BASE_URL;

const VerifyOtpScreen = ({ route, navigation }) => {
  const email = route?.params?.email || '';

  // 1. Updated for 6-digit OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // 2. Updated 6 Refs for input navigation
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // Handle OTP input change and auto-focus next input
  const handleOtpChange = (value, index) => {
    const cleanVal = value.slice(-1);

    const newOtp = [...otp];
    newOtp[index] = cleanVal;
    setOtp(newOtp);

    // Auto-focus next input field (up to index 4)
    if (cleanVal && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  // Handle backspace key press to move focus back
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');

    // 3. Validation updated to 6 digits
    if (enteredOtp.length < 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP.');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Missing email parameter. Please restart the reset process.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/verify-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: enteredOtp, // Fixed typo from 'enbteredOtp'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message || 'OTP verified successfully.', [
          {
            text: 'OK',
            onPress: () => {
              if (navigation?.navigate) {
                navigation.navigate('ResetPasswordScreen', { email, otp: enteredOtp });
              }
            },
          },
        ]);
      } else {
        Alert.alert('Verification Failed', data.error || 'Invalid or expired OTP.');
      }
    } catch (error) {
      console.error('Verify OTP API Error:', error);
      Alert.alert('Error', 'Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Missing email address. Please return to the previous screen.');
      return;
    }

    setResending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message || 'A new OTP has been sent to your email.');
        setOtp(['', '', '', '', '', '']); // Reset all 6 fields
        inputRefs[0].current?.focus();
      } else {
        Alert.alert('Error', data.error || 'Failed to resend OTP.');
      }
    } catch (error) {
      console.error('Resend OTP API Error:', error);
      Alert.alert('Error', 'Unable to reach server. Please try again later.');
    } finally {
      setResending(false);
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
            <TouchableOpacity
              onPress={handleResendOtp}
              activeOpacity={0.7}
              disabled={resending}
            >
              <Text style={styles.resendText}>
                Didn't receive the OTP?{' '}
                <Text style={styles.resendBoldText}>
                  {resending ? 'Sending...' : 'Resend OTP'}
                </Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.footerBrandText}>Powered by EVOLUZN</Text>
          </View>

          {/* FLOATING OTP CARD */}
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>Verify OTP</Text>
            <Text style={styles.cardSubtitle}>
              Enter the 6-digit OTP sent to {email ? email : 'your registered email'}
            </Text>

            {/* OTP INPUTS ROW */}
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(val) => handleOtpChange(val, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  textAlign="center"
                  editable={!loading}
                />
              ))}
            </View>

            {/* VERIFY OTP BUTTON */}
            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.disabledButton]}
              onPress={handleVerifyOtp}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default VerifyOtpScreen;

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
    paddingTop: 130,
    paddingBottom: 24,
  },
  resendText: {
    color: '#E0D6EC',
    fontSize: 14,
    fontWeight: '500',
  },
  resendBoldText: {
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
    top: '30%',
    left: '6%',
    right: '6%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 16,
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
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#7C7C7C',
    textAlign: 'center',
    marginBottom: 24,
  },

  /* OTP BOXES - Adjusted width/height for 6 boxes */
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  otpInput: {
    width: 44,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F3F6',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  /* VERIFY BUTTON */
  verifyButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#492971',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});