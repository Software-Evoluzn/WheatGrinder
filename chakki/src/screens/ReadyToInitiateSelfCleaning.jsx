import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const ReadyToInitiateSelfCleaning = ({ navigation }) => {
  const handleReady = () => {
    if (navigation?.navigate) {
      navigation.navigate('ConnectWifiScreen');
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

        {/* Center Content Section */}
        <View style={styles.centerSection}>

          {/* Self Cleaning Graphic Container */}
          <View style={styles.graphicCard}>
            <Image
              source={require('../assets/images/cleaning_gear.png')} // Replace with your icon image asset path
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Prompt Instruction */}
          <Text style={styles.instructionText}>
            Press <Text style={styles.boldHighlight}>READY</Text> to initiate the self-cleaning process
          </Text>

          {/* Green Action Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleReady}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>READY</Text>
          </TouchableOpacity>

        </View>

      </View>
    </SafeAreaView>
  );
};

export default ReadyToInitiateSelfCleaning;

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

  /* ILLUSTRATION CARD */
  graphicCard: {
    width: 130,
    height: 130,
    borderRadius: 24,
    backgroundColor: '#F7F5FB',
    borderWidth: 1.5,
    borderColor: '#E2D9F3',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginBottom: 32,

    // Soft Elevation
    elevation: 3,
    shadowColor: '#55327A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },

  /* TYPOGRAPHY */
  instructionText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 30,
    marginBottom: 36,
  },
  boldHighlight: {
    fontWeight: '800',
    color: '#0A8F44',
  },

  /* BUTTON */
  button: {
    width: '100%',
    maxWidth: 200,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0A8F44', // Action Green
    justifyContent: 'center',
    alignItems: 'center',

    // Elevation Shadow
    elevation: 4,
    shadowColor: '#0A8F44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});