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

const PauseScreen = ({ navigation }) => {
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

  // Option 1: Automatic Navigation after pause sequence finishes (e.g., 3 seconds)
  /*
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('MillingControlScreen'); // Replace with your target screen
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);
  */

  // Interpolate degrees for rotation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Action on pressing CANCEL
  const handleCancel = () => {
    if (navigation?.navigate) {
      navigation.navigate('HighTemperatureScreen');
    }
  };
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
              source={require('./assets/logo.png')} // Update path to your logo asset
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View> */}
        </View>

        {/* MAIN CENTER CONTENT */}
        <View style={styles.centerSection}>
          {/* ANIMATED LOADER ICON */}
          <Animated.View
            style={[
              styles.loaderContainer,
              { transform: [{ rotate: spin }] },
            ]}
          >
            <Feather name="loader" size={72} color="#5B8DEF" />
          </Animated.View>

          {/* STATUS TITLE */}
          <Text style={styles.pauseText}>PAUSE in Progress</Text>

          {/* CANCEL BUTTON */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </TouchableOpacity>
        </View>

        {/* BOTTOM BALANCING SPACER */}
        <View style={styles.footerSpacer} />
      </View>
    </SafeAreaView>
  );
};

export default PauseScreen;

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
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  pauseText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D3748',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 36,
  },

  /* CANCEL BUTTON */
  cancelButton: {
    backgroundColor: '#FF4D4D',
    paddingVertical: 14,
    paddingHorizontal: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  /* FOOTER SPACER */
  footerSpacer: {
    height: 40,
  },
});