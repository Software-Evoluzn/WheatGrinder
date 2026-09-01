import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';

const SelfCleaningScreen = ({ navigation }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleNext = () => {
    if (navigation?.navigate) {
      navigation.navigate('ResumeGrinding');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        
        {/* Header Branding
        <View style={styles.header}>
          <View />
          <Image
            source={require('../assets/images/Softel Millet mill logo 2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View> */}

        {/* Center Content Section */}
        <View style={styles.centerSection}>
          
          {/* Animated Spinner Ring */}
          <View style={styles.spinnerWrapper}>
            <Animated.View style={[styles.spinnerRing, { transform: [{ rotate: spin }] }]} />
            <View style={styles.innerIconCircle}>
              <Text style={styles.cleaningIcon}>🧹</Text>
            </View>
          </View>

          {/* Clean Light Typography */}
          <Text style={styles.greetingText}>HELLO!</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusTitle}>Please Wait...</Text>
            <Text style={styles.waveEmoji}>👋</Text>
          </View>
          
          <Text style={styles.statusSubtitle}>Self-cleaning in progress.</Text>
          
          {/* Action Button shifted closer */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>NEXT</Text>
          </TouchableOpacity>

        </View>

      </View>
    </SafeAreaView>
  );
};

export default SelfCleaningScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  logo: {
    width: 130,
    height: 60,
  },

  /* CENTER SECTION */
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40, // Keeps the content comfortably centered
  },

  /* PROGRESS SPINNER */
  spinnerWrapper: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  spinnerRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3.5,
    borderColor: '#6C4AB6',
    borderTopColor: '#E2D8F3',
  },
  innerIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5F0BB', // Light subtle background for icon
    justifyContent: 'center',
    alignItems: 'center',
  },
  cleaningIcon: {
    fontSize: 32,
  },

  /* TYPOGRAPHY */
  greetingText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#8174A0',
    letterSpacing: 2,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  waveEmoji: {
    fontSize: 24,
    marginLeft: 8,
  },
  statusSubtitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: 36, // Space before the button
  },

  /* BUTTON */
  button: {
    width: '100%',
    maxWidth: 240,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#55327A', // Primary Purple Brand Accent
    justifyContent: 'center',
    alignItems: 'center',

    // Soft Shadow for Light Theme
    elevation: 4,
    shadowColor: '#55327A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});