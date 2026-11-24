
import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  StatusBar,
  TouchableWithoutFeedback,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppFooter, BrandLogo } from './ui';
import { colors, spacing } from './theme';

const RASOI_LOGO = require('../assets/images/capture.png');

const AUTO_ADVANCE_MS = 3000;

const WelcomeScreen = ({ navigation }) => {
  const { height } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(15)).current;

  // Timer aur tap dono goNext chalate hain, ye double navigation rokta hai
  const hasNavigated = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(translateYAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      goNext();
    }, AUTO_ADVANCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goNext = async () => {
    if (!navigation || hasNavigated.current) return;
    hasNavigated.current = true;

    try {
      // Auto login on tha aur user ka customer_id saved hai?
      const autoLogin = await AsyncStorage.getItem('auto_login');
      const customerId = await AsyncStorage.getItem('customer_id');

      if (autoLogin === 'true' && customerId) {
        // Login screen skip karke seedha Main par jao
        navigation.replace('Main', { customer_id: Number(customerId) });
        return;
      }
    } catch (error) {
      console.log('AUTO LOGIN CHECK ERROR:', error);
    }

    // Auto login off hai (ya error aaya) -> normal Login screen
    if (typeof navigation.replace === 'function') {
      navigation.replace('Login');
    } else if (typeof navigation.navigate === 'function') {
      navigation.navigate('Login');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={goNext}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

        {/* Top Half: Premium Light Section */}
        <View style={[styles.topSection, { height: height * 0.52 }]}>
          <SafeAreaView style={styles.safeAreaTop} edges={['top', 'left', 'right']}>
            <Animated.View
              style={[
                styles.brandContainer,
                { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
              ]}
            >
              {/* Softel logo — require() path + raw <Image> preserved from both devs */}
              <Image
                source={require('../assets/images/Softel Millet mill logo 2.png')}
                style={styles.millLogo}
                resizeMode="contain"
              />
              <Text style={styles.byText}>by</Text>
            </Animated.View>
          </SafeAreaView>
        </View>

        {/* Bottom Half: Dark Executive Section */}
        <View style={styles.bottomSection}>
          {/* Overlapping Card */}
          <Animated.View
            style={[
              styles.floatingCardContainer,
              { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
            ]}
          >
            <View style={styles.rasoiCard}>
              <BrandLogo source={RASOI_LOGO} ratio={320 / 86} variant="card" />
            </View>
          </Animated.View>

          {/* Bottom Content Area */}
          <Animated.View style={[styles.bottomContent, { opacity: fadeAnim }]}>
            <View style={styles.welcomeWrapper}>
              <Text style={styles.welcomeText}>Welcome Annapurna !</Text>
              <View style={styles.accentDivider} />
            </View>

            {/* Branded footer — safe-area aware, sits above the Android nav bar */}
            <AppFooter variant="onDark" row />
          </Animated.View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  /* TOP SECTION */
  topSection: { backgroundColor: '#FAFAFA', alignItems: 'center' },
  safeAreaTop: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  brandContainer: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  // [Developer 1] responsive sizing. [Developer 2] original was { width: 270, height: 160 }.
  millLogo: { width: '80%', maxWidth: 290, height: 160 },
  byText: {
    fontSize: 20,
    fontStyle: 'italic',
    fontWeight: '400',
    color: '#666666',
    marginTop: 14,
    letterSpacing: 0.5,
  },

  /* BOTTOM SECTION */
  bottomSection: { flex: 1, backgroundColor: colors.primary, alignItems: 'center' },

  /* FLOATING LOGO CARD */
  floatingCardContainer: {
    position: 'absolute',
    top: -46,
    zIndex: 10,
    width: '100%',
    alignItems: 'center',
  },
  rasoiCard: {
    width: '86%',
    maxWidth: 380,
    height: 124,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  // Fill ~85% of the card so the brand logo reads large and legible.
  // (Unused while BrandLogo handles sizing; kept for the raw-<Image> fallback.)
  rasoiLogo: { width: '60%', height: '74%' },

  /* BOTTOM CONTENT & FOOTER */
  bottomContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 78,
  },
  welcomeWrapper: { alignItems: 'center' },
  welcomeText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  accentDivider: {
    width: 36,
    height: 3,
    backgroundColor: '#8E7CB5',
    borderRadius: 2,
    marginTop: 12,
    opacity: 0.8,
  },
});