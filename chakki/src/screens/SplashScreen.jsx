import React, { useEffect } from 'react';
import {
  View,
  Image,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [navigation]);

  return (
    <View style={styles.container}>

      {/* White Top Section */}
      <View style={styles.topSection}>
        <Image
          source={require('../assets/images/capture.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Purple Bottom Section */}
      <View style={styles.bottomSection}>

        <View style={styles.content}>

          <Text style={styles.tagline}>
            Welcome back
          </Text>

          <ActivityIndicator
            size="large"
            color="#FFFFFF"
            style={styles.loader}
          />

        </View>

      </View>

      {/* Powered By - Overall Screen Bottom */}
      <View style={styles.poweredContainer}>
        <Text style={styles.poweredText}>
          Powered by EVOLUZN
        </Text>
      </View>

    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#55327A',
  },

  /* WHITE TOP */
  topSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: 280,
    height: 100,
  },

  /* PURPLE BOTTOM */
  bottomSection: {
    flex: 1,
    backgroundColor: '#55327A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    alignItems: 'center',
    marginTop: -20,
  },

  tagline: {
    fontSize: 15,
    color: '#E0D6E8',
    marginTop: 8,
  },

  loader: {
    marginTop: 40,
  },

  /* POWERED BY */
  poweredContainer: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  poweredText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});