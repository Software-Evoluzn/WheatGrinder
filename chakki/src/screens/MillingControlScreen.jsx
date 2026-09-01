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

const MillingControlScreen = ({ navigation, route }) => {
  // Navigation parameters se selected options (default fallback values added)
  const selectedGrain = route?.params?.grainName || 'WHEAT';
  const selectedTexture = route?.params?.texture || 'FINE';

  // Status state: null (default both gray) | 'START' | 'PAUSE'
  const [processState, setProcessState] = useState(null);

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  const handleToggleStart = () => {
    setProcessState('START');
    
    // Slight delay for active state feedback before navigating
    setTimeout(() => {
      navigation.navigate('LoadGrainToStart', {
        grainName: selectedGrain,
        texture: selectedTexture,
      });
    }, 200);
  };

  const handleTogglePause = () => {
    // Toggles selection for PAUSE state
    setProcessState(prevState => (prevState === 'PAUSE' ? null : 'PAUSE'));
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
              TEXTURE : <Text style={styles.textureValue}>{selectedTexture.toUpperCase()}</Text>
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

        {/* CENTER SECTION - CONTROLS */}
        <View style={styles.centerSection}>
          <View style={styles.controlsRow}>

            {/* START BUTTON CONTROL */}
            <View style={styles.controlItem}>
              <TouchableOpacity
                style={[
                  styles.outerCircle,
                  processState === 'START' ? styles.activeOuterCircle : styles.defaultOuterCircle,
                ]}
                onPress={handleToggleStart}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.innerCircle,
                    processState === 'START' ? styles.activeInnerCircle : styles.defaultInnerCircle,
                  ]}
                >
                  <Feather
                    name="play"
                    size={36}
                    color={processState === 'START' ? '#5B8DEF' : '#718096'}
                    style={{ marginLeft: 4 }} // Slight visual balance for play icon
                  />
                </View>
              </TouchableOpacity>
              <Text
                style={[
                  styles.controlLabel,
                  processState === 'START' && styles.activeControlLabel,
                ]}
              >
                START
              </Text>
            </View>

            {/* PAUSE BUTTON CONTROL */}
            <View style={styles.controlItem}>
              <TouchableOpacity
                style={[
                  styles.outerCircle,
                  processState === 'PAUSE' ? styles.activeOuterCircle : styles.defaultOuterCircle,
                ]}
                onPress={handleTogglePause}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.innerCircle,
                    processState === 'PAUSE' ? styles.activeInnerCircle : styles.defaultInnerCircle,
                  ]}
                >
                  <Feather
                    name="pause"
                    size={36}
                    color={processState === 'PAUSE' ? '#5B8DEF' : '#718096'}
                  />
                </View>
              </TouchableOpacity>
              <Text
                style={[
                  styles.controlLabel,
                  processState === 'PAUSE' && styles.activeControlLabel,
                ]}
              >
                PAUSE
              </Text>
            </View>

          </View>
        </View>

        {/* EMPTY BOTTOM SPACER FOR EQUAL FLEX ALIGNMENT */}
        <View style={{ height: 40 }} />
      </View>
    </SafeAreaView>
  );
};

export default MillingControlScreen;

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

  /* CONTROLS CENTER AREA */
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  controlItem: {
    alignItems: 'center',
  },

  /* CIRCLE STYLES (GRAY DEFAULT vs ACTIVE HIGHLIGHT) */
  outerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultOuterCircle: {
    backgroundColor: '#E2E8F0', // Neutral gray outer ring
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  activeOuterCircle: {
    backgroundColor: '#5B8DEF', // Active blue highlight ring
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  innerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultInnerCircle: {
    backgroundColor: '#F8FAFC',
  },
  activeInnerCircle: {
    backgroundColor: '#FFFFFF',
  },

  /* TEXT LABELS */
  controlLabel: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '800',
    color: '#718096', // Default gray text
    letterSpacing: 1.5,
  },
  activeControlLabel: {
    color: '#5B8DEF', // Active highlight text
  },
});