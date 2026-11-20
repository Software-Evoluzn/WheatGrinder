import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';

import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeBiometrics from 'react-native-biometrics';

import {
  loginUser,
  loginWithBiometricApi,
  getBiometricCustomerId,
} from '../services/AuthService';

const rnBiometrics = new ReactNativeBiometrics();

const LoginScreen = ({ navigation }) => {
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

  // Option 2: Biometric Login Handler
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

  // Option 1: Email & Password Login Handler
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainCard}>
          {/* Top White Section */}
          <View style={styles.topSection}>
            <Image
              source={require('../assets/images/capture.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Purple Bottom Section */}
          <View style={styles.bottomSection}>
            {/* Login Card */}
            <View style={styles.loginCard}>
              <Text style={styles.loginTitle}>Login</Text>

              {/* Email */}
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#555"
                keyboardType="email-address"
                autoCapitalize="none"
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

                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#222"
                  />
                </TouchableOpacity>
              </View>

              {/* Auto Login checkbox + Forgot Password */}
              <View style={styles.optionsRow}>
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

              {/* Option 1: Email & Password Login Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Logging in...' : 'Login'}
                </Text>
              </TouchableOpacity>

              {/* Option 2: Biometric Button (Agar biometric enabled hai) */}
              {savedBioCustomerId && (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    style={styles.biometricFullButton}
                    onPress={handleBiometricLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="fingerprint"
                      size={24}
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
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Not Registered?</Text>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.registerButtonText}>Register</Text>
              </TouchableOpacity>
            </View>

            {/* Powered By */}
            <Text style={styles.poweredText}>Powered by EVOLUZN</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },

  mainCard: {
    width: '96%',
    maxWidth: 700,
    minHeight: 800,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 25,
    elevation: 10,
  },

  topSection: {
    height: 500,
    backgroundColor: '#FFFFFF',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 90,
  },

  logo: {
    width: 310,
    height: 100,
  },

  bottomSection: {
    flex: 1,
    minHeight: 320,
    backgroundColor: '#55327A',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 0,
  },

  loginCard: {
    width: '90%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    marginTop: -265,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },

  loginTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 22,
  },

  input: {
    height: 50,
    backgroundColor: '#E9E9E9',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#222222',
    marginBottom: 14,
  },

  passwordContainer: {
    height: 50,
    backgroundColor: '#E9E9E9',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 16,
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
    marginBottom: 22,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  checkboxLabel: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '400',
  },

  forgotText: {
    color: '#673B8B',
    fontSize: 14,
    fontWeight: '400',
  },

  loginButton: {
    height: 50,
    backgroundColor: '#56327A',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
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
    height: 48,
    borderWidth: 1.5,
    borderColor: '#56327A',
    borderRadius: 9,
    backgroundColor: '#F8F4FC',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  biometricButtonText: {
    color: '#56327A',
    fontSize: 14,
    fontWeight: '600',
  },

  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 16,
  },

  registerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  registerButton: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 7,
  },

  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  poweredText: {
    position: 'absolute',
    bottom: 8,
    color: '#B5A5C7',
    fontSize: 14,
    fontWeight: '500',
  },
});