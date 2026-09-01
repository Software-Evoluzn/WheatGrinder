import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const WaitScreen = ({ navigation }) => {
  // Animation reference for the continuous rotation
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Infinite rotation animation loop
    const startRotation = () => {
      spinValue.setValue(0);
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    startRotation();
  }, [spinValue]);

  // Option 1: Automatic Navigation after processing delay (e.g., 4 seconds)
  /*
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('MillingControlScreen'); // Replace with your target screen
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigation]);
  */

  // Option 2: Direct touch action handler
  const handleNavigate = () => {
    if (navigation?.navigate) {
      // Replace 'MillingControlScreen' with your intended target screen name
      navigation.navigate('PauseScreen');
    }
  };

  // Interpolate degrees for rotation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* TOP HEADER / LOGO SECTION */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }} />

          {/* Logo Container */}
          {/* <View style={styles.logoContainer}>
            <Image
              source={require('./assets/logo.png')} // Update path to your Softel logo asset
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View> */}
        </View>

        {/* MAIN CENTER CONTENT (TAP TO NAVIGATE) */}
        <TouchableOpacity
          style={styles.centerSection}
          activeOpacity={0.85}
          onPress={handleNavigate}
        >
          {/* TITLE TEXT */}
          <Text style={styles.waitText}>PLEASE WAIT</Text>

          {/* ANIMATED LOADER ICON */}
          <Animated.View
            style={[
              styles.loaderContainer,
              { transform: [{ rotate: spin }] },
            ]}
          >
            <Feather name="loader" size={76} color="#5B8DEF" />
          </Animated.View>

          {/* SUBTEXT INDICATOR */}
          <Text style={styles.tapToContinueText}>Tap to Continue</Text>
        </TouchableOpacity>

        {/* BOTTOM BALANCING SPACER */}
        <View style={styles.footerSpacer} />
      </View>
    </SafeAreaView>
  );
};

export default WaitScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },

  /* HEADER */
  headerRow: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  logoContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 60,
    height: 60,
  },

  /* CENTER CONTENT */
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  waitText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D3748',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 28,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapToContinueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B8DEF',
    marginTop: 28,
    letterSpacing: 1,
  },

  /* FOOTER SPACER */
  footerSpacer: {
    height: 40,
  },
});