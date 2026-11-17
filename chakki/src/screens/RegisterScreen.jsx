import React, { useState } from 'react';
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
import { registerUser } from '../services/AuthService';

const RegisterScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // ==========================================
  // REGISTER
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

      console.log('REGISTER REQUEST:', {
        name: userName,
        mobile: mobileNumber,
        email: email,
      });

      const data = await registerUser(
        userName,
        mobileNumber,
        email,
        password
      );

      console.log('REGISTER RESPONSE:', data);

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
  /* ================= MAIN ================= */
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 40, // Keyboard khulne par niche extra scroll space
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
    height: 320, // Fixed 500 se kam kiya taaki card overlap clean rahe
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
    marginTop: -145, // Top white section ke upar cleanly overlap karega
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

  /* ================= POWERED ================= */
  poweredText: {
    marginTop: 24, // Absolute hataya taaki scroll mein overlap na kare
    color: '#B5A5C7',
    fontSize: 14,
    fontWeight: '500',
  },
});