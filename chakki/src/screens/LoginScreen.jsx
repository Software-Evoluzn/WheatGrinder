
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  useWindowDimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeBiometrics from 'react-native-biometrics';

import {
  loginUser,
  loginWithBiometricApi,
  getBiometricCustomerId,
} from '../services/AuthService';
import { BrandLogo } from './ui';

const SOFTEL_LOGO = require('../assets/images/Softel Millet mill logo 2.png');
const RASOI_LOGO = require('../assets/images/capture12.png');

const rnBiometrics = new ReactNativeBiometrics();

const LoginScreen = ({ navigation }) => {
  const { height: screenH } = useWindowDimensions();
  const isCompact = screenH < 760;

  // Where the purple area starts
  const [purpleTop, setPurpleTop] = useState(Math.round(screenH * 0.55));

  const onCardLayout = (e) => {
    const { y, height } = e.nativeEvent.layout;
    setPurpleTop(Math.round(y + height * 0.78));
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Auto Login checkbox
  const [autoLogin, setAutoLogin] = useState(false);

  // Loading state
  const [loading, setLoading] = useState(false);

  // Biometric states
  const [savedBioCustomerId, setSavedBioCustomerId] = useState(null);

  useEffect(() => {
    checkBiometricSetup();
  }, []);

  const checkBiometricSetup = async () => {
    try {
      const { available } = await rnBiometrics.isSensorAvailable();
      const storedCustId = await getBiometricCustomerId();

      if (available && storedCustId) {
        setSavedBioCustomerId(storedCustId);
      }
    } catch (e) {
      console.log('Biometric check error:', e);
    }
  };

  // Biometric Login Handler
  const handleBiometricLogin = async () => {
    if (!savedBioCustomerId) {
      Alert.alert(
        'Biometric Not Enabled',
        'Please enable biometric during registration first.'
      );
      return;
    }

    try {
      setLoading(true);
      const payload = `${savedBioCustomerId}_${Date.now()}`;

      const { success, signature } = await rnBiometrics.createSignature({
        promptMessage: 'Login with Fingerprint / Biometric',
        payload: payload,
      });

      if (success && signature) {
        const data = await loginWithBiometricApi(
          savedBioCustomerId,
          signature,
          payload
        );

        await AsyncStorage.setItem('customer_id', String(data.customer_id));

        if (autoLogin) {
          await AsyncStorage.setItem('auto_login', 'true');
        } else {
          await AsyncStorage.removeItem('auto_login');
        }

        navigation.replace('Main', {
          customer_id: data.customer_id,
        });
      }
    } catch (error) {
      console.log('BIOMETRIC LOGIN ERROR:', error);
      Alert.alert(
        'Biometric Failed',
        error.message || 'Unable to verify biometric. Please login with Email & Password.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Email & Password Login Handler
  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter email');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter password');
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser(email, password);

      if (data.customer_id) {
        await AsyncStorage.setItem('customer_id', String(data.customer_id));
      }

      if (autoLogin) {
        await AsyncStorage.setItem('auto_login', 'true');
      } else {
        await AsyncStorage.removeItem('auto_login');
      }

      navigation.replace('Main', {
        customer_id: data.customer_id,
      });
    } catch (error) {
      console.log('LOGIN ERROR:', error);
      Alert.alert('Login Failed', error.message || 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.screenBody}>
          <View style={[styles.purpleBg, { top: purpleTop }]} />

          {/* Logos */}
          <View style={[styles.logoWrap, isCompact && styles.logoWrapCompact]}>
            <Image
              source={SOFTEL_LOGO}
              style={[styles.millLogo, isCompact && styles.millLogoCompact]}
              resizeMode="contain"
            />

            <Text style={[styles.byText, isCompact && styles.byTextCompact]}>
              by
            </Text>

            <View style={styles.rasoiLogoWrap}>
              <BrandLogo
                source={RASOI_LOGO}
                ratio={320 / 60}
                variant="header"
              />
            </View>
          </View>

          {/* Login Card */}
          <View
            style={[styles.loginCard, isCompact && styles.loginCardCompact]}
            onLayout={onCardLayout}
          >
            <Text style={[styles.loginTitle, isCompact && styles.loginTitleCompact]}>
              Login
            </Text>

            <TextInput
              style={[styles.input, isCompact && styles.inputCompact]}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#555"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View
              style={[
                styles.passwordContainer,
                isCompact && styles.inputCompact,
              ]}
            >
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
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#222"
                />
              </TouchableOpacity>
            </View>

            {/* Auto Login and Forgot Password */}
            <View
              style={[
                styles.optionsRow,
                isCompact && styles.optionsRowCompact,
              ]}
            >
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAutoLogin(!autoLogin)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather
                  name={autoLogin ? 'check-square' : 'square'}
                  size={20}
                  color="#55327A"
                />
                <Text style={styles.checkboxLabel}>Auto Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPasswordScreen')}
              >
                <Text style={styles.forgotText}>Forgot Password ?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isCompact && styles.loginButtonCompact]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Logging in...' : 'LOGIN'}
              </Text>
            </TouchableOpacity>

            {/* Biometric Login */}
            {savedBioCustomerId && (
              <>
                <View
                  style={[
                    styles.dividerRow,
                    isCompact && styles.dividerRowCompact,
                  ]}
                >
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={[
                    styles.biometricFullButton,
                    isCompact && styles.biometricButtonCompact,
                  ]}
                  onPress={handleBiometricLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="fingerprint"
                    size={22}
                    color="#56327A"
                  />

                  <Text style={styles.biometricButtonText}>
                    Login with Biometric
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Register */}
          <View
            style={[
              styles.registerContainer,
              isCompact && styles.registerContainerCompact,
            ]}
          >
            <Text style={styles.registerText}>Not Registered?</Text>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerButtonText}>REGISTER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  inner: {
    flex: 1,
  },

  screenBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingTop: 14,
    paddingBottom: 18,
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
    paddingTop: 6,
    paddingBottom: 18,
  },

  logoWrapCompact: {
    paddingTop: 4,
    paddingBottom: 10,
  },

  millLogo: {
    width: 245,
    height: 92,
    marginBottom: 9,
  },

  millLogoCompact: {
    width: 210,
    height: 76,
    marginBottom: 5,
  },

  byText: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '400',
    color: '#666666',
    marginVertical: 3,
    letterSpacing: 0.4,
  },

  byTextCompact: {
    fontSize: 12,
    marginVertical: 3,
  },

  rasoiLogoWrap: {
    transform: [{ scale: 0.9 }],
  },

  loginCard: {
    width: '88%',
    maxWidth: 340,
    marginTop: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 17,
    paddingBottom: 17,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },

  loginCardCompact: {
    marginTop: 3,
    paddingTop: 13,
    paddingBottom: 13,
    paddingHorizontal: 18,
  },

  loginTitle: {
    fontSize: 23,
    fontWeight: '400',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 12,
  },

  loginTitleCompact: {
    fontSize: 20,
    marginBottom: 9,
  },

  input: {
    height: 44,
    backgroundColor: '#E9E9E9',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#222222',
    marginBottom: 10,
  },

  inputCompact: {
    height: 40,
    marginBottom: 8,
  },

  passwordContainer: {
    height: 44,
    backgroundColor: '#E9E9E9',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 11,
  },

  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: '#222222',
    paddingVertical: 0,
  },

  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  optionsRowCompact: {
    marginBottom: 10,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  checkboxLabel: {
    color: '#333333',
    fontSize: 13,
    fontWeight: '400',
  },

  forgotText: {
    color: '#673B8B',
    fontSize: 13,
    fontWeight: '400',
  },

  loginButton: {
    height: 44,
    backgroundColor: '#7DC24D',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginButtonCompact: {
    height: 40,
  },

  // Updated Login button text
  loginButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    includeFontPadding: false,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 9,
  },

  dividerRowCompact: {
    marginVertical: 6,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DCDCDC',
  },

  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#777777',
    fontWeight: '500',
  },

  biometricFullButton: {
    height: 42,
    borderWidth: 1.5,
    borderColor: '#56327A',
    borderRadius: 9,
    backgroundColor: '#F8F4FC',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  biometricButtonCompact: {
    height: 36,
  },

  biometricButtonText: {
    color: '#56327A',
    fontSize: 13,
    fontWeight: '600',
  },

  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 14,
  },

  registerContainerCompact: {
    marginTop: 13,
  },

  registerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  registerButton: {
    backgroundColor: '#7DC24D',
    borderWidth: 1,
    borderColor: '#7DC24D',
    borderRadius: 5,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },

  // Updated Register button text
  registerButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
