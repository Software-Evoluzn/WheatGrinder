import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const GrainOverScreen = ({ navigation }) => {
  // Option 1: Automatic navigation after a delay (e.g., 5 seconds)
  /*
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('LoadGrainsToStart'); // Replace with your target screen name
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigation]);
  */

  // Manual navigation handler (e.g., on tap or action)
  const handleNavigateNext = () => {
    if (navigation?.navigate) {
      // Replace 'LoadGrainsToStart' with your target screen name
      navigation.navigate('MachineOverload'); 
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
              source={require('./assets/logo.png')} // Update path to your Softel logo asset
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View> */}
        </View>

        {/* MAIN BODY CONTENT */}
        <TouchableOpacity
          style={styles.centerSection}
          activeOpacity={0.85}
          onPress={handleNavigateNext}
        >
          {/* WARNING ALERT ICON */}
          <View style={styles.alertIconContainer}>
            <Feather name="alert-triangle" size={72} color="#E55335" />
          </View>

          {/* MAIN WARNING TITLE */}
          <Text style={styles.alertTitle}>GRAIN OVER</Text>

          {/* INSTRUCTION SUBTITLE */}
          <Text style={styles.instructionText}>
            ( Load more grain or switch off the machine )
          </Text>

          {/* TAP ACTION INDICATOR */}
          <Text style={styles.tapToContinueText}>Tap to Load Grain</Text>
        </TouchableOpacity>

        {/* BOTTOM BALANCING SPACER */}
        <View style={styles.footerSpacer} />
      </View>
    </SafeAreaView>
  );
};

export default GrainOverScreen;

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

  /* CENTER SECTION */
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  alertIconContainer: {
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D3748',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 30,
  },
  tapToContinueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B8DEF',
    marginTop: 24,
    letterSpacing: 1,
  },

  /* FOOTER SPACER */
  footerSpacer: {
    height: 40,
  },
});