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

const SetFlowRate = ({ navigation, route }) => {
  // Fetch grain & texture parameters from route (Fallback defaults added)
  const selectedGrain = route?.params?.grainName || 'WHEAT';
  const selectedTexture = route?.params?.texture || 'MEDIUM';

  // Flow Rate percentage state (Default: 50%)
  const [flowRate, setFlowRate] = useState(50);

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  // Decrement handler (Min: 10%)
  const handleDecrease = () => {
    setFlowRate((prev) => Math.max(10, prev - 10));
  };

  // Increment handler (Max: 100%)
  const handleIncrease = () => {
    setFlowRate((prev) => Math.min(100, prev + 10));
  };

  // PRESS SET button handler - Navigates to MillingControlScreen
  const handleSet = () => {
    navigation.navigate('MillingControlScreen', {
      grainName: selectedGrain,
      texture: selectedTexture,
      flowRate: flowRate,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* TOP HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>
              YOU HAVE CHOSEN : {selectedGrain.toUpperCase()}
            </Text>
            <Text style={styles.headerSubtitle}>
              FLOW RATE : <Text style={styles.headerValue}>{flowRate}%</Text>
            </Text>
          </View>

          {/* Logo Container */}
          {/* <View style={styles.logoContainer}>
            <Image
              source={require('./assets/logo.png')} // Update path to your logo asset
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View> */}
        </View>

        {/* MAIN BODY / FLOW RATE CONTROLS */}
        <View style={styles.mainContent}>
          <Text style={styles.sectionTitle}>Grinding Flow Rate</Text>

          {/* ADJUSTMENT ROW */}
          <View style={styles.adjustmentRow}>
            {/* MINUS BUTTON */}
            <TouchableOpacity
              style={styles.circleButton}
              onPress={handleDecrease}
              activeOpacity={0.7}
            >
              <Feather name="minus" size={28} color="#2C2C2E" />
            </TouchableOpacity>

            {/* PROGRESS BAR TRACK */}
            <View style={styles.progressTrackContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${flowRate}%` },
                  ]}
                />
              </View>
            </View>

            {/* PLUS BUTTON */}
            <TouchableOpacity
              style={styles.circleButton}
              onPress={handleIncrease}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={28} color="#2C2C2E" />
            </TouchableOpacity>
          </View>

          {/* PERCENTAGE DISPLAY */}
          <Text style={styles.percentageText}>{flowRate} %</Text>

          {/* PRESS SET BUTTON */}
          <TouchableOpacity
            style={styles.setButton}
            onPress={handleSet}
            activeOpacity={0.85}
          >
            <Text style={styles.setButtonText}>PRESS SET</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SetFlowRate;

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
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C2C2E',
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 4,
    letterSpacing: 1,
  },
  headerValue: {
    color: '#5B8DEF',
    fontWeight: '800',
  },
  logoContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 50,
    height: 50,
  },

  /* MAIN CONTENT */
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 24,
  },

  /* ADJUSTMENT ROW */
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
    gap: 12,
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  /* PROGRESS TRACK */
  progressTrackContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  progressTrack: {
    height: 38,
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
    justifyContent: 'center',
    padding: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981', // Gradient-style fill color
    borderRadius: 16,
  },

  /* PERCENTAGE LABEL */
  percentageText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 32,
  },

  /* PRESS SET BUTTON */
  setButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  setButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});