import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  StatusBar,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';

const AUTO_ADVANCE_MS = 3000;
const { height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      goNext();
    }, AUTO_ADVANCE_MS);

    return () => clearTimeout(timer);
  }, []);

  const goNext = () => {
    if (!navigation) return;
    if (typeof navigation.replace === 'function') {
      navigation.replace('Login');
    } else if (typeof navigation.navigate === 'function') {
      navigation.navigate('Login');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={goNext}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

        {/* Top Half: Premium Light Section */}
        <View style={styles.topSection}>
          <SafeAreaView style={styles.safeAreaTop}>
            <Animated.View
              style={[
                styles.brandContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: translateYAnim }],
                },
              ]}
            >
              <Image
                source={require('../assets/images/Softel Millet mill logo 2.png')}
                style={styles.millLogo}
                resizeMode="contain"
              />
              <Text style={styles.byText}>by</Text>
            </Animated.View>
          </SafeAreaView>
        </View>

        {/* Bottom Half: Dark Executive Section */}
        <View style={styles.bottomSection}>
          {/* Overlapping Card */}
          <Animated.View
            style={[
              styles.floatingCardContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateYAnim }],
              },
            ]}
          >
            <View style={styles.rasoiCard}>
              <Image
                source={require('../assets/images/capture.png')}
                style={styles.rasoiLogo}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Bottom Content Area */}
          <SafeAreaView style={styles.safeAreaBottom}>
            <Animated.View
              style={[styles.bottomContent, { opacity: fadeAnim }]}
            >
              <View style={styles.welcomeWrapper}>
                <Text style={styles.welcomeText}>Welcome Annapurna !</Text>
                <View style={styles.accentDivider} />
              </View>

              <View style={styles.footerContainer}>
                <Text style={styles.poweredLabel}>POWERED BY</Text>
                <Text style={styles.companyText}>EVOLUZN</Text>
              </View>
            </Animated.View>
          </SafeAreaView>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  /* TOP SECTION */
  topSection: {
    height: height * 0.52,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
  },
  safeAreaTop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  millLogo: {
    width: 270,
    height: 160,
  },
  byText: {
    fontSize: 20,
    fontStyle: 'italic',
    fontWeight: '400',
    color: '#666666',
    marginTop: 14,
    letterSpacing: 0.5,
  },

  /* BOTTOM SECTION */
  bottomSection: {
    flex: 1,
    backgroundColor: '#55327A', // Deep Indigo / Dark Purple
    alignItems: 'center',
  },

  /* FLOATING LOGO CARD */
  floatingCardContainer: {
    position: 'absolute',
    top: -46,
    zIndex: 10,
    width: '100%',
    alignItems: 'center',
  },
  rasoiCard: {
    width: '82%',
    maxWidth: 340,
    height: 92,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,

    // Android Shadow
    elevation: 10,

    // iOS Shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  rasoiLogo: {
    width: '100%',
    height: '100%',
  },

  /* BOTTOM CONTENT & FOOTER */
  safeAreaBottom: {
    flex: 1,
    width: '100%',
  },
  bottomContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 78,
    paddingBottom: 28,
  },
  welcomeWrapper: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  accentDivider: {
    width: 36,
    height: 3,
    backgroundColor: '#8E7CB5',
    borderRadius: 2,
    marginTop: 12,
    opacity: 0.8,
  },

  footerContainer: {
    alignItems: 'center',
  },
  poweredLabel: {
    color: '#A295C4',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
  },
  companyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 3,
  },
});