import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

const TOTAL_LEVEL_BARS = 18; // Total bars in the slider indicator

const GrindSettingScreen = ({ route, navigation }) => {
  // Receive grain details from navigation or fallback to Ragi
  const grainName = route?.params?.grainName || 'Premium Ragi Grains';
  const grainImage =
    route?.params?.grainImage || require('../assets/images/ragi.png');

  // Grind Level State (Default level 12)
  const [level, setLevel] = useState(12);

  const handleDecrease = () => {
    if (level > 1) setLevel((prev) => prev - 1);
  };

  const handleIncrease = () => {
    if (level < TOTAL_LEVEL_BARS) setLevel((prev) => prev + 1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation?.goBack()}
        >
          <Feather name="menu" size={22} color="#3E1A5B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Kitchen Tools</Text>

        <TouchableOpacity style={styles.avatarCircle}>
          <Feather name="user" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mainContainer}>
          {/* Logo Banner */}
          <View style={styles.bannerContainer}>
            <Image
              source={require('../assets/images/capture.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>
              Smart Home Automation Products
            </Text>
          </View>

          {/* Current Ingredient Card */}
          <View style={styles.cardWrapper}>
            <View style={styles.ingredientCard}>
              <Image
                source={grainImage}
                style={styles.grainImage}
                resizeMode="contain"
              />

              <Text style={styles.subHeaderTitle}>CURRENT INGREDIENT</Text>
              <Text style={styles.grainTitle}>{grainName}</Text>
            </View>
          </View>

          {/* Grind Setting Section */}
          <View style={styles.grindSettingContainer}>
            <Text style={styles.grindHeader}>GRIND SETTING</Text>

            {/* Labels Row */}
            <View style={styles.labelRow}>
              <Text style={styles.coarseFineText}>COARSE</Text>
              <Text style={styles.levelValueText}>Level {level}</Text>
              <Text style={styles.coarseFineText}>FINE</Text>
            </View>

            {/* Slider Controls (Minus [-], Level Bars, Plus [+]) */}
            <View style={styles.controlRow}>
              {/* Minus Button */}
              <TouchableOpacity
                style={styles.stepButton}
                activeOpacity={0.8}
                onPress={handleDecrease}
              >
                <Feather name="minus" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Dynamic Bars Track */}
              <View style={styles.barsContainer}>
                {Array.from({ length: TOTAL_LEVEL_BARS }).map((_, index) => {
                  const isFilled = index < level;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.singleBar,
                        isFilled ? styles.filledBar : styles.unfilledBar,
                      ]}
                    />
                  );
                })}
              </View>

              {/* Plus Button */}
              <TouchableOpacity
                style={styles.stepButton}
                activeOpacity={0.8}
                onPress={handleIncrease}
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Start Action Button */}
          <TouchableOpacity
            style={styles.startButton}
            activeOpacity={0.85}
            onPress={() => {
              // Handle process start logic
            }}
          >
            <Text style={styles.startButtonText}>START</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>Powered by EVOLUZN</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GrindSettingScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* Top Navigation Header */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },

  iconBtn: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3E1A5B',
  },

  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3E1A5B',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Scroll Content */
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
    backgroundColor: '#FAFAFD',
  },

  mainContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  /* Logo Banner */
  bannerContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
  },

  logoImage: {
    width: 170,
    height: 44,
    marginBottom: 4,
  },

  tagline: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },

  /* Ingredient Card */
  cardWrapper: {
    width: '100%',
    marginVertical: 10,
  },

  ingredientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',

    // Soft Elevation Shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  grainImage: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },

  subHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#522D70',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  grainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },

  /* Grind Setting Section */
  grindSettingContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 28,
  },

  grindHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#522D70',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 12,
  },

  coarseFineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },

  levelValueText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C2C2E',
  },

  /* Slider Controls Row */
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },

  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#522D70',
    justifyContent: 'center',
    alignItems: 'center',
  },

  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFEFEF',
    height: 38,
    borderRadius: 8,
    paddingHorizontal: 10,
  },

  singleBar: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },

  filledBar: {
    backgroundColor: '#522D70',
  },

  unfilledBar: {
    backgroundColor: '#D1D1D6',
  },

  /* Start Button */
  startButton: {
    backgroundColor: '#522D70',
    paddingVertical: 12,
    paddingHorizontal: 64,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
  },

  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* Footer */
  footerText: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '500',
    color: '#A0A0A5',
    marginTop: 20,
  },
});