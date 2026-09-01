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

const MachineOverloadScreen = ({ navigation }) => {
  // Option 1: Automatic Navigation after machine cool-down/delay (e.g., 5 seconds)
  /*
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('WaitScreen'); // Replace with your target screen
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigation]);
  */

  // Option 2: Tap-to-navigate action handler
  const handleNavigate = () => {
    if (navigation?.navigate) {
      // Replace 'WaitScreen' with your target screen name (e.g., 'WaitScreen', 'PauseScreen', etc.)
      navigation.navigate('WaitScreen'); 
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

        {/* MAIN CENTER CONTENT (TAP TO NAVIGATE) */}
        <TouchableOpacity
          style={styles.centerSection}
          activeOpacity={0.85}
          onPress={handleNavigate}
        >
          {/* WARNING TRIANGLE ICON */}
          <View style={styles.iconContainer}>
            <Feather name="alert-triangle" size={80} color="#E55335" />
          </View>

          {/* OVERLOAD WARNING TEXT */}
          <Text style={styles.warningText}>
            MACHINE OVER LOAD , PLEASE WAIT !
          </Text>

          {/* SUBTEXT INDICATOR */}
          <Text style={styles.tapToContinueText}>Tap to Continue</Text>
        </TouchableOpacity>

        {/* BOTTOM BALANCING SPACER */}
        <View style={styles.footerSpacer} />
      </View>
    </SafeAreaView>
  );
};

export default MachineOverloadScreen;

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
  iconContainer: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333333',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 32,
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