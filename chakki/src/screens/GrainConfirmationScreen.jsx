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

const GrainConfirmationScreen = ({ navigation, route }) => {
  // Navigation params se grain name and texture retrieve karein (Fallback defaults in case route params null hon)
  const selectedGrain = route?.params?.grainName || 'WHEAT';
  const selectedTexture = route?.params?.texture || 'MEDIUM';

  const [selectedOption, setSelectedOption] = useState(null);

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  const handleStartProcess = () => {
    setSelectedOption('start');
    // Direct processing screen par jaane ke liye:
    navigation.navigate('MillingControlScreen', { grain: selectedGrain, texture: selectedTexture });
  };

  const handleSetTexture = () => {
    setSelectedOption('texture');
    // Flow Rate / Texture setting screen par jaane ke liye:
    navigation.navigate('UserChoiceScreen', { grain: selectedGrain });
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
            <Text style={styles.headerTitle}>YOU HAVE CHOSEN : {selectedGrain.toUpperCase()}</Text>
            <Text style={styles.headerSubtitle}>
              TEXTURE : <Text style={styles.textureValue}>{selectedTexture.toUpperCase()}</Text>
            </Text>
          </View>

          {/* Logo Placeholder */}
          {/* <View style={styles.logoContainer}>
            <Image
              source={require('./assets/logo.png')} // Apne project ka logo path set karein
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View> */}
        </View>

        {/* MAIN BODY */}
        <View style={styles.mainSection}>
          <Text style={styles.questionText}>Do you want to :</Text>

          {/* ACTION CARDS */}
          <View style={styles.cardsRow}>
            
            {/* Card 1: START */}
            <TouchableOpacity
              style={[
                styles.actionCard,
                selectedOption === 'start' && styles.selectedCard,
              ]}
              onPress={handleStartProcess}
              activeOpacity={0.85}
            >
              <View style={[styles.iconContainer, selectedOption === 'start' && styles.selectedIconBg]}>
                <Feather
                  name="play-circle"
                  size={46}
                  color={selectedOption === 'start' ? '#FFFFFF' : '#5B8DEF'}
                />
              </View>
              <Text style={[styles.cardText, selectedOption === 'start' && styles.selectedCardText]}>
                START
              </Text>
            </TouchableOpacity>

            {/* Card 2: TEXTURE */}
            <TouchableOpacity
              style={[
                styles.actionCard,
                selectedOption === 'texture' && styles.selectedCard,
              ]}
              onPress={handleSetTexture}
              activeOpacity={0.85}
            >
              <View style={[styles.iconContainer, selectedOption === 'texture' && styles.selectedIconBg]}>
                <Feather
                  name="settings"
                  size={42}
                  color={selectedOption === 'texture' ? '#FFFFFF' : '#5B8DEF'}
                />
              </View>
              <Text style={[styles.cardText, selectedOption === 'texture' && styles.selectedCardText]}>
                TEXTURE
              </Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* FOOTER HINT */}
        <View style={styles.footerHintContainer}>
          <Text style={styles.footerText}>
            Select{' '}
            <View style={styles.inlineBackBadge}>
              <Feather name="arrow-left" size={12} color="#FFFFFF" />
            </View>
            {' '}to choose a different Grain
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
};

export default GrainConfirmationScreen;

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
    shadowOpacity: 0.2,
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

  /* MAIN SECTION */
  mainSection: {
    flex: 1,
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 20,
    textAlign: 'left',
  },

  /* CARDS SECTION */
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  actionCard: {
    flex: 1,
    height: 160,
    backgroundColor: '#FAFAFD',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  selectedCard: {
    borderColor: '#5B8DEF',
    borderWidth: 2,
    backgroundColor: '#F0F5FF',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedIconBg: {
    backgroundColor: '#5B8DEF',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 1.2,
  },
  selectedCardText: {
    color: '#5B8DEF',
  },

  /* FOOTER HINT */
  footerHintContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  inlineBackBadge: {
    backgroundColor: '#5B8DEF',
    width: 20,
    height: 20,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});