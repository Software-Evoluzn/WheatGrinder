import React from 'react';
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

const RemoveMaterialFromHopperScreen = ({ navigation }) => {
  const handleContinue = () => {
    if (navigation?.goBack) {
      navigation.goBack();
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
          {/* WARNING TRIANGLE ICON */}
          <View style={styles.iconContainer}>
            <Feather name="alert-triangle" size={80} color="#E55335" />
          </View>

          {/* ACTION REQUIRED TEXT */}
          <Text style={styles.warningText}>
            Action Required: Clear the hopper immediately
          </Text>

          {/* CONTINUE BUTTON */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>

        {/* BOTTOM BALANCING SPACER */}
        <View style={styles.footerSpacer} />
      </View>
    </SafeAreaView>
  );
};

export default RemoveMaterialFromHopperScreen;

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
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D3748',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 32,
    marginBottom: 36,
    maxWidth: 520,
  },

  /* CONTINUE BUTTON */
  continueButton: {
    backgroundColor: '#52C41A', // Bright green accent matching your image design
    paddingVertical: 12,
    paddingHorizontal: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#52C41A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },

  /* FOOTER SPACER */
  footerSpacer: {
    height: 40,
  },
});