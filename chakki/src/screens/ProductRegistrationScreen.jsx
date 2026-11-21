import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Camera } from 'react-native-camera-kit';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import IP_CONFIG from '../services/ip.json';

const base_url = IP_CONFIG.BASE_URL;

// Apne AppNavigator ke main screen route name ke hisaab se yahan set karein (e.g. 'MainScreen' ya 'HomeScreen')
const MAIN_SCREEN_ROUTE = 'Main';

// =====================================================================
// STEP 1: QR PARSER
// =====================================================================
const ALL_LABELS =
  'Product Name|Device Name|Device ID|Serial No|Model No|MAC ID|MDF By';

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

// =====================================================================
// STEP 2: DATE HELPERS
// =====================================================================
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateForAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// =====================================================================
// STEP 3: ONE-TIME SOCKET DEVICE STATUS CHECKER (Polling-safe for Python 3.13)
// =====================================================================
const checkDeviceOnlineStatus = (serialNumber, timeoutMs = 5000) => {
  return new Promise((resolve) => {
    const sn = String(serialNumber).trim().toLowerCase();

    const socket = io(base_url, {
      transports: ['polling'], // Avoids Flask-SocketIO Werkzeug WebSocket upgrade ConnectionError
      reconnection: false,
    });

    const cleanup = (isOnline) => {
      clearTimeout(timer);
      socket.off('device_status_update');
      socket.disconnect();
      resolve(isOnline);
    };

    const timer = setTimeout(() => {
      cleanup(false);
    }, timeoutMs);

    socket.on('connect', () => {
      socket.emit('get_device_status', { serial_number: serialNumber.trim() });
    });

    socket.on('connect_error', () => {
      cleanup(false);
    });

    socket.on('device_status_update', (data) => {
      if (!data?.serial_number) return;
      if (String(data.serial_number).toLowerCase() !== sn) return;

      if (data.status === 'online') {
        cleanup(true);
      } else if (data.status === 'offline') {
        cleanup(false);
      }
    });
  });
};

// =====================================================================
// STEP 4: SCREEN
// =====================================================================
const ProductRegistrationScreen = ({ navigation }) => {
  const [mode, setMode] = useState('scan');
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Form fields
  const [productName, setProductName] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [macId, setMacId] = useState('');
  const [customerId, setCustomerId] = useState(null);

  // Generated Invoice PDF URL state
  const [generatedInvoiceUrl, setGeneratedInvoiceUrl] = useState(null);

  // Loading state
  const [isRegistering, setIsRegistering] = useState(false);

  // Date
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const scanAnimation = useRef(new Animated.Value(0)).current;
  const hasScanned = useRef(false);

  const isDeviceDetailsComplete =
    productName.trim().length > 0 &&
    serialNo.trim().length > 0 &&
    macId.trim().length > 0;

  useEffect(() => {
    const fetchCustomerId = async () => {
      try {
        const storedId = await AsyncStorage.getItem('customer_id');
        if (storedId) setCustomerId(storedId);
      } catch (error) {
        console.error('Failed to load customer ID', error);
      }
    };
    fetchCustomerId();
  }, []);

  useEffect(() => {
    if (isCameraActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 180,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isCameraActive, scanAnimation]);

  const startScanner = () => {
    hasScanned.current = false;
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
    Alert.alert('Success', 'QR Code scanned! Tap Register Product to auto-generate your invoice PDF.');
  };

  const goToMainScreen = (registeredSerial) => {
    if (navigation?.reset) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: MAIN_SCREEN_ROUTE,
            params: { serialNumber: registeredSerial },
          },
        ],
      });
    } else {
      navigation?.navigate(MAIN_SCREEN_ROUTE, { serialNumber: registeredSerial });
    }
  };

  const handleOpenInvoicePdf = async (url, registeredSerial) => {
    const targetUrl = url || generatedInvoiceUrl;
    if (!targetUrl) return;
    try {
      await Linking.openURL(targetUrl);
    } catch (e) {
      Alert.alert('Error', 'Unable to open invoice PDF.');
    } finally {
      if (registeredSerial) goToMainScreen(registeredSerial);
    }
  };

  // ---- Register button dabane par ----
  const handleRegister = async () => {
    if (!productName.trim() || !serialNo.trim() || !macId.trim()) {
      Alert.alert('Validation Error', 'Please complete all product fields.');
      return;
    }

    if (!customerId) {
      Alert.alert('Error', 'User session not found. Please log in again.');
      return;
    }

    setIsRegistering(true);

    try {
      // 1. Pehle check karo device online hai ya nahi
      const isDeviceOnline = await checkDeviceOnlineStatus(serialNo);

      if (!isDeviceOnline) {
        setIsRegistering(false);
        Alert.alert(
          'Device is Offline',
          'Your device is currently offline, so it cannot be registered. Please turn on the device and connect it to Wi-Fi, then try again.'
        );
        return;
      }

      // 2. Register Product + Auto-Generate Invoice PDF on Backend
      const response = await fetch(`${base_url}/register-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          product_name: productName.trim(),
          serial_number: serialNo.trim(),
          mac_id: macId.trim(),
          purchase_date: formatDateForAPI(purchaseDate),
        }),
      });

      const data = await response.json();

      if (response.status === 409) {
        Alert.alert(
          'Device Already Registered',
          data.error || 'This device is already registered.'
        );
      } else if (response.ok) {
        const cleanSerial = serialNo.trim();
        await AsyncStorage.setItem('serial_number', cleanSerial);

        const fullInvoiceUrl = data.invoice_path ? `${base_url}${data.invoice_path}` : null;
        setGeneratedInvoiceUrl(fullInvoiceUrl);

        Alert.alert(
          'Registered & Invoice Generated',
          'Your product is registered and your Invoice PDF has been automatically generated!',
          [
            ...(fullInvoiceUrl
              ? [
                  {
                    text: 'View Invoice PDF',
                    onPress: () => handleOpenInvoicePdf(fullInvoiceUrl, cleanSerial),
                  },
                ]
              : []),
            {
              text: 'Go to Main Screen',
              onPress: () => goToMainScreen(cleanSerial),
            },
          ]
        );
      } else {
        Alert.alert('Registration Failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Registration Error:', error);
      Alert.alert(
        'Network Error',
        'Unable to connect to the server. Please try again.'
      );
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="chevron-left" size={26} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Product</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Scan QR / Manual Entry switch */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentTab, mode === 'scan' && styles.segmentTabActive]}
            activeOpacity={0.8}
            onPress={() => {
              setMode('scan');
              setIsCameraActive(false);
            }}
          >
            <Feather
              name="qr-code"
              size={16}
              color={mode === 'scan' ? '#522D70' : '#64748B'}
            />
            <Text
              style={[styles.segmentText, mode === 'scan' && styles.segmentTextActive]}
            >
              Scan QR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, mode === 'manual' && styles.segmentTabActive]}
            activeOpacity={0.8}
            onPress={() => {
              setMode('manual');
              setIsCameraActive(false);
            }}
          >
            <Feather
              name="edit-3"
              size={16}
              color={mode === 'manual' ? '#522D70' : '#64748B'}
            />
            <Text
              style={[
                styles.segmentText,
                mode === 'manual' && styles.segmentTextActive,
              ]}
            >
              Manual Entry
            </Text>
          </TouchableOpacity>
        </View>

        {/* QR Scanner */}
        {mode === 'scan' && (
          <View style={styles.scannerContainer}>
            {isCameraActive ? (
              <View style={styles.cameraWrapper}>
                <Camera
                  style={styles.cameraView}
                  scanBarcode={true}
                  onReadCode={onReadCode}
                />
                <Animated.View
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: scanAnimation }] },
                  ]}
                />
                <TouchableOpacity
                  style={styles.closeCameraBtn}
                  onPress={() => setIsCameraActive(false)}
                >
                  <Feather name="x" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.scannerPlaceholder}
                activeOpacity={0.9}
                onPress={startScanner}
              >
                <View style={styles.cameraIconCircle}>
                  <Feather name="camera" size={26} color="#522D70" />
                </View>
                <Text style={styles.scanTitle}>Tap to Start Scanner</Text>
                <Text style={styles.scanSubText}>
                  Position product QR code within camera frame
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionHeader}>PRODUCT DETAILS</Text>

          {/* Product Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Product Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={productName}
                onChangeText={setProductName}
                placeholder="XXXXX"
                placeholderTextColor="#94A3B8"
                editable={mode === 'manual'}
              />
              {mode === 'scan' && <Feather name="lock" size={16} color="#94A3B8" />}
            </View>
          </View>

          {/* Serial Number (Device ID) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Serial Number</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={serialNo}
                onChangeText={setSerialNo}
                placeholder="SN-XXXXX"
                placeholderTextColor="#94A3B8"
                editable={mode === 'manual'}
              />
              {mode === 'scan' && <Feather name="lock" size={16} color="#94A3B8" />}
            </View>
          </View>

          {/* MAC ID */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>MAC ID</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={macId}
                onChangeText={setMacId}
                placeholder="00:00:00:00:00:00"
                placeholderTextColor="#94A3B8"
                editable={mode === 'manual'}
              />
              {mode === 'scan' && <Feather name="lock" size={16} color="#94A3B8" />}
            </View>
          </View>

          {/* Purchase Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Purchase</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              activeOpacity={0.7}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateValueText}>{formatDate(purchaseDate)}</Text>
              <Feather name="calendar" size={18} color="#522D70" />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={purchaseDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setPurchaseDate(selectedDate);
              }}
            />
          )}

          {/* Auto Invoice Info Banner */}
          {isDeviceDetailsComplete && (
            <View style={styles.autoInvoiceCard}>
              <View style={styles.pdfBadge}>
                <Feather name="file-text" size={22} color="#522D70" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.autoInvoiceTitle}>
                  {generatedInvoiceUrl ? 'Invoice PDF Ready' : 'Auto Invoice PDF'}
                </Text>
                <Text style={styles.autoInvoiceSub}>
                  {generatedInvoiceUrl
                    ? 'Tap below to view or download your invoice'
                    : 'Invoice PDF will be generated automatically upon registration'}
                </Text>
              </View>
              {generatedInvoiceUrl && (
                <TouchableOpacity
                  style={styles.viewPdfBtn}
                  onPress={() => handleOpenInvoicePdf(generatedInvoiceUrl)}
                >
                  <Feather name="download" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <Text style={styles.footerBranding}>POWERED BY EVOLUZN</Text>
      </ScrollView>

      {/* Bottom Register button */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            isRegistering && { opacity: 0.7 },
          ]}
          activeOpacity={0.88}
          onPress={handleRegister}
          disabled={isRegistering}
        >
          {isRegistering ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Generating Invoice...</Text>
            </>
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Register & Generate Invoice</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProductRegistrationScreen;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingTop: 28,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 120,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 9,
    gap: 8,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#522D70',
    fontWeight: '700',
  },
  scannerContainer: {
    marginBottom: 28,
  },
  scannerPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
  scanTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  scanSubText: {
    fontSize: 12,
    color: '#64748B',
  },
  cameraWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  cameraView: {
    width: '100%',
    height: '100%',
  },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 10,
    height: 2,
    backgroundColor: '#A855F7',
  },
  closeCameraBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    padding: 8,
    borderRadius: 20,
  },
  formContainer: {
    gap: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    padding: 0,
  },
  dateValueText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  autoInvoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginTop: 4,
  },
  pdfBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoInvoiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#522D70',
  },
  autoInvoiceSub: {
    fontSize: 12,
    color: '#6B21A8',
    marginTop: 2,
  },
  viewPdfBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#522D70',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBranding: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: 1,
    marginTop: 36,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButton: {
    height: 52,
    backgroundColor: '#522D70',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});