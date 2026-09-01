import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const CleanStoneChoiceScreen = ({ navigation }) => {
  const handleYes = () => {
    // Navigate to the next screen in the cleaning flow
    if (navigation?.navigate) {
      navigation.navigate('CleaningProcessScreen');
    }
  };

  const handleNo = () => {
    // Skip cleaning and move to next setup/home step
    if (navigation?.navigate) {
      navigation.navigate('SelectGrain');
    }
  };

  // const handleBack = () => {
  //   if (navigation?.goBack) {
  //     navigation.goBack();
  //   }
  // };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>

        {/* Top Header Controls (Back Button)
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View> */}

        {/* Center Content Section */}
        <View style={styles.centerSection}>

          {/* Main Question Title */}
          <Text style={styles.questionText}>
            Do you want to Clean Stone ?
          </Text>

          {/* YES / NO Action Buttons */}
          <View style={styles.buttonRow}>
            {/* YES BUTTON */}
            <TouchableOpacity
              style={[styles.actionButton, styles.yesButton]}
              onPress={handleYes}
              activeOpacity={0.85}
            >
              <Text style={styles.yesButtonText}>YES</Text>
            </TouchableOpacity>

            {/* NO BUTTON */}
            <TouchableOpacity
              style={[styles.actionButton, styles.noButton]}
              onPress={handleNo}
              activeOpacity={0.85}
            >
              <Text style={styles.noButtonText}>NO</Text>
            </TouchableOpacity>
          </View>

          {/* Recommendation Note */}
          <Text style={styles.recommendationText}>
            ( Recommended when grain is changed )
          </Text>

        </View>

      </View>
    </SafeAreaView>
  );
};

export default CleanStoneChoiceScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop:8
  },

  /* TOP BAR */
  topBar: {
    paddingHorizontal:0,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    width:'100'
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#5B8DEF', // Accent Blue
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },

  /* CENTER CONTENT */
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },

  /* QUESTION TEXT */
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 36,
  },

  /* BUTTON ROW */
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    maxWidth: 150,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* YES BUTTON STYLES */
  yesButton: {
    backgroundColor: '#5B8DEF', // Accent Blue Fill
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  yesButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },

  /* NO BUTTON STYLES */
  noButton: {
    backgroundColor: '#F2F4F8',
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
  },
  noButtonText: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },

  /* RECOMMENDATION SUBTEXT */
  recommendationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
  },
});