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

const ResumeGrindingScreen = ({ navigation }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Rotation animation for the resume indicator
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleStart = () => {
    if (navigation?.navigate) {
      navigation.navigate('CollectionCloth');
    }
  };

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

        {/* Center Content Area */}
        <View style={styles.centerSection}>

          {/* Animated Resume Icon */}
          <View style={styles.iconWrapper}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <View style={styles.spinRing}>
                <Text style={styles.refreshSymbol}>↻</Text>
              </View>
            </Animated.View>
          </View>

          {/* Status Typography */}
          <Text style={styles.statusTitle}>Please wait</Text>
          <Text style={styles.statusSubtitle}>
            Resuming the previous grinding process
          </Text>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>START</Text>
            <View style={styles.playIconBadge}>
              <Text style={styles.playIconText}>▶</Text>
            </View>
          </TouchableOpacity>

        </View>

      </View>
    </SafeAreaView>
  );
};

export default ResumeGrindingScreen;

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

  /* ICON STYLES */
  iconWrapper: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  spinRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#4A68D9',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshSymbol: {
    fontSize: 42,
    color: '#4A68D9',
    fontWeight: '300',
    marginTop: -4,
  },

  /* TYPOGRAPHY */
  statusTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#555555',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 25,
    marginBottom: 36,
  },

  /* BUTTON */
  button: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 220,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#55327A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 10,

    // Subtle Shadow
    elevation: 4,
    shadowColor: '#55327A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginRight: 12,
  },
  playIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconText: {
    color: '#55327A',
    fontSize: 12,
    marginLeft: 2,
  },
});