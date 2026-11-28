
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Modal,
} from 'react-native';

import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  Screen,
  MainHeader,
  IconButton,
  PrimaryButton,
  BottomActionBar,
  AppDialog,
} from './ui';

import {
  colors,
  spacing,
  radii,
  shadows,
  layout,
} from './theme';

import {
  sendDeviceCommand,
  fetchRegisteredSerialNumber,
} from '../services/deviceApi';

import DeviceOfflineGuard from '../components/DeviceOfflineGuard';
import { getGrainConfig } from '../services/grainLevels';

const BRAND_GREEN = '#7DC24D';
const BRAND_PURPLE = '#3E1A5B';

// ======================================================
// HEADER MENU
// ======================================================

const HeaderMenu = () => {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const insets = useSafeAreaInsets();

  const items = [
    {
      icon: 'help-circle',
      label: 'Help',
      onPress: () => setHelpOpen(true),
    },
  ];

  return (
    <>
      <IconButton
        name="more-vertical"
        variant="ghost"
        onPress={() => setOpen(true)}
        accessibilityLabel="More options"
      />

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setOpen(false)}
        >
          <View
            style={[
              styles.menuCard,
              {
                top:
                  insets.top +
                  layout.headerContentHeight +
                  spacing.sm,
              },
            ]}
          >
            {items.map((item, i) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  setOpen(false);
                  item.onPress();
                }}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.menuItem,
                  i > 0 && styles.menuItemBorder,
                  pressed && {
                    backgroundColor: colors.primaryTint,
                  },
                ]}
              >
                <Feather
                  name={item.icon}
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: spacing.md }}
                />

                <Text style={styles.menuItemText}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <AppDialog
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        icon="help-circle"
        title="Help"
        message="Pick the grain you want to grind, then tap NEXT to continue."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

// ======================================================
// GRAIN CONFIGURATION
// ======================================================

const GRAINS = [
  {
    id: 'wheat',
    command: 'wheat',
    label: 'WHEAT',
    image: require('../assets/images/wheat.png'),
  },
  {
    id: 'chana_dal',
    command: 'chanaDal',
    label: 'CHANA DAL',
    image: require('../assets/images/chana_dal.png'),
  },
  {
    id: 'rice',
    command: 'rice',
    label: 'RICE',
    image: require('../assets/images/rice.png'),
  },
  {
    id: 'ragi',
    command: 'ragi',
    label: 'RAGI',
    image: require('../assets/images/ragi.png'),
  },
  {
    id: 'fada',
    command: 'fada',
    label: 'SPLITS (FADA)',
    image: require('../assets/images/splits.png'),
  },
  {
    id: 'jowar',
    command: 'jowar',
    label: 'JOWAR',
    image: require('../assets/images/jowar.png'),
  },
  {
    id: 'bajra',
    command: 'bajra',
    label: 'BAJRA',
    image: require('../assets/images/bajra.png'),
  },
  {
    id: 'masala',
    command: 'masala',
    label: 'MASALA',
    image: require('../assets/images/masala.png'),
  },
  {
    id: 'others',
    command: 'other',
    label: 'OTHERS',
    isOthers: true,
  },
];

// ======================================================
// RESOLVE MACHINE SERIAL NUMBER
// ======================================================

const resolveSerialNumber = async (route) => {
  // Priority 1: Route params
  const fromRoute = route?.params?.serialNumber;

  if (fromRoute) {
    return fromRoute;
  }

  // Priority 2: Stored serial number
  const stored = await AsyncStorage.getItem('serial_number');

  if (stored) {
    return stored;
  }

  // Priority 3: Fetch from backend
  const customerId =
    (await AsyncStorage.getItem('customer_id')) ||
    route?.params?.customerId;

  if (!customerId) {
    throw new Error(
      'User session not found. Please log in again.'
    );
  }

  const res = await fetchRegisteredSerialNumber(customerId);

  console.log('Serial response:', res);

  if (!res?.success && !res?.serial_number) {
    throw new Error(
      res?.error || 'No registered machine found'
    );
  }

  const serial =
    res.serial_number || res.data?.serial_number;

  await AsyncStorage.setItem('serial_number', serial);

  return serial;
};

// ======================================================
// SELECT GRAIN SCREEN
// ======================================================

const SelectGrainScreen = ({ navigation, route }) => {
  const [selectedGrain, setSelectedGrain] = useState('wheat');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const serialNumber = route?.params?.serialNumber;

  // ====================================================
  // SCROLL INDICATOR LOGIC
  // ====================================================

  const scrollMetrics = useRef({
    offset: 0,
    contentHeight: 0,
    viewportHeight: 0,
  });

  const updateSwipeHint = () => {
    const {
      offset,
      contentHeight,
      viewportHeight,
    } = scrollMetrics.current;

    const remainingHeight =
      contentHeight - viewportHeight - offset;

    setShowSwipeHint(
      viewportHeight > 0 && remainingHeight > 15
    );
  };

  const handleScroll = ({ nativeEvent }) => {
    scrollMetrics.current = {
      offset: nativeEvent.contentOffset.y,
      contentHeight: nativeEvent.contentSize.height,
      viewportHeight: nativeEvent.layoutMeasurement.height,
    };

    updateSwipeHint();
  };

  const handleSwipePress = () => {
    const {
      offset,
      viewportHeight,
      contentHeight,
    } = scrollMetrics.current;

    const maxOffset = Math.max(
      0,
      contentHeight - viewportHeight
    );

    scrollRef.current?.scrollTo({
      y: Math.min(
        maxOffset,
        offset + viewportHeight * 0.65
      ),
      animated: true,
    });
  };

  // ====================================================
  // CLEAN STONE HANDLER
  // ====================================================

  const handleCleanStone = async () => {
    if (sending) return;

    try {
      setSending(true);

      navigation.navigate(
        'ReadyToInitiateSelfCleaning',
        {
          serialNumber,
          device: route?.params?.device,
        }
      );
    } catch (e) {
      console.log('Clean stone error:', e);

      setErrorMsg(
        e?.message || 'Could not find registered machine'
      );
    } finally {
      setSending(false);
    }
  };

  // ====================================================
  // NEXT BUTTON HANDLER
  // ====================================================

  const handleNext = async () => {
    if (sending) return;

    const grain = GRAINS.find(
      (g) => g.id === selectedGrain
    );

    if (!grain) {
      setErrorMsg('Please select a grain.');
      return;
    }

    setSending(true);

    try {
      const serialNumber =
        await resolveSerialNumber(route);

      const res = await sendDeviceCommand(
        serialNumber,
        grain.command
      );

      const isSuccess =
        res?.success ||
        res?.status === 'success' ||
        res?.status === 200;

      if (!isSuccess) {
        throw new Error(
          res?.error ||
          res?.message ||
          'Could not send grain selection to machine'
        );
      }

      const grainConfig = getGrainConfig(grain.id);

      navigation.navigate('GrainConfirmationScreen', {
        serialNumber,
        grain: grain.id,
        grainCommand: grain.command,
        texture: grainConfig.default,
      });
    } catch (e) {
      setErrorMsg(
        e.message || 'Network error, please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  // ====================================================
  // SCREEN UI
  // ====================================================

  return (
    <Screen background={colors.background}>
      <DeviceOfflineGuard
        navigation={navigation}
        serialNumber={serialNumber}
      />

      {/* HEADER */}

      <MainHeader
        greeting="Machine Setup"
        title="Select Grain"
        onBack={
          navigation?.goBack
            ? () => navigation.goBack()
            : undefined
        }
        backButtonStyle={styles.backButton}
        right={<HeaderMenu />}
      />

      {/* SCROLLABLE GRAIN LIST */}

      <View style={styles.scrollWrapper}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onLayout={(event) => {
            scrollMetrics.current.viewportHeight =
              event.nativeEvent.layout.height;

            updateSwipeHint();
          }}
          onContentSizeChange={(width, height) => {
            scrollMetrics.current.contentHeight = height;
            updateSwipeHint();
          }}
        >
          <Text style={styles.heading}>
            Choose a grain to grind
          </Text>

          <View style={styles.grid}>
            {GRAINS.map((item) => {
              const isSelected =
                selectedGrain === item.id;

              return (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    setSelectedGrain(item.id)
                  }
                  disabled={sending}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: isSelected,
                    disabled: sending,
                  }}
                  style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                  ]}
                >
                  <View style={styles.thumbWrap}>
                    {item.isOthers ? (
                      <Feather
                        name="more-horizontal"
                        size={44}
                        color={colors.primary}
                      />
                    ) : (
                      <Image
                        source={item.image}
                        style={[
                          styles.thumb,
                          item.id === 'wheat' &&
                          styles.wheatThumb,
                        ]}
                        resizeMode="contain"
                      />
                    )}
                  </View>

                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.label,
                      isSelected && styles.labelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>

                  {isSelected && (
                    <View style={styles.checkDot}>
                      <Feather
                        name="check"
                        size={12}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* TRANSPARENT SWIPE-UP INDICATOR */}
      {/* Fixed height prevents layout jumping */}

      <View style={styles.swipeHintContainer}>
        {showSwipeHint && (
          <Pressable
            onPress={handleSwipePress}
            accessibilityRole="button"
            accessibilityLabel="Scroll to more grains"
            style={({ pressed }) => [
              styles.swipeHint,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Feather
              name="chevrons-up"
              size={30}
              color={BRAND_PURPLE}
              style={styles.swipeIcon}
            />

            <Text style={styles.swipeHintText}>
              Swipe up for more
            </Text>
          </Pressable>
        )}
      </View>

      {/* BOTTOM BUTTONS */}
      {/* lift={0} removes the default extra 80dp padding */}

      <BottomActionBar
        lift={0}
        divider={false}
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 4,
          },
        ]}
      >
        <View style={styles.actions}>
          {/* PURPLE CLEAN STONE BUTTON */}

          <Pressable
            onPress={handleCleanStone}
            disabled={sending}
            accessibilityRole="button"
            accessibilityState={{
              disabled: sending,
            }}
            style={({ pressed }) => [
              styles.cleanStoneButton,
              pressed && { opacity: 0.85 },
              sending && { opacity: 0.5 },
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.cleanStoneText}
            >
              CLEAN STONE
            </Text>
          </Pressable>

          {/* GREEN NEXT BUTTON */}

          <PrimaryButton
            title={sending ? 'SENDING...' : 'NEXT'}
            icon="arrow-right"
            iconColor="#FFFFFF"
            fullWidth={false}
            style={styles.nextButtonWrapper}
            buttonStyle={styles.greenButton}
            onPress={handleNext}
            disabled={sending}
          />
        </View>
      </BottomActionBar>

      {/* POWERED BY EVOLUZN FOOTER REMOVED */}

      {/* ERROR DIALOG */}

      <AppDialog
        visible={!!errorMsg}
        onClose={() => setErrorMsg('')}
        icon="alert-circle"
        title="Couldn't select grain"
        message={errorMsg}
        confirmLabel="OK"
        onConfirm={() => setErrorMsg('')}
      />
    </Screen>
  );
};

export default SelectGrainScreen;

// ======================================================
// STYLES
// ======================================================

const CARD_GAP = spacing.md;

const styles = StyleSheet.create({
  // HEADER MENU

  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  menuCard: {
    position: 'absolute',
    right: layout.screenPaddingHorizontal,
    minWidth: 180,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    ...shadows.card,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  menuItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },

  menuItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  backButton: {
    backgroundColor: BRAND_PURPLE,
    borderColor: BRAND_PURPLE,
  },

  // SCROLL AREA

  scrollWrapper: {
    flex: 1,
    minHeight: 0,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: 4,
  },

  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  // GRAIN CARDS

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  card: {
    width: '48%',
    aspectRatio: 0.9,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    marginBottom: CARD_GAP,
    ...shadows.subtle,
  },

  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },

  thumbWrap: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  thumb: {
    width: 118,
    height: 118,
  },

  wheatThumb: {
    width: 158,
    height: 158,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textAlign: 'center',
    maxWidth: '100%',
  },

  labelSelected: {
    color: colors.primary,
  },

  checkDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // TRANSPARENT SWIPE INDICATOR

  swipeHintContainer: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  swipeHint: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },

  swipeIcon: {
    opacity: 0.75,
  },

  swipeHintText: {
    color: BRAND_PURPLE,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -4,
  },

  // COMPACT BOTTOM ACTION BAR

  bottomBar: {
    paddingTop: 2,
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: 0,
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: colors.background,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },

  // PURPLE CLEAN STONE BUTTON

  cleanStoneButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    backgroundColor: BRAND_PURPLE,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    ...shadows.button,
  },

  cleanStoneText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },

  // GREEN NEXT BUTTON

  nextButtonWrapper: {
    flex: 1,
    minWidth: 0,
  },

  greenButton: {
    backgroundColor: BRAND_GREEN,
    minHeight: 54,
    paddingHorizontal: 8,
  },
});
