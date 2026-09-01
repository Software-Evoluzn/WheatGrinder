import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const LoadGrainsToStart = ({ navigation, route }) => {
  // Extract route parameters safely with optional chaining & default fallbacks
  const grainName = route?.params?.grainName || 'RICE';
  const texture = route?.params?.texture || 'FINE';
  const amount = route?.params?.amount || '200 Grams Rice';

  const [isStarted, setIsStarted] = useState(false);

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  const handleStartProcess = () => {
    setIsStarted(true);

    // Forward params to the next screen if needed
    setTimeout(() => {
      navigation.navigate('GrainOverScreen', {
        grainName,
        texture,
      });
    }, 500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* TOP HEADER SECTION */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />
        </View>

        {/* MAIN BODY CONTENT */}
        <View style={styles.centerSection}>
          <Text style={styles.mainTitle}>Stone Cleaning Process</Text>

          <Text style={styles.instructionText}>
            ( Load {amount} And Press Start )
          </Text>

          {/* START BUTTON */}
          <TouchableOpacity
            style={[
              styles.startButton,
              isStarted && styles.startButtonPressed,
            ]}
            onPress={handleStartProcess}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.startText, isStarted && styles.startTextPressed]}
            >
              START
            </Text>
            <View
              style={[
                styles.iconContainer,
                isStarted && styles.iconContainerPressed,
              ]}
            >
              <Feather
                name="play"
                size={22}
                color="#FFFFFF"
                style={{ marginLeft: 2 }}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* FOOTER NOTICE */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Machine will stop after stone cleaning !
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoadGrainsToStart;

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
  headerRow: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#5B8DEF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#374151',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 36,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    paddingLeft: 32,
    paddingRight: 10,
    borderRadius: 40,
    minWidth: 220,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  startButtonPressed: {
    borderColor: '#5B8DEF',
    backgroundColor: '#F0F5FF',
  },
  startText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4A5568',
    letterSpacing: 2,
  },
  startTextPressed: {
    color: '#5B8DEF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5B8DEF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  iconContainerPressed: {
    backgroundColor: '#4C7BD9',
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
});