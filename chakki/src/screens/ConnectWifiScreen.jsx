import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';

const ConnectWifiScreen = ({ navigation }) => {
  const [isWifiEnabled, setIsWifiEnabled] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const toggleSwitch = () => {
    const toValue = isWifiEnabled ? 0 : 1;
    
    Animated.timing(animatedValue, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();

    setIsWifiEnabled(!isWifiEnabled);
  };

  const handleNext = () => {
    if (navigation?.navigate) {
      navigation.navigate('CleaningProcessScreen');
    }
  };

  // Interpolations for custom switch animation
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 52], // Translates thumb inside track
  });

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#8E8E93', '#0A8F44'], // Gray to Green
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>

        {/* Top Header Logo
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

          {/* Title Prompt */}
          <Text style={styles.instructionText}>
            Please connect to WiFi
          </Text>

          {/* Custom Large Rounded Switch */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={toggleSwitch}
            >
              <Animated.View style={[styles.customSwitchTrack, { backgroundColor: trackColor }]}>
                <Animated.View
                  style={[
                    styles.customSwitchThumb,
                    { transform: [{ translateX }] },
                  ]}
                />
              </Animated.View>
            </TouchableOpacity>

            {/* Switch Labels */}
            <View style={styles.labelRow}>
              <Text style={[styles.switchLabel, !isWifiEnabled && styles.activeLabel]}>
                NO
              </Text>
              <Text style={[styles.switchLabel, isWifiEnabled && styles.activeLabel]}>
                YES
              </Text>
            </View>
          </View>

          {/* Green Action Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>NEXT</Text>
            <Text style={styles.arrowIcon}>➔</Text>
          </TouchableOpacity>

        </View>

      </View>
    </SafeAreaView>
  );
};

export default ConnectWifiScreen;

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
    paddingBottom: 40,
  },

  /* TYPOGRAPHY */
  instructionText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: 40,
  },

  /* CUSTOM LARGE ROUNDED SWITCH */
  toggleContainer: {
    alignItems: 'center',
    marginBottom: 44,
  },
  customSwitchTrack: {
    width: 104,
    height: 54,
    borderRadius: 27, // Fully rounded pill shape
    justifyContent: 'center',
    padding: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  customSwitchThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 100,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B0B0B0',
    letterSpacing: 1,
  },
  activeLabel: {
    color: '#2C2C2C',
  },

  /* BUTTON */
  button: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 200,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0A8F44', // Action Green
    justifyContent: 'center',
    alignItems: 'center',

    // Elevation Shadow
    elevation: 4,
    shadowColor: '#0A8F44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginRight: 8,
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});