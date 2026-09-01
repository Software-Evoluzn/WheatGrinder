import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const UserChoiceScreen = ({ navigation }) => {
  // User ka selection track karne ke liye state ('flowRate' | 'texture' | null)
  const [selectedOption, setSelectedOption] = useState(null);

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  const handlePressFlowRate = () => {
    setSelectedOption('flowRate');
  };

  const handlePressTexture = () => {
    setSelectedOption('texture');
  };

  // Main SET Button Action
  const handleSet = () => {
    if (selectedOption === 'flowRate') {
      // Apne router ke hisaab se screen ka name replace karein (e.g., 'SetFlowRateScreen')
      navigation.navigate('SetFlowRate');
    } else if (selectedOption === 'texture') {
      // Apne router ke hisaab se screen ka name replace karein (e.g., 'SetTextureScreen')
      navigation.navigate('SetGrindTexture');
    } else {
      // Agar user ne koi option select nahi kiya ho
      Alert.alert('Selection Required', 'Please select Flow Rate or Texture first.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>

        {/* Top Header Section */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>USER CHOICE</Text>

          <View style={{ width: 44 }} />
        </View>

        {/* Main Content Area */}
        <View style={styles.centerSection}>

          {/* Cards Row */}
          <View style={styles.cardsRow}>
            
            {/* Card 1: SET FLOW RATE */}
            <View
              style={[
                styles.optionCard,
                selectedOption === 'flowRate' && styles.selectedOptionCard,
              ]}
            >
              <Text style={styles.cardTitle}>SET{'\n'}FLOW RATE</Text>
              <TouchableOpacity
                style={[
                  styles.pressButton,
                  selectedOption === 'flowRate' && styles.selectedPressButton,
                ]}
                onPress={handlePressFlowRate}
                activeOpacity={0.85}
              >
                <Text style={styles.pressButtonText}>
                  {selectedOption === 'flowRate' ? 'SELECTED' : 'PRESS'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Card 2: SET TEXTURE */}
            <View
              style={[
                styles.optionCard,
                selectedOption === 'texture' && styles.selectedOptionCard,
              ]}
            >
              <Text style={styles.cardTitle}>SET{'\n'}TEXTURE</Text>
              <TouchableOpacity
                style={[
                  styles.pressButton,
                  selectedOption === 'texture' && styles.selectedPressButton,
                ]}
                onPress={handlePressTexture}
                activeOpacity={0.85}
              >
                <Text style={styles.pressButtonText}>
                  {selectedOption === 'texture' ? 'SELECTED' : 'PRESS'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* Bottom SET Button */}
          <TouchableOpacity
            style={[
              styles.setButton,
              !selectedOption && styles.disabledSetButton,
            ]}
            onPress={handleSet}
            activeOpacity={0.85}
          >
            <Text style={styles.setButtonText}>SET</Text>
          </TouchableOpacity>

        </View>

      </View>
    </SafeAreaView>
  );
};

export default UserChoiceScreen;

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

  /* TOP HEADER */
  headerRow: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 16,
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
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2E',
    letterSpacing: 2,
    textAlign: 'center',
  },

  /* CENTER SECTION */
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },

  /* CARDS ROW */
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#FAFAFD',
    borderWidth: 1.5,
    borderColor: '#B0B0B0',
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 170,
  },
  selectedOptionCard: {
    borderColor: '#5B8DEF',
    borderWidth: 2,
    backgroundColor: '#F0F5FF',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    letterSpacing: 0.8,
    lineHeight: 22,
  },

  /* PRESS BUTTON */
  pressButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  selectedPressButton: {
    backgroundColor: '#059669',
  },
  pressButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },

  /* BOTTOM SET BUTTON */
  setButton: {
    backgroundColor: '#5B8DEF',
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  disabledSetButton: {
    backgroundColor: '#A0AEC0',
    shadowOpacity: 0,
    elevation: 0,
  },
  setButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});