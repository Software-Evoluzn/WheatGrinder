// =============================================================================
//  SplashScreen
// -----------------------------------------------------------------------------
//  MERGED (Developer 1 + Developer 2):
//    Both versions are the SAME screen — white top (logo) + purple bottom
//    (tagline + loader) + "Powered by EVOLUZN" footer — and share identical
//    behaviour: 3s timer -> navigation.replace('WelomeScreen'), and the same
//    logo asset require('../assets/images/capture.png').
//
//    • Developer 2 = original, self-contained (raw <Image>, hardcoded hex,
//      fixed 280x100 logo, absolute-positioned footer text).
//    • Developer 1 = same screen refactored onto the shared UI kit (BrandLogo,
//      AppFooter, SafeAreaView, StatusBar, theme tokens).
//
//    Developer 1's version is kept because it integrates with the merged
//    ui.js + theme.js. No Developer-2 behaviour is lost (route name, 3s timer,
//    logo asset, layout, tagline, loader colour, brand footer all preserved).
//
//    LOGO NOTE: require() path + asset are UNCHANGED. On-screen sizing now comes
//    from BrandLogo's responsive "splash" variant instead of Developer 2's fixed
//    280x100. To restore the exact original dimensions, replace <BrandLogo .../>
//    with Developer 2's <Image ... style={styles.logo} /> (styles.logo kept below).
// =============================================================================
import React, { useEffect } from 'react';
import {
  View,
  Image,
  Text,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, BrandLogo } from './ui';
import { colors, spacing } from './theme';

const RASOI_LOGO = require('../assets/images/capture.png');

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      // NOTE: route name kept exactly as the navigator defines it.
      navigation.replace('WelomeScreen');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
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
          <ActivityIndicator size="large" color={colors.textOnPrimary} style={styles.loader} />
        </View>

        {/* Branded footer — safe-area aware, sits above the Android nav bar */}
        <AppFooter variant="onDark" row />
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
  },
  // Kept from Developer 2 in case you want the fixed-size <Image> back
  // (unused while BrandLogo handles sizing).
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