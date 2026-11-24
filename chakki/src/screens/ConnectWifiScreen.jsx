import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import WifiManager from 'react-native-wifi-reborn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen,
  MainHeader,
  IconButton,
  StepIndicator,
  Eyebrow,
  PrimaryButton,
  StatusBadge,
  BottomActionBar,
  AppDialog,
} from './ui';
import { colors, spacing, typography, radii, shadows, layout } from './theme';
import { saveDeviceWifi } from '../services/WifiService';

const ESP_AP_IP = 'http://192.168.4.1';
const DEVICE_AP_PASSWORD = '12345678';
const POLL_EVERY_MS = 3000;
const MAX_VERIFY_MS = 30000;
const UNREACHABLE_STREAK_OK = 2;

const FLOW_STAGE = {
  ASK_REGISTER: 'ask_register',       // 0. Ask user if they want to register a new device
  ENTER_ID: 'enter_id',               // 1. User enters Device ID
  CONNECTING_AP: 'connecting_ap',     // 2. Searching & connecting to softelApXXXXXX
  SELECT_NETWORK: 'select_network',   // 3. Scanning & showing Wi-Fi list + password
  PROVISIONING: 'provisioning',       // 4. Sending Wi-Fi creds & verifying ESP AP drop
  WAITING_PHONE_NET: 'waiting_net',   // 5. Device connected; waiting for phone to regain any Wi-Fi
};

/**
 * Converts Device ID (e.g., "softelF0C097" or "F0C097") -> "softelApF0C097"
 */
const formatDeviceApSsid = (rawId) => {
  const trimmed = rawId.trim();
  if (!trimmed) return '';
  if (/^softelap/i.test(trimmed)) {
    return trimmed.replace(/^softelap/i, 'softelAp');
  }
  if (/^softel/i.test(trimmed)) {
    return trimmed.replace(/^softel/i, 'softelAp');
  }
  return `softelAp${trimmed}`;
};

/* -------------------------------------------------------------------------- */
/*  HeaderMenu                                                                */
/* -------------------------------------------------------------------------- */
const HeaderMenu = () => {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const items = [
    { icon: 'help-circle', label: 'Help', onPress: () => setHelpOpen(true) },
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
        <Pressable style={styles.menuOverlay} onPress={() => setOpen(false)}>
          <View style={[styles.menuCard, { top: insets.top + layout.headerContentHeight + spacing.sm }]}>
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
                  pressed && { backgroundColor: colors.primaryTint },
                ]}
              >
                <Feather name={item.icon} size={18} color={colors.primary} style={{ marginRight: spacing.md }} />
                <Text style={styles.menuItemText}>{item.label}</Text>
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
        message="Power on your machine first, enter its Device ID (e.g., softelF0C097), tap Search, and select your local 2.4 GHz Wi-Fi network."
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
      />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*  Main Screen                                                               */
/* -------------------------------------------------------------------------- */
const ConnectWifiScreen = ({ route, navigation }) => {
  const { firebaseUid, serialNo } = route?.params || {};

  // Stage & Device ID states (Starts by asking if user wants to register a new device)
  const [stage, setStage] = useState(FLOW_STAGE.ASK_REGISTER);
  const [deviceId, setDeviceId] = useState('');
  const [targetApSsid, setTargetApSsid] = useState('');
  const [powerPromptVisible, setPowerPromptVisible] = useState(false);
  const [hasShownPowerPrompt, setHasShownPowerPrompt] = useState(false);

  // Wi-Fi list & credentials states
  const [wifiList, setWifiList] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Refs
  const deviceInputRef = useRef(null);
  const pollTimer = useRef(null);
  const phoneWifiTimer = useRef(null);
  const elapsedRef = useRef(0);
  const unreachableStreak = useRef(0);

  const stopAllTimers = () => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    if (phoneWifiTimer.current) {
      clearInterval(phoneWifiTimer.current);
      phoneWifiTimer.current = null;
    }
  };

  useEffect(() => {
    return () => stopAllTimers();
  }, []);

  const navigateToHome = () => {
    stopAllTimers();
    if (navigation?.reset) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } else if (navigation?.navigate) {
      navigation.navigate('Main');
    }
  };

  /* -------------------- Permissions Helper -------------------- */
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission Required',
          message: 'Location access is required to scan and connect to your device Wi-Fi.',
          buttonPositive: 'Allow',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  /* -------------------- Step 1: Device ID Focus & Input -------------------- */
  const handleDeviceInputFocus = () => {
    if (!hasShownPowerPrompt) {
      deviceInputRef.current?.blur();
      setHasShownPowerPrompt(true);
      setPowerPromptVisible(true);
    }
  };

  const handleConfirmPowerSupply = () => {
    setPowerPromptVisible(false);
    setTimeout(() => {
      deviceInputRef.current?.focus();
    }, 150);
  };

  const handleDeviceIdChange = (text) => {
    setDeviceId(text);
    setErrorMessage('');
  };

  const handleSearchAndConnectAp = async () => {
    const apName = formatDeviceApSsid(deviceId);
    if (!apName) {
      Alert.alert('Invalid Device ID', 'Please enter a valid Device ID (e.g., softelF0C097).');
      return;
    }

    const hasPerm = await requestLocationPermission();
    if (!hasPerm) {
      Alert.alert('Permission Denied', 'Location permission is needed to find the device.');
      return;
    }

    setTargetApSsid(apName);
    setErrorMessage('');
    setStage(FLOW_STAGE.CONNECTING_AP);
    setStatusMessage(`Searching for ${apName}...`);

    try {
      const scannedNetworks = await WifiManager.loadWifiList();
      const matchedAp = (scannedNetworks || []).find(
        (net) => net.SSID && net.SSID.toLowerCase() === apName.toLowerCase()
      );
      const exactSsidToConnect = matchedAp?.SSID || apName;

      setStatusMessage(`Connecting to ${exactSsidToConnect}...`);

      await WifiManager.connectToProtectedSSID(
        exactSsidToConnect,
        DEVICE_AP_PASSWORD,
        false,
        false
      );

      try {
        await WifiManager.forceWifiUsageWithOptions(true, { noResetOnDisconnect: false });
      } catch (e) {
        // Non-fatal on some OS versions
      }

      setStatusMessage(`Connected to ${exactSsidToConnect}. Loading Wi-Fi list...`);

      const filteredList = filterNearbyNetworks(scannedNetworks, exactSsidToConnect);
      if (filteredList.length > 0) {
        setWifiList(filteredList);
      } else {
        await scanAvailableWifiNetworks(exactSsidToConnect);
      }

      setStage(FLOW_STAGE.SELECT_NETWORK);
    } catch (err) {
      console.log('[AP Connect Error]:', err);
      setStage(FLOW_STAGE.ENTER_ID);
      setErrorMessage(
        `Could not find or connect to "${apName}". Make sure power supply is ON and the device is nearby.`
      );
    }
  };

  /* -------------------- Helper: Filter & Scan Nearby Wi-Fi -------------------- */
  const filterNearbyNetworks = (networks, currentApSsid) => {
    const uniqueMap = new Map();
    (networks || []).forEach((net) => {
      if (
        net.SSID &&
        net.SSID.toLowerCase() !== (currentApSsid || '').toLowerCase() &&
        !net.SSID.toLowerCase().startsWith('softelap') &&
        !uniqueMap.has(net.SSID)
      ) {
        uniqueMap.set(net.SSID, net);
      }
    });
    return Array.from(uniqueMap.values());
  };

  const scanAvailableWifiNetworks = async (overrideApSsid) => {
    setIsScanning(true);
    try {
      const networks = await WifiManager.loadWifiList();
      setWifiList(filterNearbyNetworks(networks, overrideApSsid || targetApSsid));
    } catch (err) {
      console.log('[Wi-Fi Scan Error]:', err);
      Alert.alert('Scan Error', 'Unable to fetch Wi-Fi list. Tap refresh to try again.');
    } finally {
      setIsScanning(false);
    }
  };

  /* -------------------- Step 3: Send Credentials to ESP32 -------------------- */
  const isEspApReachable = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    try {
      await fetch(`${ESP_AP_IP}/`, { method: 'GET', signal: controller.signal });
      clearTimeout(timeout);
      return true;
    } catch {
      clearTimeout(timeout);
      return false;
    }
  };

  const handleProvisionDeviceWifi = async () => {
    if (!selectedNetwork?.SSID) {
      Alert.alert('Select Network', 'Please select a Wi-Fi network from the list.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Invalid Password', 'Wi-Fi password must be at least 8 characters.');
      return;
    }

    setErrorMessage('');
    setStage(FLOW_STAGE.PROVISIONING);
    setStatusMessage(`Sending credentials for "${selectedNetwork.SSID}"...`);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      await fetch(`${ESP_AP_IP}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `s=${encodeURIComponent(selectedNetwork.SSID)}&p=${encodeURIComponent(password)}`,
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (e) {
      console.log('[ESP /save post info]:', e.message);
    }

    setStatusMessage('Verifying device connection...');
    elapsedRef.current = 0;
    unreachableStreak.current = 0;

    pollTimer.current = setInterval(async () => {
      elapsedRef.current += POLL_EVERY_MS;
      const reachable = await isEspApReachable();

      if (reachable) {
        unreachableStreak.current = 0;
      } else {
        unreachableStreak.current += 1;
        if (unreachableStreak.current >= UNREACHABLE_STREAK_OK) {
          stopAllTimers();
          onDeviceProvisionSuccess();
          return;
        }
      }

      if (elapsedRef.current >= MAX_VERIFY_MS) {
        stopAllTimers();
        setStage(FLOW_STAGE.SELECT_NETWORK);
        setErrorMessage(
          'Device could not connect. Verify the password and ensure the network is 2.4 GHz.'
        );
      }
    }, POLL_EVERY_MS);
  };

  /* -------------------- Step 4: Save & Watch Any Phone Wi-Fi -------------------- */
  const onDeviceProvisionSuccess = async () => {
    setStage(FLOW_STAGE.WAITING_PHONE_NET);
    setStatusMessage(
      `Device connected to "${selectedNetwork.SSID}"! Reconnecting phone to Wi-Fi...`
    );

    try {
      await WifiManager.forceWifiUsageWithOptions(false, { noResetOnDisconnect: false });
    } catch (e) {
      // ignore
    }

    phoneWifiTimer.current = setInterval(async () => {
      try {
        const rawSsid = await WifiManager.getCurrentWifiSSID();
        const currentSsid = (rawSsid || '').replace(/"/g, '').trim();

        if (
          currentSsid &&
          currentSsid !== '<unknown ssid>' &&
          currentSsid.toLowerCase() !== targetApSsid.toLowerCase() &&
          !currentSsid.toLowerCase().startsWith('softelap')
        ) {
          stopAllTimers();

          try {
            await saveDeviceWifi({
              deviceId: deviceId.trim(),
              firebaseUid: firebaseUid || 'DEFAULT_UID',
              ssid: selectedNetwork.SSID,
              password,
            });
          } catch (dbErr) {
            console.log('[DB Save Error]:', dbErr);
          }

          navigateToHome();
        }
      } catch (err) {
        console.log('[Phone Wi-Fi Poll]:', err);
      }
    }, 2000);
  };

  return (
    <Screen background={colors.background}>
      <MainHeader
        greeting={stage === FLOW_STAGE.ASK_REGISTER ? 'Device Setup' : 'Machine Status'}
        title={stage === FLOW_STAGE.ASK_REGISTER ? 'New Device' : 'Wi-Fi Setup'}
        onBack={
          stage !== FLOW_STAGE.ASK_REGISTER
            ? () => {
                stopAllTimers();
                setErrorMessage('');
                setStage(FLOW_STAGE.ASK_REGISTER);
              }
            : navigation?.goBack
            ? () => navigation.goBack()
            : undefined
        }
        right={<HeaderMenu />}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            stage === FLOW_STAGE.ASK_REGISTER && styles.contentCentered,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ==================== STAGE 0: ASK NEW DEVICE REGISTRATION ==================== */}
          {stage === FLOW_STAGE.ASK_REGISTER && (
            <View style={styles.promptCard}>
              <Eyebrow>Device Onboarding</Eyebrow>
              <Text style={styles.promptTitle}>
                Do you want to register a new device?
              </Text>
              <Text style={styles.promptSubtitle}>
                Select Yes to configure a new machine and connect it to your Wi-Fi network, or continue directly to the home screen.
              </Text>

              <View style={styles.promptActions}>
                <PrimaryButton
                  title="YES, REGISTER NEW DEVICE"
                  icon="plus-circle"
                  onPress={() => setStage(FLOW_STAGE.ENTER_ID)}
                />

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={navigateToHome}
                  activeOpacity={0.75}
                >
                  <Text style={styles.secondaryButtonText}>No, Go to Home Screen</Text>
                  <Feather name="arrow-right" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ==================== SETUP FLOW HEADER (STEPS 1-5) ==================== */}
          {stage !== FLOW_STAGE.ASK_REGISTER && (
            <View style={styles.headerBlock}>
              <StepIndicator total={3} current={0} style={{ marginBottom: spacing.lg }} />
              <Eyebrow>Step 1 of 3</Eyebrow>
              <Text style={styles.title}>Connect your machine to Wi-Fi</Text>
              <Text style={styles.message}>
                Power on your machine, enter its Device ID, and tap Search to connect and select your Wi-Fi network.
              </Text>
            </View>
          )}

          {/* ==================== STAGE 1 & 2: DEVICE ID INPUT ==================== */}
          {(stage === FLOW_STAGE.ENTER_ID || stage === FLOW_STAGE.CONNECTING_AP) && (
            <View style={styles.stateCard}>
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>Device ID</Text>
                <StatusBadge
                  label={stage === FLOW_STAGE.CONNECTING_AP ? 'Connecting AP...' : 'Step 1'}
                  variant={stage === FLOW_STAGE.CONNECTING_AP ? 'success' : 'info'}
                  icon={stage === FLOW_STAGE.CONNECTING_AP ? 'wifi' : 'cpu'}
                />
              </View>

              <View style={styles.inputBox}>
                <Feather name="hash" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  ref={deviceInputRef}
                  style={styles.textInput}
                  placeholder="e.g. softelF0C097"
                  placeholderTextColor={colors.textSecondary}
                  value={deviceId}
                  onFocus={handleDeviceInputFocus}
                  onChangeText={handleDeviceIdChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={stage === FLOW_STAGE.ENTER_ID}
                />
              </View>

              {deviceId.trim().length > 0 && (
                <Text style={styles.apPreviewText}>
                  Target Access Point: <Text style={styles.apPreviewBold}>{formatDeviceApSsid(deviceId)}</Text>
                </Text>
              )}

              {stage === FLOW_STAGE.CONNECTING_AP && (
                <View style={styles.inlineLoader}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loaderText}>{statusMessage}</Text>
                </View>
              )}

              {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            </View>
          )}

          {/* ==================== STAGE 3: WIFI LIST & PASSWORD ==================== */}
          {stage === FLOW_STAGE.SELECT_NETWORK && (
            <View style={styles.stateCard}>
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>Select Wi-Fi Network</Text>
                <TouchableOpacity
                  onPress={() => scanAvailableWifiNetworks()}
                  disabled={isScanning}
                  style={styles.refreshBtn}
                >
                  <Feather name="refresh-cw" size={14} color={colors.primary} />
                  <Text style={styles.refreshBtnText}>{isScanning ? 'Scanning...' : 'Refresh'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.connectedApNote}>
                Connected to {targetApSsid}
              </Text>

              <View style={styles.wifiListContainer}>
                {wifiList.length === 0 && !isScanning ? (
                  <Text style={styles.emptyListText}>No Wi-Fi networks found. Tap Refresh.</Text>
                ) : (
                  wifiList.map((item) => {
                    const isSelected = selectedNetwork?.SSID === item.SSID;
                    return (
                      <TouchableOpacity
                        key={item.BSSID || item.SSID}
                        onPress={() => {
                          setSelectedNetwork(item);
                          setErrorMessage('');
                        }}
                        style={[styles.wifiItem, isSelected && styles.wifiItemSelected]}
                      >
                        <View style={styles.wifiItemLeft}>
                          <Feather
                            name="wifi"
                            size={16}
                            color={isSelected ? colors.primary : colors.textSecondary}
                          />
                          <Text
                            style={[styles.wifiSsidText, isSelected && styles.wifiSsidTextSelected]}
                            numberOfLines={1}
                          >
                            {item.SSID}
                          </Text>
                        </View>
                        {isSelected && (
                          <Feather name="check-circle" size={16} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              {selectedNetwork && (
                <View style={styles.passwordSection}>
                  <Text style={styles.passwordLabel}>
                    Password for "{selectedNetwork.SSID}"
                  </Text>
                  <View style={styles.inputBox}>
                    <Feather name="lock" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter Wi-Fi password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                      <Feather
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            </View>
          )}

          {/* ==================== STAGE 4 & 5: PROVISIONING / REDIRECTING ==================== */}
          {(stage === FLOW_STAGE.PROVISIONING || stage === FLOW_STAGE.WAITING_PHONE_NET) && (
            <View style={styles.stateCard}>
              <StatusBadge
                label={stage === FLOW_STAGE.WAITING_PHONE_NET ? 'Device Connected' : 'Configuring'}
                variant="success"
                icon="wifi"
              />
              <View style={[styles.inlineLoader, { marginTop: spacing.lg }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loaderText}>{statusMessage}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Primary Action */}
      {stage === FLOW_STAGE.ENTER_ID && (
        <BottomActionBar>
          <PrimaryButton
            title="SEARCH & CONNECT DEVICE"
            icon="search"
            onPress={handleSearchAndConnectAp}
            disabled={!deviceId.trim()}
          />
        </BottomActionBar>
      )}

      {stage === FLOW_STAGE.SELECT_NETWORK && (
        <BottomActionBar>
          <PrimaryButton
            title="CONNECT TO WI-FI"
            icon="arrow-right"
            onPress={handleProvisionDeviceWifi}
            disabled={!selectedNetwork || password.length < 8}
          />
        </BottomActionBar>
      )}

      {/* Power Supply Prompt Dialog */}
      <AppDialog
        visible={powerPromptVisible}
        onClose={handleConfirmPowerSupply}
        icon="zap"
        title="Give Power Supply to Device"
        message="First, connect your device to the power supply and turn it ON. Then, enter your Device ID."
        confirmLabel="Power ON , Continue"
        onConfirm={handleConfirmPowerSupply}
      />
    </Screen>
  );
};

export default ConnectWifiScreen;

const styles = StyleSheet.create({
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

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  contentCentered: {
    justifyContent: 'center',
  },

  /* Initial Registration Prompt Card */
  promptCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    ...shadows.card,
  },
  promptTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.sm,
    lineHeight: 29,
    letterSpacing: 0.2,
  },
  promptSubtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  promptActions: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  /* Clean Header Block */
  headerBlock: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xs,
    letterSpacing: 0.2,
  },
  message: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 21,
  },

  stateCard: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.subtle,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  stateLabel: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  apPreviewText: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textSecondary,
  },
  apPreviewBold: {
    fontWeight: '700',
    color: colors.primary,
  },

  inlineLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: 10,
  },
  loaderText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: 13,
    color: '#D32F2F',
    lineHeight: 18,
  },

  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  connectedApNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  wifiListContainer: {
    maxHeight: 180,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  wifiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    backgroundColor: colors.background,
  },
  wifiItemSelected: {
    backgroundColor: colors.primaryTint,
  },
  wifiItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  wifiSsidText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  wifiSsidTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  emptyListText: {
    padding: spacing.lg,
    textAlign: 'center',
    fontSize: 13,
    color: colors.textSecondary,
  },
  passwordSection: {
    marginTop: spacing.lg,
  },
  passwordLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});