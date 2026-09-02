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

const API_BASE_URL = IP_CONFIG.BASE_URL;

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading , setLoading] = useState(false);

  const handleSendResetLink = async () => {
    console.log('Reset link requested for:', email);

    if(!email.trim()){
        Alert.alert('Error','Please enter your registered email address');
        return;
    }
    setLoading(true);

    try{

        const response =  await fetch(`${API_BASE_URL}/forgot-password`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json',

            },
            body: JSON.stringify({email:email.trim()}),

        });

        const data = await response.json();

        if(response.ok){
            Alert.alert('Success',data.message || 'OTP sent to your email');
            
            if(navigation?.navigate){
                navigation.navigate('VerifyOtpScreen',{email:email.trim()});
            }


        }else{
            Alert.alert('Error', data.error || 'Failed to send OTP.');
        }

    }catch(error){

        console.error('API Error:', error);
        Alert.alert('Error', 'Unable to connect to server. Please try again.');

    }finally{
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
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.mainContainer}>
          {/* TOP SECTION WITH LOGO */}
          <View style={styles.topSection}>
            <View style={styles.logoContainer}>
              {/* Replace with your logo image asset */}
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
                placeholderTextColor="#A0AEC0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSendResetLink}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>Send Reset Link</Text>
            </TouchableOpacity>
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
    backgroundColor: '#492971', // Deep purple matching UI mockup
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 130, // Space below floating card
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
    top: '30%',
    left: '8%',
    right: '8%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
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
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#7C7C7C',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },

  /* EMAIL INPUT BOX */
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  emailInput: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F1F3F6',
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },

  /* SUBMIT BUTTON */
  submitButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#492971',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});