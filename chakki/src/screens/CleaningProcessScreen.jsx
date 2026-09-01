import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';


const PROGRESS_STEP = 10; // % added per tick
const PROGRESS_INTERVAL_MS = 450; // how often progress advances
const DONE_HOLD_MS = 2500; // how long the "DONE" message shows before advancing
const NEXT_ROUTE = 'CleanStoneChoiceScreen'; // change to wherever "cleaning finished" should return to

const RULER_TICKS = 41; // small decorative scale under the bar (purely visual)

const CleaningProcessScreen = ({ navigation }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('progress'); // 'progress' | 'done'
  const checkScale = useRef(new Animated.Value(0)).current;

  // Advance the progress bar until it hits 100
  useEffect(() => {
    if (phase !== 'progress') return undefined;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + PROGRESS_STEP, 100);
        if (next >= 100) {
          clearInterval(interval);
        }
        return next;
      });
    }, PROGRESS_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [phase]);

  // Once progress hits 100, switch to the "done" phase
  useEffect(() => {
    if (progress >= 100 && phase === 'progress') {
      const toDone = setTimeout(() => setPhase('done'), 400);
      return () => clearTimeout(toDone);
    }
    return undefined;
  }, [progress, phase]);

  // Pop in the checkmark, then auto-advance after a hold period
  useEffect(() => {
    if (phase !== 'done') return undefined;

    Animated.spring(checkScale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();

    const advance = setTimeout(() => {
      if (navigation?.replace) {
        navigation.replace(NEXT_ROUTE);
      } else if (navigation?.navigate) {
        navigation.navigate(NEXT_ROUTE);
      }
    }, DONE_HOLD_MS);

    return () => clearTimeout(advance);
  }, [phase, checkScale, navigation]);

  if (phase === 'done') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.centerContent}>
      

          <Animated.View
            style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}
          >
            <Feather name="check" size={30} color="#FFFFFF" />
          </Animated.View>

          <Text style={styles.doneTitle}>Self Cleaning is DONE.</Text>
          <Text style={styles.doneSubtitle}>
            Please discard contents from collection bowl.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.body}>
        {/* Logo centered above the title, same as every other new screen */}
        {/* <Image
          source={require('../assets/images/Softel Millet mill logo 2.png')}
          style={styles.millLogo}
          resizeMode="contain"
        /> */}
        <Text style={styles.headerTitle}>CLEANING PROCESS</Text>
        <Text style={styles.percentLabel}>{progress} % COMPLETED</Text>

        {/* Progress bar */}
        <View style={styles.trackOuter}>
          <View style={[styles.trackFill, { width: `${progress}%` }]} />
          <Text
            style={[
              styles.trackPercentText,
              { left: progress === 0 ? 14 : undefined },
            ]}
          >
            {progress}%
          </Text>
        </View>

        {/* Decorative ruler scale */}
        <View style={styles.rulerTicks}>
          {Array.from({ length: RULER_TICKS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.tick,
                i % 10 === 0 ? styles.tickMajor : styles.tickMinor,
              ]}
            />
          ))}
        </View>
        <View style={styles.rulerLabels}>
          <Text style={styles.rulerLabelText}>0</Text>
          <Text style={styles.rulerLabelText}>50</Text>
          <Text style={styles.rulerLabelText}>100</Text>
        </View>

        {/* Status pill — informational only, not tappable, while the cycle runs */}
        <View style={styles.waitPill}>
          <Text style={styles.waitPillText}>PLEASE WAIT</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CleaningProcessScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* ---- Progress phase ---- */

  body: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center', // vertically centers the whole block, same as your other screens
  },

  millLogo: {
    width: 170,
    height: 90,
    marginBottom: 22,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3E1A5B',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginBottom: 18,
  },

  percentLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#55327A',
    letterSpacing: 0.6,
    marginBottom: 18,
  },

  trackOuter: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E9E6ED',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#55327A',
    borderRadius: 23,
  },

  trackPercentText: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingLeft: 14,
  },

  rulerTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginTop: 18,
    paddingHorizontal: 2,
  },

  tick: {
    width: 1.5,
    backgroundColor: '#B9B9C2',
  },

  tickMajor: {
    height: 12,
  },

  tickMinor: {
    height: 6,
  },

  rulerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
  },

  rulerLabelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  waitPill: {
    marginTop: 40,
    backgroundColor: 'rgba(85, 50, 122, 0.55)',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },

  waitPillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },

  /* ---- Done phase ---- */

  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  millLogoCentered: {
    width: 170,
    height: 90,
    marginBottom: 30,
  },

  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  doneTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3E1A5B',
    textAlign: 'center',
    marginBottom: 8,
  },

  doneSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B5B7A',
    textAlign: 'center',
  },
});