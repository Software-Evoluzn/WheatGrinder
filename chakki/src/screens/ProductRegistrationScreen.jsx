import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Camera } from 'react-native-camera-kit';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WifiManager from 'react-native-wifi-reborn';
import { io } from 'socket.io-client';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';

import IP_CONFIG from '../services/ip.json';
import { AppHeader } from './ui';
import { saveDeviceWifi } from '../services/WifiService';

const base_url = IP_CONFIG.BASE_URL;
const BRAND_GREEN = '#7DC24D';
const PURPLE = '#522D70';
const MAIN_SCREEN_ROUTE = 'Main';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ESP_AP_IP = 'http://192.168.4.1';
const DEVICE_AP_PASSWORD = '12345678';
const POLL_EVERY_MS = 3000;
const MAX_VERIFY_MS = 30000;
const ONLINE_WAIT_MS = 60000; // device online hone ka max wait

// ============================================================
// STAGES  (poora flow ek line mein)
// SCAN -> CONNECTING_AP -> SELECT_NETWORK -> PROVISIONING
//      -> WAITING_PHONE_NET -> WAITING_ONLINE -> REGISTER
// ============================================================
const STAGE = {
  SCAN: 'scan',
  CONNECTING_AP: 'connecting_ap',
  SELECT_NETWORK: 'select_network',
  PROVISIONING: 'provisioning',
  WAITING_PHONE_NET: 'waiting_phone_net',
  WAITING_ONLINE: 'waiting_online',
  REGISTER: 'register',
};

// ============================================================
// HELPERS
// ============================================================

// QR parser
const ALL_LABELS = 'Product Name|Device Name|Device ID|Serial No|Model No|MAC ID|MDF By';

const getValue = (raw, labelNames) => {
  const regex = new RegExp(
    `(?:${labelNames})\\s*:\\s*([\\s\\S]*?)\\s*(?=(?:${ALL_LABELS})\\s*:|$)`,
    'i'
  );
  const match = raw.match(regex);
  return match ? match[1].trim() : '';
};

const parseQR = (raw) => {
  if (!raw) return null;
  const result = {
    productName: getValue(raw, 'Product Name|Device Name'),
    serialNo: getValue(raw, 'Device ID|Serial No'),
    macId: getValue(raw, 'MAC ID'),
  };
  if (!result.serialNo) return null;
  return result;
};

// Device ID ("softelF0C097" ya "F0C097") -> "softelApF0C097"
const formatDeviceApSsid = (rawId) => {
  const trimmed = (rawId || '').trim();
  if (!trimmed) return '';
  // Device ID ke last 6 hex characters hi asli ID hain (F0C097),
  // isse QR mein extra "p" / "Ap" hone par bhi sahi AP name banta hai.
  const match = trimmed.match(/([0-9A-F]{6})$/i);
  if (match) return `softelAp${match[1].toUpperCase()}`;
  return `softelAp${trimmed}`;
};

const formatDate = (d) =>
  `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

const formatDateForAPI = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const getSafeFileName = (name, mimeType) => {
  const fileName = name || `invoice_${Date.now()}`;
  if (fileName.includes('.')) return fileName;
  return `${fileName}.${MIME_TO_EXT[mimeType] || 'jpg'}`;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wi-Fi list se AP aur duplicate hatao
const filterNearbyNetworks = (networks, currentApSsid) => {
  const map = new Map();
  (networks || []).forEach((net) => {
    const ssid = net.SSID || '';
    if (
      ssid &&
      ssid.toLowerCase() !== (currentApSsid || '').toLowerCase() &&
      !ssid.toLowerCase().startsWith('softelap') &&
      !map.has(ssid)
    ) {
      map.set(ssid, net);
    }
  });
  return Array.from(map.values());
};



// Location Service (GPS) ON hai ya nahi check karne ke liye
const isLocationServiceEnabled = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    // Agar location service off hogi toh loadWifiList ya current SSID error dega
    await WifiManager.loadWifiList();
    return true;
  } catch (err) {
    const msg = String(err?.message || err || '');
    if (/location/i.test(msg)) {
      return false;
    }
    return true; // Koi aur error hai toh aage handle hoga
  }
};

// Socket se device online hai ya nahi
const checkDeviceOnlineStatus = (serialNumber, timeoutMs = 5000) =>
  new Promise((resolve) => {
    const sn = String(serialNumber).trim().toLowerCase();
    const socket = io(base_url, { transports: ['polling'], reconnection: false });
    let settled = false;

    const cleanup = (isOnline) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.off('device_status_update');
      socket.disconnect();
      resolve(isOnline);
    };

    const timer = setTimeout(() => cleanup(false), timeoutMs);

    socket.on('connect', () => {
      socket.emit('get_device_status', { serial_number: String(serialNumber).trim() });
    });
    socket.on('connect_error', () => cleanup(false));
    socket.on('device_status_update', (data) => {
      if (!data?.serial_number) return;
      if (String(data.serial_number).toLowerCase() !== sn) return;
      if (data.status === 'online') cleanup(true);
      else if (data.status === 'offline') cleanup(false);
    });
  });

// ============================================================
// SCREEN
// ============================================================

const ProductRegistrationScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const firebaseUid = route?.params?.firebaseUid;

  const [stage, setStage] = useState(STAGE.SCAN);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // QR se aaya data
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [productName, setProductName] = useState('');
  const [serialNo, setSerialNo] = useState(''); // = Device ID
  const [macId, setMacId] = useState('');
  const [targetApSsid, setTargetApSsid] = useState('');

  // Wi-Fi
  const [wifiList, setWifiList] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register
  const [customerId, setCustomerId] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Refs
  const hasScanned = useRef(false);
  const pollTimer = useRef(null);
  const phoneWifiTimer = useRef(null);
  const elapsedRef = useRef(0);
  const unreachableStreak = useRef(0);
  const isMounted = useRef(true);

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
    isMounted.current = true;
    AsyncStorage.getItem('customer_id')
      .then((id) => id && setCustomerId(id))
      .catch((e) => console.error('Failed to load customer ID', e));

    return () => {
      isMounted.current = false;
      stopAllTimers();
    };
  }, []);

  // ==========================================================
  // STEP 1: QR SCAN
  // ==========================================================

  const startScanner = () => {
    hasScanned.current = false;
    setErrorMessage('');
    setIsCameraActive(true);
  };

  const onReadCode = (event) => {
    if (hasScanned.current) return;
    const qrData = event.nativeEvent.codeStringValue;
    if (!qrData) return;

    const parsed = parseQR(qrData);
    if (!parsed) {
      Alert.alert('Invalid QR', 'QR Code format is not valid.');
      return;
    }

    hasScanned.current = true;
    setProductName(parsed.productName);
    setSerialNo(parsed.serialNo);
    setMacId(parsed.macId);
    setIsCameraActive(false);

    // QR scan hote hi seedha AP search + connect shuru
    connectToDeviceAp(parsed.serialNo);
  };

  // ==========================================================
  // STEP 2: DEVICE KA ACCESS POINT SEARCH + CONNECT
  // ==========================================================

  const requestLocationPermission = async () => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission Required',
        message: 'Location access is required to scan and connect to your device Wi-Fi.',
        buttonPositive: 'Allow',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const connectToDeviceAp = async (deviceId) => {
    const apName = formatDeviceApSsid(deviceId);
    if (!apName) {
      Alert.alert('Invalid QR', 'Device ID not found in QR code.');
      setStage(STAGE.SCAN);
      return;
    }

    const hasPerm = await requestLocationPermission();
    if (!hasPerm) {
      Alert.alert('Permission Denied', 'Location permission is needed to find the device.');
      setStage(STAGE.SCAN);
      return;
    }

    // Phone ka Wi-Fi ON hona zaroori hai (Android 10+ mein app ON nahi kar sakti)
    try {
      let wifiOn = await WifiManager.isEnabled();
      if (!wifiOn) {
        try {
          WifiManager.setEnabled(true); // Android 9 aur neeche pe chalta hai
          await sleep(1500);
          wifiOn = await WifiManager.isEnabled();
        } catch (e) {
          console.log('[Wi-Fi enable error]:', e);
        }
      }
      if (!wifiOn) {
        setStage(STAGE.SCAN);
        Alert.alert(
          'Turn ON Wi-Fi',
          'Please turn ON your phone Wi-Fi, then scan the QR again.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () =>
                Linking.sendIntent('android.settings.WIFI_SETTINGS').catch(() =>
                  Linking.openSettings()
                ),
            },
          ]
        );
        return;
      }
    } catch (e) {
      console.log('[Wi-Fi state check error]:', e);
    }

    // 3. Phone ki Location (GPS) Service ON Check
    const locationOn = await isLocationServiceEnabled();
    if (!locationOn) {
      setStage(STAGE.SCAN);
      Alert.alert(
        'Turn ON Location',
        'Please turn ON your phone Location (GPS) to scan and connect to the device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Location Settings',
            onPress: () =>
              Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() =>
                Linking.openSettings()
              ),
          },
        ]
      );
      return;
    }

    setTargetApSsid(apName);
    setErrorMessage('');
    setStage(STAGE.CONNECTING_AP);
    setStatusMessage(`Searching for ${apName}...`);

    try {
      const scannedNetworks = await WifiManager.loadWifiList();
      const matchedAp = (scannedNetworks || []).find(
        (net) => net.SSID && net.SSID.toLowerCase() === apName.toLowerCase()
      );
      const exactSsid = matchedAp?.SSID || apName;

      setStatusMessage(`Connecting to ${exactSsid}...`);
      await WifiManager.connectToProtectedSSID(exactSsid, DEVICE_AP_PASSWORD, false, false);

      try {
        await WifiManager.forceWifiUsageWithOptions(true, { noResetOnDisconnect: false });
      } catch (e) {
        // non-fatal
      }

      setStatusMessage(`Connected to ${exactSsid}. Loading Wi-Fi list...`);

      // ---- STEP 3: Wi-Fi list ----
      const filtered = filterNearbyNetworks(scannedNetworks, exactSsid);
      if (filtered.length > 0) {
        setWifiList(filtered);
      } else {
        await scanAvailableWifiNetworks(exactSsid);
      }
      setStage(STAGE.SELECT_NETWORK);
    } catch (err) {
      console.log('[AP Connect Error]:', err);
      setStage(STAGE.SCAN);
      const msg = String(err?.message || err || '');

      if (/enable wifi manually|wifi.*off|disabled/i.test(msg)) {
        setErrorMessage('Phone Wi-Fi is OFF. Please turn ON Wi-Fi from settings and scan the QR again.');
        Alert.alert(
          'Turn ON Wi-Fi',
          'Please turn ON your phone Wi-Fi, then scan the QR again.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () =>
                Linking.sendIntent('android.settings.WIFI_SETTINGS').catch(() =>
                  Linking.openSettings()
                ),
            },
          ]
        );
      } else if (/location/i.test(msg)) {
        setErrorMessage('Phone Location (GPS) is OFF. Please turn ON Location and scan the QR again.');
        Alert.alert(
          'Turn ON Location',
          'Please turn ON your phone Location (GPS) to scan and connect to the device.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Location Settings',
              onPress: () =>
                Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() =>
                  Linking.openSettings()
                ),
            },
          ]
        );
      } else {
        setErrorMessage(
          `Could not connect to "${apName}". Make sure the device is powered ON and nearby, then scan again.`
        );
      }
    }
  };

  const scanAvailableWifiNetworks = async (overrideApSsid) => {
    setIsScanning(true);
    try {
      const networks = await WifiManager.loadWifiList();
      setWifiList(filterNearbyNetworks(networks, overrideApSsid || targetApSsid));
    } catch (err) {
      console.log('[Wi-Fi Scan Error]:', err);
      const msg = String(err?.message || err || '');

      if (/location/i.test(msg)) {
        Alert.alert(
          'Turn ON Location',
          'Location (GPS) is required to scan nearby Wi-Fi networks.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Location Settings',
              onPress: () =>
                Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() =>
                  Linking.openSettings()
                ),
            },
          ]
        );
      } else {
        Alert.alert('Scan Error', 'Unable to fetch Wi-Fi list. Tap refresh to try again.');
      }
    } finally {
      setIsScanning(false);
    }
  };
  // ==========================================================
  // STEP 4: PASSWORD DEVICE KO BHEJO (ESP32)
  // ==========================================================

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
    setStage(STAGE.PROVISIONING);
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

    // ESP ka AP band ho jaye = device router se connect ho gaya
    pollTimer.current = setInterval(async () => {
      elapsedRef.current += POLL_EVERY_MS;
      const reachable = await isEspApReachable();

      if (reachable) {
        unreachableStreak.current = 0;
      } else {
        unreachableStreak.current += 1;
        if (unreachableStreak.current >= 2) {
          stopAllTimers();
          onDeviceProvisionSuccess();
          return;
        }
      }

      if (elapsedRef.current >= MAX_VERIFY_MS) {
        stopAllTimers();
        setStage(STAGE.SELECT_NETWORK);
        setErrorMessage('Device could not connect. Verify the password and ensure the network is 2.4 GHz.');
      }
    }, POLL_EVERY_MS);
  };

  // ==========================================================
  // STEP 5: PHONE WAPAS WI-FI SE CONNECT HONE KA WAIT
  // ==========================================================

  const onDeviceProvisionSuccess = async () => {
    setStage(STAGE.WAITING_PHONE_NET);
    setStatusMessage(`Device connected to "${selectedNetwork.SSID}". Reconnecting phone to Wi-Fi...`);

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
              deviceId: serialNo.trim(),
              firebaseUid: firebaseUid || 'DEFAULT_UID',
              ssid: selectedNetwork.SSID,
              password,
            });
          } catch (dbErr) {
            console.log('[DB Save Error]:', dbErr);
          }

          waitForDeviceOnline();
        }
      } catch (err) {
        console.log('[Phone Wi-Fi Poll]:', err);
      }
    }, 2000);
  };

  // ==========================================================
  // STEP 6: DEVICE ONLINE HONE TAK WAIT
  // ==========================================================

  const waitForDeviceOnline = async () => {
    setStage(STAGE.WAITING_ONLINE);
    setStatusMessage('Waiting for your device to come online...');

    const startedAt = Date.now();
    while (isMounted.current && Date.now() - startedAt < ONLINE_WAIT_MS) {
      const online = await checkDeviceOnlineStatus(serialNo);
      if (!isMounted.current) return;

      if (online) {
        setStage(STAGE.REGISTER);
        Alert.alert('Device Online', 'Your device is online. Now register your product.');
        return;
      }
      await sleep(2000);
    }

    if (!isMounted.current) return;
    setStage(STAGE.SCAN);
    setErrorMessage('Device did not come online. Please check the device and scan the QR again.');
  };

  // ==========================================================
  // STEP 7: INVOICE + REGISTER
  // ==========================================================

  const pickInvoice = async () => {
    try {
      const [file] = await pick({
        type: [types.images, types.pdf],
        mode: 'import',
      });

      if (file.size && file.size > MAX_FILE_SIZE) {
        Alert.alert('File too large', 'Please select a file under 10 MB.');
        return;
      }

      setInvoiceFile({
        uri: file.uri,
        name: getSafeFileName(file.name, file.type),
        type: file.type || 'application/octet-stream',
      });
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) return;
      Alert.alert('Error', 'Unable to select the file.');
    }
  };

  const goToMainScreen = (registeredSerial) => {
    if (navigation?.reset) {
      navigation.reset({
        index: 0,
        routes: [{ name: MAIN_SCREEN_ROUTE, params: { serialNumber: registeredSerial } }],
      });
    } else {
      navigation?.navigate(MAIN_SCREEN_ROUTE, { serialNumber: registeredSerial });
    }
  };

  const handleRegister = async () => {
    if (!invoiceFile) {
      Alert.alert('Invoice Required', 'Please upload your purchase invoice (photo or PDF).');
      return;
    }
    if (!customerId) {
      Alert.alert('Error', 'User session not found. Please log in again.');
      return;
    }

    setIsRegistering(true);

    try {
      const formData = new FormData();
      formData.append('customer_id', String(customerId));
      formData.append('product_name', productName.trim());
      formData.append('serial_number', serialNo.trim());
      formData.append('mac_id', macId.trim());
      formData.append('purchase_date', formatDateForAPI(purchaseDate));
      formData.append('invoice', {
        uri: invoiceFile.uri,
        name: invoiceFile.name,
        type: invoiceFile.type,
      });

      // Content-Type header mat lagao, React Native boundary khud set karta hai
      const response = await fetch(`${base_url}/register-product`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.status === 409) {
        Alert.alert('Device Already Registered', data.error || 'This device is already registered.');
      } else if (response.ok) {
        const cleanSerial = serialNo.trim();
        await AsyncStorage.setItem('serial_number', cleanSerial);
        Alert.alert('Registered', 'Your product and invoice have been saved successfully.', [
          { text: 'Go to Main Screen', onPress: () => goToMainScreen(cleanSerial) },
        ]);
      } else {
        Alert.alert('Registration Failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Registration Error:', error);
      Alert.alert('Network Error', 'Unable to connect to the server. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  // ==========================================================
  // BACK BUTTON
  // ==========================================================

  const handleBack = () => {
    if (stage === STAGE.SCAN) {
      navigation?.goBack();
      return;
    }
    stopAllTimers();
    setErrorMessage('');
    setIsCameraActive(false);
    setStage(STAGE.SCAN);
  };

  // ==========================================================
  // UI PARTS
  // ==========================================================

  const renderLoader = (title) => (
    <View style={styles.card}>
      <ActivityIndicator size="large" color={PURPLE} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{statusMessage}</Text>
    </View>
  );

  const renderScan = () => (
    <View>
      {isCameraActive ? (
        <View style={styles.cameraWrapper}>
          <Camera style={styles.cameraView} scanBarcode={true} onReadCode={onReadCode} />
          <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setIsCameraActive(false)}>
            <Feather name="x" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.scannerPlaceholder} activeOpacity={0.9} onPress={startScanner}>
          <View style={styles.cameraIconCircle}>
            <Feather name="camera" size={26} color={PURPLE} />
          </View>
          <Text style={styles.cardTitle}>Tap to Scan Product QR</Text>
          <Text style={styles.cardSub}>
            Power ON your device first, then scan the QR code on it.
          </Text>
        </TouchableOpacity>
      )}
      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  );

  const renderSelectNetwork = () => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitleLeft}>Select Wi-Fi Network</Text>
        <TouchableOpacity
          onPress={() => scanAvailableWifiNetworks()}
          disabled={isScanning}
          style={styles.refreshBtn}
        >
          <Feather name="refresh-cw" size={14} color={PURPLE} />
          <Text style={styles.refreshText}>{isScanning ? 'Scanning...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.smallNote}>Connected to {targetApSsid}</Text>

      <View style={styles.wifiListContainer}>
        {wifiList.length === 0 && !isScanning ? (
          <Text style={styles.emptyText}>No Wi-Fi networks found. Tap Refresh.</Text>
        ) : (
          <ScrollView nestedScrollEnabled>
            {wifiList.map((item) => {
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
                  <Feather name="wifi" size={16} color={isSelected ? PURPLE : '#64748B'} />
                  <Text
                    style={[styles.wifiText, isSelected && styles.wifiTextSelected]}
                    numberOfLines={1}
                  >
                    {item.SSID}
                  </Text>
                  {isSelected && <Feather name="check-circle" size={16} color={PURPLE} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {selectedNetwork && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.inputLabel}>Password for "{selectedNetwork.SSID}"</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter Wi-Fi password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  );

  const renderRegister = () => (
    <View style={{ gap: 20 }}>
      <View style={styles.onlineBadge}>
        <Feather name="check-circle" size={18} color="#15803D" />
        <Text style={styles.onlineText}>Device is online. Register your product.</Text>
      </View>

      <Text style={styles.sectionHeader}>PRODUCT DETAILS</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Product Name</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.valueText}>{productName}</Text>
          <Feather name="lock" size={16} color="#94A3B8" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Serial Number</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.valueText}>{serialNo}</Text>
          <Feather name="lock" size={16} color="#94A3B8" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>MAC ID</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.valueText}>{macId}</Text>
          <Feather name="lock" size={16} color="#94A3B8" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Date of Purchase</Text>
        <TouchableOpacity
          style={styles.inputWrapper}
          activeOpacity={0.7}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.valueText}>{formatDate(purchaseDate)}</Text>
          <Feather name="calendar" size={18} color={PURPLE} />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={purchaseDate}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setPurchaseDate(selectedDate);
          }}
        />
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Purchase Invoice</Text>
        <TouchableOpacity style={styles.invoiceCard} activeOpacity={0.8} onPress={pickInvoice}>
          <View style={styles.invoiceBadge}>
            <Feather name={invoiceFile ? 'check-circle' : 'upload'} size={22} color={PURPLE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.invoiceTitle} numberOfLines={1}>
              {invoiceFile ? invoiceFile.name : 'Upload Invoice'}
            </Text>
            <Text style={styles.invoiceSub}>
              {invoiceFile ? 'Tap to change the file' : 'Select a photo or PDF of your invoice'}
            </Text>
          </View>
          {invoiceFile && (
            <TouchableOpacity
              onPress={() => setInvoiceFile(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={18} color={PURPLE} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Bottom button: sirf SELECT_NETWORK aur REGISTER stage mein
  const renderBottomButton = () => {
    if (stage === STAGE.SELECT_NETWORK) {
      const disabled = !selectedNetwork || password.length < 8;
      return (
        <TouchableOpacity
          style={[styles.primaryButton, disabled && { opacity: 0.5 }]}
          onPress={handleProvisionDeviceWifi}
          disabled={disabled}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryButtonText}>Connect to Wi-Fi</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      );
    }

    if (stage === STAGE.REGISTER) {
      return (
        <TouchableOpacity
          style={[styles.primaryButton, isRegistering && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={isRegistering}
          activeOpacity={0.88}
        >
          {isRegistering ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Registering...</Text>
            </>
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Register Product</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  const bottomButton = renderBottomButton();

  // ==========================================================
  // MAIN RENDER
  // ==========================================================

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <AppHeader title="Register Product" onBack={handleBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {stage === STAGE.SCAN && renderScan()}
        {stage === STAGE.CONNECTING_AP && renderLoader('Connecting to device')}
        {stage === STAGE.SELECT_NETWORK && renderSelectNetwork()}
        {stage === STAGE.PROVISIONING && renderLoader('Configuring device')}
        {stage === STAGE.WAITING_PHONE_NET && renderLoader('Reconnecting your phone')}
        {stage === STAGE.WAITING_ONLINE && renderLoader('Waiting for device to be online')}
        {stage === STAGE.REGISTER && renderRegister()}
      </ScrollView>

      {bottomButton && (
        <View style={[styles.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          {bottomButton}
        </View>
      )}
    </SafeAreaView>
  );
};

export default ProductRegistrationScreen;

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingTop: 28, paddingHorizontal: 24, paddingBottom: 32, flexGrow: 1 },

  // Scanner
  scannerPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    paddingVertical: 36,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  cameraIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cameraWrapper: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  cameraView: { width: '100%', height: '100%' },
  closeCameraBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15,23,42,0.75)',
    padding: 8,
    borderRadius: 20,
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    alignItems: 'stretch',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    textAlign: 'center',
  },
  cardTitleLeft: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  cardSub: { fontSize: 13, color: '#64748B', marginTop: 6, textAlign: 'center', lineHeight: 19 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallNote: { fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 12 },
  errorText: { marginTop: 14, fontSize: 13, color: '#D32F2F', lineHeight: 18 },

  // Wi-Fi list
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4 },
  refreshText: { fontSize: 13, fontWeight: '600', color: PURPLE },
  wifiListContainer: {
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  wifiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  wifiItemSelected: { backgroundColor: '#F3E8FF' },
  wifiText: { flex: 1, fontSize: 14, color: '#0F172A' },
  wifiTextSelected: { fontWeight: '700', color: PURPLE },
  emptyText: { padding: 16, textAlign: 'center', fontSize: 13, color: '#64748B' },

  // Form
  sectionHeader: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.8 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  textInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0F172A', paddingVertical: 10 },
  valueText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0F172A' },

  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 12,
  },
  onlineText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#15803D' },

  // Invoice
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  invoiceBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceTitle: { fontSize: 14, fontWeight: '700', color: PURPLE },
  invoiceSub: { fontSize: 12, color: '#6B21A8', marginTop: 2 },

  // Bottom bar (no position: absolute, Android 3-button nav safe)
  bottomActionBar: {
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 8,
  },
  primaryButton: {
    minHeight: 52,
    backgroundColor: BRAND_GREEN,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});