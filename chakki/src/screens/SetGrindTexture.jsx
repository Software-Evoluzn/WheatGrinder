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

const SetGrindTexture = ({ navigation, route }) => {
  // Navigation params se grain option fetch karein (Fallback 'WHEAT')
  const selectedGrain = route?.params?.grainName || 'WHEAT';

  // Texture level state (Range: 0 to 100, default: 50)
  const [textureLevel, setTextureLevel] = useState(50);

  // Dynamic texture label based on level
  const getTextureLabel = () => {
    if (textureLevel <= 30) return 'FINE';
    if (textureLevel <= 70) return 'MEDIUM';
    return 'COARSE';
  };

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  // Minus button handler
  const handleDecrease = () => {
    setTextureLevel((prev) => Math.max(0, prev - 10));
  };

  // Plus button handler
  const handleIncrease = () => {
    setTextureLevel((prev) => Math.min(100, prev + 10));
  };

  // SET button handler - Navigates to Milling Control screen
  const handleSet = () => {
    navigation.navigate('MillingControlScreen', {
      grainName: selectedGrain,
      texture: getTextureLabel(),
      textureValue: textureLevel,
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
              TEXTURE : <Text style={styles.textureValue}>{getTextureLabel()}</Text>
            </Text>
          </View>

          {/* Logo Container */}
          {/* <View style={styles.logoContainer}>
            <Image
              source={require('./assets/logo.png')} // Update path to your logo
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View> */}
        </View>

        {/* MAIN BODY / TEXTURE CONTROLS */}
        <View style={styles.mainContent}>
          <Text style={styles.sectionTitle}>Grinding Texture</Text>

          {/* ADJUSTMENT ROW */}
          <View style={styles.adjustmentRow}>
            {/* MINUS / FINE BUTTON */}
            <View style={styles.controlGroup}>
              <TouchableOpacity
                style={styles.circleButton}
                onPress={handleDecrease}
                activeOpacity={0.7}
              >
                <Feather name="minus" size={28} color="#2C2C2E" />
              </TouchableOpacity>
              <Text style={styles.levelLabel}>FINE</Text>
            </View>

            {/* PROGRESS BAR TRACK */}
            <View style={styles.progressTrackContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${textureLevel}%` },
                  ]}
                />
              </View>
            </View>

            {/* PLUS / COARSE BUTTON */}
            <View style={styles.controlGroup}>
              <TouchableOpacity
                style={styles.circleButton}
                onPress={handleIncrease}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={28} color="#2C2C2E" />
              </TouchableOpacity>
              <Text style={styles.levelLabel}>COARSE</Text>
            </View>
          </View>

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

export default SetGrindTexture;

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
  textureValue: {
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
    marginBottom: 30,
  },

  /* ADJUSTMENT ROW */
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 40,
    gap: 12,
  },
  controlGroup: {
    alignItems: 'center',
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
  levelLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#374151',
    marginTop: 10,
    letterSpacing: 1,
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
    backgroundColor: '#10B981', // Emerald green to blue bar fill
    borderRadius: 16,
  },

  /* PRESS SET BUTTON */
  setButton: {
    backgroundColor: '#10B981', // Solid Green Action Button
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