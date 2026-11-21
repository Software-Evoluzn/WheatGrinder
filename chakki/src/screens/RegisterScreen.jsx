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
  registerUser,
  registerBiometricOnServer,
} from '../services/AuthService';

const rnBiometrics = new ReactNativeBiometrics();

// ==========================================
// VALIDATION HELPERS
// ==========================================
const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,49}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/; // Indian 10-digit mobile numbers

const getPasswordChecks = (password) => [
  { key: 'length', label: 'At least 8 characters', ok: password.length >= 8 },
  { key: 'upper', label: 'One uppercase letter (A-Z)', ok: /[A-Z]/.test(password) },
  { key: 'lower', label: 'One lowercase letter (a-z)', ok: /[a-z]/.test(password) },
  { key: 'number', label: 'One number (0-9)', ok: /\d/.test(password) },
  {
    key: 'special',
    label: 'One special character (!@#$%^&*...)',
    ok: /[^A-Za-z0-9\s]/.test(password),
  },
  { key: 'nospace', label: 'No spaces', ok: !/\s/.test(password) },
];

const validateForm = ({
  userName,
  mobileNumber,
  email,
  password,
  confirmPassword,
}) => {
  const errors = {};

  // Name
  if (!userName.trim()) {
    errors.userName = 'Please enter your name';
  } else if (!NAME_REGEX.test(userName.trim())) {
    errors.userName =
      "Name should be 2-50 letters (only letters, spaces, . ' -)";
  }

  // Mobile
  if (!mobileNumber.trim()) {
    errors.mobileNumber = 'Please enter mobile number';
  } else if (!/^\d+$/.test(mobileNumber.trim())) {
    errors.mobileNumber = 'Mobile number should contain digits only';
  } else if (!MOBILE_REGEX.test(mobileNumber.trim())) {
    errors.mobileNumber =
      'Enter a valid 10 digit mobile number starting with 6-9';
  }

  // Email
  if (!email.trim()) {
    errors.email = 'Please enter email';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please enter a valid email address';
  }

  // Password
  if (!password) {
    errors.password = 'Please enter password';
  } else {
    const failed = getPasswordChecks(password).filter((c) => !c.ok);
    if (failed.length > 0) {
      errors.password = 'Password does not meet all requirements';
    }
  }

  // Confirm password
  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

const RegisterScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [passwordFocused, setPasswordFocused] = useState(false);

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

  const passwordChecks = getPasswordChecks(password);

  // Re-validate a single field when user leaves it
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const allErrors = validateForm({
      userName,
      mobileNumber,
      email,
      password,
      confirmPassword,
    });
    setErrors((prev) => ({ ...prev, [field]: allErrors[field] }));
  };

  // Clear a field's error as soon as the user starts fixing it
  const clearError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ==========================================
  // REGISTER + BIOMETRIC SETUP
  // ==========================================
  const handleRegister = async () => {
    const validationErrors = validateForm({
      userName,
      mobileNumber,
      email,
      password,
      confirmPassword,
    });

    setErrors(validationErrors);
    setTouched({
      userName: true,
      mobileNumber: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const firstError = Object.values(validationErrors).find(Boolean);
    if (firstError) {
      Alert.alert('Please fix the errors', firstError);
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

      // Agar user ne biometric checkbox tick kiya hai aur customer_id mila hai
      if (sensorAvailable && enableBiometric && data.customer_id) {
        try {
          // Purani keys ho toh delete karke fresh keys banayein
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.mainCard}>
          {/* ================= WHITE TOP SECTION ================= */}
          <View style={styles.topSection}>
            <Image
              source={require('../assets/images/capture.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* ================= PURPLE BOTTOM SECTION ================= */}
          <View style={styles.bottomSection}>
            {/* ================= SIGN UP CARD ================= */}
            <View style={styles.registerCard}>
              <Text style={styles.registerTitle}>Sign Up</Text>

              {/* User Name */}
              <TextInput
                style={[
                  styles.input,
                  touched.userName && errors.userName && styles.inputError,
                ]}
                value={userName}
                onChangeText={(t) => {
                  setUserName(t);
                  clearError('userName');
                }}
                onBlur={() => handleBlur('userName')}
                placeholder="User Name"
                placeholderTextColor="#555"
                autoCapitalize="words"
                maxLength={50}
              />
              {touched.userName && errors.userName && (
                <Text style={styles.errorText}>{errors.userName}</Text>
              )}

              {/* Password */}
              <View
                style={[
                  styles.passwordContainer,
                  touched.password && errors.password && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    clearError('password');
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => {
                    setPasswordFocused(false);
                    handleBlur('password');
                  }}
                  placeholder="Password"
                  placeholderTextColor="#777"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
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

              {/* Live password requirements */}
              {(passwordFocused || (touched.password && errors.password)) && (
                <View style={styles.passwordRules}>
                  {passwordChecks.map((rule) => (
                    <View key={rule.key} style={styles.ruleRow}>
                      <Feather
                        name={rule.ok ? 'check-circle' : 'circle'}
                        size={13}
                        color={rule.ok ? '#2E9E5B' : '#999'}
                      />
                      <Text
                        style={[styles.ruleText, rule.ok && styles.ruleTextOk]}
                      >
                        {rule.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Confirm Password */}
              <View
                style={[
                  styles.passwordContainer,
                  touched.confirmPassword &&
                    errors.confirmPassword &&
                    styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    clearError('confirmPassword');
                  }}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Confirm Password"
                  placeholderTextColor="#777"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
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
              {touched.confirmPassword && errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}

              {/* Email */}
              <TextInput
                style={[
                  styles.input,
                  touched.email && errors.email && styles.inputError,
                ]}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  clearError('email');
                }}
                onBlur={() => handleBlur('email')}
                placeholder="Email ID"
                placeholderTextColor="#555"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {touched.email && errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}

              {/* Mobile Number */}
              <TextInput
                style={[
                  styles.input,
                  touched.mobileNumber &&
                    errors.mobileNumber &&
                    styles.inputError,
                ]}
                value={mobileNumber}
                onChangeText={(t) => {
                  // Allow digits only
                  setMobileNumber(t.replace(/[^0-9]/g, ''));
                  clearError('mobileNumber');
                }}
                onBlur={() => handleBlur('mobileNumber')}
                placeholder="Mobile Number"
                placeholderTextColor="#555"
                keyboardType="phone-pad"
                maxLength={10}
              />
              {touched.mobileNumber && errors.mobileNumber && (
                <Text style={styles.errorText}>{errors.mobileNumber}</Text>
              )}

              {/* Enable Biometric Option (Agar device support karta hai) */}
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

            {/* Back to Login */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Already Registered?</Text>
              <TouchableOpacity
                style={styles.loginLinkButton}
                onPress={() => navigation.replace('Login')}
              >
                <Text style={styles.loginLinkButtonText}>Login</Text>
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

export default RegisterScreen;

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
    paddingBottom: 40,
  },

  mainCard: {
    width: '94%',
    maxWidth: 700,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 25,
    elevation: 10,
  },

  /* ================= TOP WHITE ================= */
  topSection: {
    height: 320,
    backgroundColor: '#FFFFFF',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
  },

  logo: {
    width: 280,
    height: 90,
  },

  /* ================= PURPLE ================= */
  bottomSection: {
    backgroundColor: '#55327A',
    alignItems: 'center',
    paddingBottom: 24,
  },

  /* ================= REGISTER CARD ================= */
  registerCard: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    marginTop: -145,
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

  /* ================= INPUT ================= */
  input: {
    height: 44,
    backgroundColor: '#F4F5F6',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#222222',
    marginBottom: 14,
  },

  /* ================= PASSWORD ================= */
  passwordContainer: {
    height: 44,
    backgroundColor: '#F4F5F6',
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

  /* ================= VALIDATION ================= */
  inputError: {
    borderWidth: 1,
    borderColor: '#D93025',
  },

  errorText: {
    color: '#D93025',
    fontSize: 12,
    marginTop: -9,
    marginBottom: 12,
    marginLeft: 4,
  },

  passwordRules: {
    backgroundColor: '#F9F7FC',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: -6,
    marginBottom: 14,
  },

  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },

  ruleText: {
    fontSize: 12,
    color: '#777',
  },

  ruleTextOk: {
    color: '#2E9E5B',
  },

  /* ================= BIOMETRIC CHECKBOX ================= */
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

  /* ================= SIGN UP BUTTON ================= */
  signupButton: {
    height: 50,
    backgroundColor: '#56327A',
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

  /* ================= ALREADY REGISTERED ================= */
  loginLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 12,
  },

  loginLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  loginLinkButton: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 5,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },

  loginLinkButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  /* ================= POWERED ================= */
  poweredText: {
    marginTop: 24,
    color: '#B5A5C7',
    fontSize: 14,
    fontWeight: '500',
  },
});