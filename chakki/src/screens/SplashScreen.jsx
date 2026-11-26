import React, { useEffect } from 'react';
import {
  View,
  Image,
  Text,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from './ui';
import { colors, spacing } from './theme';

const SOFTEL_LOGO = require('../assets/images/Softel Millet mill logo 2.png');
const RASOI_LOGO = require('../assets/images/capture12.png');

const SplashScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();

  useEffect(() => {
    const timer = setTimeout(() => {
      // NOTE: route name kept exactly as the navigator defines it.
      navigation.replace('WelomeScreen');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const taglineFontSize = Math.round(Math.min(Math.max(width * 0.085, 24), 36));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* White top section — Softel logo above Rasoi Shop logo with "by" in between */}
      <SafeAreaView style={styles.topSection} edges={['top', 'left', 'right']}>
        <Image
          source={SOFTEL_LOGO}
          style={styles.millLogo}
          resizeMode="contain"
        />
        <Text style={styles.byText}>by</Text>
        <View style={styles.rasoiLogoWrap}>
          <BrandLogo source={RASOI_LOGO} ratio={320 / 60} variant="splash" />
        </View>
      </SafeAreaView>

      {/* Purple bottom section */}
      <View style={styles.bottomSection}>
        <View style={styles.content}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.tagline, { fontSize: taglineFontSize }]}
          >
            Welcome back
          </Text>
          <ActivityIndicator size="large" color={colors.textOnPrimary} style={styles.loader} />
        </View>
      </View>
    </View>
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
    paddingHorizontal: spacing.xl,
  },
  millLogo: {
    width: 245,
    height: 92,
    marginBottom: 10,
  },
  byText: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '400',
    color: '#666666',
    marginVertical: 3,
    letterSpacing: 0.4,
  },
  rasoiLogoWrap: {
    transform: [{ scale: 0.9 }],
  },
  logo: { width: '72%', maxWidth: 300, height: 110 },

  bottomSection: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    width: '92%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    fontWeight: '700',
    color: '#E0D6E8',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  loader: { marginTop: spacing.huge },
});