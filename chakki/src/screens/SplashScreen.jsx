import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppFooter, BrandLogo } from './ui';
import { colors, spacing } from './theme';

const RASOI_LOGO = require('../assets/images/capture.png');
const AUTO_ADVANCE_MS = 3000;

const SplashScreen = ({ navigation }) => {
  // Prevents double navigation if both timer and tap fire
  const hasNavigated = useRef(false);

  const goNext = async () => {
    if (!navigation || hasNavigated.current) return;
    hasNavigated.current = true;

    try {
      // Check if auto-login is enabled and customer_id is stored
      const autoLogin = await AsyncStorage.getItem('auto_login');
      const customerId = await AsyncStorage.getItem('customer_id');

      if (autoLogin === 'true' && customerId) {
        // Skip Login screen and go directly to Main
        navigation.replace('Main', { customer_id: Number(customerId) });
        return;
      }
    } catch (error) {
      console.log('AUTO LOGIN CHECK ERROR:', error);
    }

    // Auto-login is off (or an error occurred) -> navigate to Login
    if (typeof navigation.replace === 'function') {
      navigation.replace('Login');
    } else if (typeof navigation.navigate === 'function') {
      navigation.navigate('Login');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      goNext();
    }, AUTO_ADVANCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TouchableWithoutFeedback onPress={goNext}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

        {/* White top section — safe area so the logo never hides under the status bar */}
        <SafeAreaView style={styles.topSection} edges={['top', 'left', 'right']}>
          <BrandLogo source={RASOI_LOGO} ratio={320 / 86} variant="splash" />
        </SafeAreaView>

        {/* Purple bottom section */}
        <View style={styles.bottomSection}>
          <View style={styles.content}>
            <Text style={styles.tagline}>Welcome back</Text>
            <ActivityIndicator
              size="large"
              color={colors.textOnPrimary}
              style={styles.loader}
            />
          </View>

          {/* Branded footer — safe-area aware, sits above the Android nav bar */}
          <AppFooter variant="onDark" row />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },

  topSection: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: { width: '72%', maxWidth: 300, height: 110 },

  bottomSection: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tagline: { fontSize: 15, color: '#E0D6E8', marginTop: spacing.sm },
  loader: { marginTop: spacing.huge },
});