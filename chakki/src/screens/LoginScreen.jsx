import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { loginUser } from '../services/AuthService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Loading state
  const [loading, setLoading] = useState(false);

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

      console.log('LOGIN REQUEST:', {
        email: email.trim(),
      });

      // Call Flask API
      const data = await loginUser(
        email,
        password
      );

      console.log('Logged in user:', data);

      // ✅ ADD THIS: Save customer_id to local storage securely
      if (data.customer_id) {
        await AsyncStorage.setItem('customer_id', String(data.customer_id));
      }

      // Login successful
      Alert.alert(
        'Success',
        data.message || 'Login successful',
        [
          {
            text: 'OK',

            onPress: () => {

              navigation.replace('Main');

            },
          },
        ]
      );



    } catch (error) {

      console.log(
        'LOGIN ERROR:',
        error
      );

      Alert.alert(
        'Login Failed',
        error.message || 'Unable to login'
      );


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

              <Text style={styles.loginTitle}>
                Login
              </Text>

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

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotContainer}
                onPress={() => navigation.navigate('Forgotpassword')}
              >
                <Text style={styles.forgotText}>
                  Forgot Password ?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
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

            </View>

            {/* Register */}
            <View style={styles.registerContainer}>

              <Text style={styles.registerText}>
                Not Registered?
              </Text>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.registerButtonText}>
                  Register
                </Text>
              </TouchableOpacity>

            </View>

            {/* Powered By */}
            <Text style={styles.poweredText}>
              Powered by EVOLUZN
            </Text>

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
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 25,
    elevation: 10,
  },

  /*
   * WHITE TOP SECTION
   */
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

  /*
   * PURPLE SECTION
   */
  bottomSection: {
    flex: 1,
    minHeight: 300,
    backgroundColor: '#55327A',

    alignItems: 'center',
    position: 'relative',

    paddingTop: 0,
  },

  /*
   * LOGIN CARD
   */
  loginCard: {
    width: '90%',
    maxWidth: 320,

    backgroundColor: '#FFFFFF',

    borderRadius: 20,

    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,

    marginTop: -245,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },

  loginTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: '#111111',
    textAlign: 'center',

    marginBottom: 26,
  },

  /*
   * EMAIL INPUT
   */
  input: {
    height: 50,

    backgroundColor: '#E9E9E9',

    borderRadius: 8,

    paddingHorizontal: 14,

    fontSize: 14,

    color: '#222222',

    marginBottom: 16,
  },

  /*
   * PASSWORD
   */
  passwordContainer: {
    height: 50,

    backgroundColor: '#E9E9E9',

    borderRadius: 8,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 14,

    marginBottom: 18,
  },

  passwordInput: {
    flex: 1,

    fontSize: 14,

    color: '#222222',

    paddingVertical: 0,
  },

  /*
   * FORGOT PASSWORD
   */
  forgotContainer: {
    alignItems: 'flex-end',

    marginBottom: 28,
  },

  forgotText: {
    color: '#673B8B',

    fontSize: 14,

    fontWeight: '400',
  },

  /*
   * LOGIN BUTTON
   */
  loginButton: {
    height: 51,

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

  /*
   * REGISTER
   */
  registerContainer: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: 48,

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

  /*
   * POWERED BY
   */
  poweredText: {
    position: 'absolute',

    bottom: 8,

    color: '#B5A5C7',

    fontSize: 14,

    fontWeight: '500',
  },
});