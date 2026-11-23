import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeBiometrics from 'react-native-biometrics';
import {
  registerUser,
  registerBiometricOnServer,
} from '../services/AuthService';
import { AppFooter, BrandLogo } from './ui';

const rnBiometrics = new ReactNativeBiometrics();

const RegisterScreen = ({ navigation }) => {
  const { height: screenH } = useWindowDimensions();

  // Where the purple area starts (follows the card so the card straddles white/purple)
  const [purpleTop, setPurpleTop] = useState(Math.round(screenH * 0.55));
  const onCardLayout = (e) => {
    const { y, height } = e.nativeEvent.layout;
    setPurpleTop(Math.round(y + height * 0.8));
  };

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Biometric states
  const [sensorAvailable, setSensorAvailable] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(true);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSensor();
  }, []);

  const checkSensor = async () => {
    try {
      const { available } = await rnBiometrics.isSensorAvailable();
      setSensorAvailable(available);
      setEnableBiometric(available);
    } catch (e) {
      console.log('Sensor check error:', e);
      setSensorAvailable(false);
      setEnableBiometric(false);
    }
  };

  // ==========================================
  // REGISTER + BIOMETRIC SETUP
  // ==========================================
  const handleRegister = async () => {
    if (!userName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter mobile number');
      return;
    }

    if (mobileNumber.trim().length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10 digit mobile number');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter email');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Error', 'Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password and confirm password do not match');
      return;
    }

    try {
      setLoading(true);

      const data = await registerUser(
        userName,
        mobileNumber,
        email,
        password
      );

      console.log('REGISTER RESPONSE:', data);

      if (sensorAvailable && enableBiometric && data.customer_id) {
        try {
          await rnBiometrics.deleteKeys();
          const { publicKey } = await rnBiometrics.createKeys();
          await registerBiometricOnServer(data.customer_id, publicKey);

          Alert.alert(
            'Registration Successful',
            'Account created & Biometric login enabled! You can now login with Email/Password or Biometric.',
            [
              {
                text: 'OK',
                onPress: () => navigation.replace('Login'),
              },
            ]
          );
          return;
        } catch (bioError) {
          console.log('BIOMETRIC SETUP ERROR:', bioError);
          Alert.alert(
            'Account Created',
            'Account created successfully, but biometric setup could not be completed. You can still login with Email & Password.',
            [
              {
                text: 'OK',
                onPress: () => navigation.replace('Login'),
              },
            ]
          );
          return;
        }
      }

      Alert.alert(
        'Registration Successful',
        data.message || 'Account created successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.replace('Login');
            },
          },
        ]
      );
    } catch (error) {
      console.log('REGISTER ERROR:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'Unable to create account'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
          nestedScrollEnabled={true}
        >
          {/* Purple area behind the lower part of the card */}
          <View style={[styles.purpleBg, { top: purpleTop }]} />

          {/* Logo */}
          <View style={styles.logoWrap}>
            <BrandLogo
              source={require('../assets/images/capture.png')}
              ratio={320 / 86}
              variant="header"
            />
          </View>

          {/* Sign Up card */}
          <View style={styles.registerCard} onLayout={onCardLayout}>
            <Text style={styles.registerTitle}>Sign Up</Text>

            {/* User Name */}
            <TextInput
              style={styles.input}
              value={userName}
              onChangeText={setUserName}
              placeholder="User Name"
              placeholderTextColor="#555"
              autoCapitalize="words"
            />

            {/* Password */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#777"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={19}
                  color="#222"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm Password"
                placeholderTextColor="#777"
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Feather
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={19}
                  color="#222"
                />
              </TouchableOpacity>
            </View>

            {/* Email */}
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email ID"
              placeholderTextColor="#555"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Mobile Number */}
            <TextInput
              style={styles.input}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              placeholder="Mobile Number"
              placeholderTextColor="#555"
              keyboardType="phone-pad"
              maxLength={10}
            />

            {/* Enable Biometric Option */}
            {sensorAvailable && (
              <TouchableOpacity
                style={styles.biometricCheckboxRow}
                onPress={() => setEnableBiometric(!enableBiometric)}
                activeOpacity={0.7}
              >
                <Feather
                  name={enableBiometric ? 'check-square' : 'square'}
                  size={20}
                  color="#55327A"
                />
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={20}
                  color="#55327A"
                />
                <Text style={styles.biometricCheckboxLabel}>
                  Enable Biometric Login
                </Text>
              </TouchableOpacity>
            )}

            {/* Sign Up Button */}
            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.signupButtonText}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Back to Login (on purple) */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Already Registered?</Text>
            <TouchableOpacity
              style={styles.loginLinkButton}
              onPress={() => navigation.replace('Login')}
            >
              <Text style={styles.loginLinkButtonText}>Login</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footerWrap}>
            <AppFooter variant="onDark" row />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#55327A', // Bottom overscroll par bhi purple background dikhega
  },

  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingBottom: 40, // Keyboard khulne par neeche scroll space
  },

  purpleBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#55327A',
  },

  logoWrap: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },

  registerCard: {
    width: '88%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },

  registerTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 18,
  },

  input: {
    height: 48,
    backgroundColor: '#E9E9E9',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#222222',
    marginBottom: 14,
  },

  passwordContainer: {
    height: 48,
    backgroundColor: '#E9E9E9',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    marginBottom: 14,
  },

  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: '#222222',
    paddingVertical: 0,
  },

  eyeButton: {
    padding: 4,
  },

  biometricCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingVertical: 4,
  },

  biometricCheckboxLabel: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '500',
  },

  signupButton: {
    height: 50,
    backgroundColor: '#7DC24D',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },

  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  loginLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    gap: 16,
  },

  loginLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  loginLinkButton: {
    backgroundColor: '#7DC24D',
    borderWidth: 1,
    borderColor: '#7DC24D',
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 7,
  },

  loginLinkButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  footerWrap: {
    marginTop: 28,
    width: '100%',
    alignItems: 'center',
  },
});