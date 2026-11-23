import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import DateTimePicker from '@react-native-community/datetimepicker';
import { Camera } from 'react-native-camera-kit';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import {
  pick,
  types,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';

import IP_CONFIG from '../services/ip.json';
import { AppHeader } from './ui';

const base_url = IP_CONFIG.BASE_URL;
const BRAND_GREEN = '#7DC24D';
const MAIN_SCREEN_ROUTE = 'Main';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ============================================================
// QR CODE PARSER
// ============================================================

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

// ============================================================
// DATE HELPERS
// ============================================================

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

// ============================================================
// FILE NAME HELPER
// Backend extension se file allow karta hai (jpg, png, webp, pdf),
// isliye agar file ke naam mein extension na ho to MIME type se laga do.
// ============================================================

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

  const ext = MIME_TO_EXT[mimeType] || 'jpg';
  return `${fileName}.${ext}`;
};

// ============================================================
// DEVICE ONLINE STATUS CHECK
// ============================================================

const checkDeviceOnlineStatus = (
  serialNumber,
  timeoutMs = 5000
) => {
  return new Promise((resolve) => {
    const sn = String(serialNumber).trim().toLowerCase();

    const socket = io(base_url, {
      transports: ['polling'],
      reconnection: false,
    });

    let settled = false;

    const cleanup = (isOnline) => {
      if (settled) return;
      settled = true;

      clearTimeout(timer);
      socket.off('device_status_update');
      socket.disconnect();

      resolve(isOnline);
    };

    const timer = setTimeout(() => {
      cleanup(false);
    }, timeoutMs);

    socket.on('connect', () => {
      socket.emit('get_device_status', {
        serial_number: serialNumber.trim(),
      });
    });

    socket.on('connect_error', () => {
      cleanup(false);
    });

    socket.on('device_status_update', (data) => {
      if (!data?.serial_number) return;

      if (
        String(data.serial_number).toLowerCase() !== sn
      ) {
        return;
      }

      if (data.status === 'online') {
        cleanup(true);
      } else if (data.status === 'offline') {
        cleanup(false);
      }
    });
  });
};

// ============================================================
// PRODUCT REGISTRATION SCREEN
// ============================================================

const ProductRegistrationScreen = ({ navigation }) => {

  // ANDROID 3 BUTTON NAVIGATION FIX
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState('scan');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const [productName, setProductName] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [macId, setMacId] = useState('');

  const [customerId, setCustomerId] = useState(null);

  // User ki upload ki hui invoice (photo ya PDF)
  const [invoiceFile, setInvoiceFile] = useState(null);

  const [isRegistering, setIsRegistering] = useState(false);

  const [purchaseDate, setPurchaseDate] = useState(
    new Date()
  );

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const scanAnimation = useRef(
    new Animated.Value(0)
  ).current;

  const hasScanned = useRef(false);

  // ==========================================================
  // LOAD CUSTOMER ID
  // ==========================================================

  useEffect(() => {
    const fetchCustomerId = async () => {
      try {
        const storedId = await AsyncStorage.getItem(
          'customer_id'
        );

        if (storedId) {
          setCustomerId(storedId);
        }
      } catch (error) {
        console.error(
          'Failed to load customer ID',
          error
        );
      }
    };

    fetchCustomerId();
  }, []);

  // ==========================================================
  // SCANNER ANIMATION
  // ==========================================================

  useEffect(() => {
    if (!isCameraActive) return;

    const animation = Animated.loop(
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
    );

    animation.start();

    return () => {
      animation.stop();
      scanAnimation.setValue(0);
    };
  }, [isCameraActive, scanAnimation]);

  // ==========================================================
  // START QR SCANNER
  // ==========================================================

  const startScanner = () => {
    hasScanned.current = false;
    setIsCameraActive(true);
  };

  const onReadCode = (event) => {
    if (hasScanned.current) return;

    const qrData =
      event.nativeEvent.codeStringValue;

    if (!qrData) return;

    const parsed = parseQR(qrData);

    if (!parsed) {
      Alert.alert(
        'Invalid QR',
        'QR Code format is not valid.'
      );
      return;
    }

    hasScanned.current = true;

    setProductName(parsed.productName);
    setSerialNo(parsed.serialNo);
    setMacId(parsed.macId);

    setIsCameraActive(false);

    Alert.alert(
      'Success',
      'QR Code scanned! Now upload your invoice and tap Register Product.'
    );
  };

  // ==========================================================
  // NAVIGATE TO MAIN SCREEN
  // ==========================================================

  const goToMainScreen = (registeredSerial) => {
    if (navigation?.reset) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: MAIN_SCREEN_ROUTE,
            params: {
              serialNumber: registeredSerial,
            },
          },
        ],
      });
    } else {
      navigation?.navigate(MAIN_SCREEN_ROUTE, {
        serialNumber: registeredSerial,
      });
    }
  };

  // ==========================================================
  // PICK INVOICE (PHOTO OR PDF)
  // ==========================================================

  const pickInvoice = async () => {
    try {
      const [file] = await pick({
        type: [types.images, types.pdf],
        mode: 'import', // file app ke cache mein copy ho jati hai
      });

      if (file.size && file.size > MAX_FILE_SIZE) {
        Alert.alert(
          'File too large',
          'Please select a file under 10 MB.'
        );
        return;
      }

      setInvoiceFile({
        uri: file.uri,
        name: getSafeFileName(file.name, file.type),
        type: file.type || 'application/octet-stream',
      });
    } catch (error) {
      // User ne picker cancel kiya to kuch mat karo
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return;
      }

      Alert.alert('Error', 'Unable to select the file.');
    }
  };

  // ==========================================================
  // REGISTER PRODUCT
  // ==========================================================

  const handleRegister = async () => {

    if (
      !productName.trim() ||
      !serialNo.trim() ||
      !macId.trim()
    ) {
      Alert.alert(
        'Validation Error',
        'Please complete all product fields.'
      );
      return;
    }

    if (!invoiceFile) {
      Alert.alert(
        'Invoice Required',
        'Please upload your purchase invoice (photo or PDF).'
      );
      return;
    }

    if (!customerId) {
      Alert.alert(
        'Error',
        'User session not found. Please log in again.'
      );
      return;
    }

    setIsRegistering(true);

    try {

      // CHECK DEVICE ONLINE STATUS

      const isDeviceOnline =
        await checkDeviceOnlineStatus(serialNo);

      if (!isDeviceOnline) {
        Alert.alert(
          'Device is Offline',
          'Your device is currently offline, so it cannot be registered. Please turn on the device and connect it to Wi-Fi, then try again.'
        );
        return;
      }

      // REGISTER PRODUCT API (multipart/form-data)

      const formData = new FormData();
      formData.append('customer_id', String(customerId));
      formData.append('product_name', productName.trim());
      formData.append('serial_number', serialNo.trim());
      formData.append('mac_id', macId.trim());
      formData.append(
        'purchase_date',
        formatDateForAPI(purchaseDate)
      );
      formData.append('invoice', {
        uri: invoiceFile.uri,
        name: invoiceFile.name,
        type: invoiceFile.type,
      });

      // NOTE: Content-Type header mat lagao,
      // React Native boundary khud set kar deta hai.
      const response = await fetch(
        `${base_url}/register-product`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (response.status === 409) {
        Alert.alert(
          'Device Already Registered',
          data.error ||
            'This device is already registered.'
        );
      } else if (response.ok) {

        const cleanSerial = serialNo.trim();

        await AsyncStorage.setItem(
          'serial_number',
          cleanSerial
        );

        Alert.alert(
          'Registered',
          'Your product and invoice have been saved successfully.',
          [
            {
              text: 'Go to Main Screen',
              onPress: () =>
                goToMainScreen(cleanSerial),
            },
          ]
        );

      } else {
        Alert.alert(
          'Registration Failed',
          data.error || 'Something went wrong.'
        );
      }

    } catch (error) {
      console.error(
        'Registration Error:',
        error
      );

      Alert.alert(
        'Network Error',
        'Unable to connect to the server. Please try again.'
      );

    } finally {
      setIsRegistering(false);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <SafeAreaView
      style={styles.safeContainer}
      edges={['top', 'left', 'right']}
    >

      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      {/* SHARED HEADER */}

      <AppHeader
        title="Register Product"
        onBack={() => navigation?.goBack()}
      />

      {/* SCROLLABLE CONTENT */}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >

        {/* SCAN QR / MANUAL ENTRY */}

        <View style={styles.segmentedControl}>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              mode === 'scan' &&
                styles.segmentTabActive,
            ]}
            activeOpacity={0.8}
            onPress={() => {
              setMode('scan');
              setIsCameraActive(false);
            }}
          >
            <Feather
              name="maximize"
              size={16}
              color={
                mode === 'scan'
                  ? '#522D70'
                  : '#64748B'
              }
            />

            <Text
              style={[
                styles.segmentText,
                mode === 'scan' &&
                  styles.segmentTextActive,
              ]}
            >
              Scan QR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              mode === 'manual' &&
                styles.segmentTabActive,
            ]}
            activeOpacity={0.8}
            onPress={() => {
              setMode('manual');
              setIsCameraActive(false);
            }}
          >
            <Feather
              name="edit-3"
              size={16}
              color={
                mode === 'manual'
                  ? '#522D70'
                  : '#64748B'
              }
            />

            <Text
              style={[
                styles.segmentText,
                mode === 'manual' &&
                  styles.segmentTextActive,
              ]}
            >
              Manual Entry
            </Text>
          </TouchableOpacity>

        </View>

        {/* QR SCANNER */}

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
                  pointerEvents="none"
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanAnimation,
                        },
                      ],
                    },
                  ]}
                />

                <TouchableOpacity
                  style={styles.closeCameraBtn}
                  onPress={() =>
                    setIsCameraActive(false)
                  }
                >
                  <Feather
                    name="x"
                    size={18}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

              </View>

            ) : (

              <TouchableOpacity
                style={styles.scannerPlaceholder}
                activeOpacity={0.9}
                onPress={startScanner}
              >

                <View style={styles.cameraIconCircle}>
                  <Feather
                    name="camera"
                    size={26}
                    color="#522D70"
                  />
                </View>

                <Text style={styles.scanTitle}>
                  Tap to Start Scanner
                </Text>

                <Text style={styles.scanSubText}>
                  Position product QR code within camera frame
                </Text>

              </TouchableOpacity>

            )}

          </View>
        )}

        {/* PRODUCT DETAILS */}

        <View style={styles.formContainer}>

          <Text style={styles.sectionHeader}>
            PRODUCT DETAILS
          </Text>

          {/* PRODUCT NAME */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              Product Name
            </Text>

            <View style={styles.inputWrapper}>

              <TextInput
                style={styles.textInput}
                value={productName}
                onChangeText={setProductName}
                placeholder="XXXXX"
                placeholderTextColor="#94A3B8"
                editable={mode === 'manual'}
              />

              {mode === 'scan' && (
                <Feather
                  name="lock"
                  size={16}
                  color="#94A3B8"
                />
              )}

            </View>
          </View>

          {/* SERIAL NUMBER */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              Serial Number
            </Text>

            <View style={styles.inputWrapper}>

              <TextInput
                style={styles.textInput}
                value={serialNo}
                onChangeText={setSerialNo}
                placeholder="SN-XXXXX"
                placeholderTextColor="#94A3B8"
                editable={mode === 'manual'}
                autoCapitalize="characters"
              />

              {mode === 'scan' && (
                <Feather
                  name="lock"
                  size={16}
                  color="#94A3B8"
                />
              )}

            </View>
          </View>

          {/* MAC ID */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              MAC ID
            </Text>

            <View style={styles.inputWrapper}>

              <TextInput
                style={styles.textInput}
                value={macId}
                onChangeText={setMacId}
                placeholder="00:00:00:00:00:00"
                placeholderTextColor="#94A3B8"
                editable={mode === 'manual'}
                autoCapitalize="characters"
              />

              {mode === 'scan' && (
                <Feather
                  name="lock"
                  size={16}
                  color="#94A3B8"
                />
              )}

            </View>
          </View>

          {/* DATE OF PURCHASE */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              Date of Purchase
            </Text>

            <TouchableOpacity
              style={styles.inputWrapper}
              activeOpacity={0.7}
              onPress={() =>
                setShowDatePicker(true)
              }
            >

              <Text style={styles.dateValueText}>
                {formatDate(purchaseDate)}
              </Text>

              <Feather
                name="calendar"
                size={18}
                color="#522D70"
              />

            </TouchableOpacity>
          </View>

          {/* DATE PICKER */}

          {showDatePicker && (
            <DateTimePicker
              value={purchaseDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);

                if (selectedDate) {
                  setPurchaseDate(selectedDate);
                }
              }}
            />
          )}

          {/* UPLOAD INVOICE (PHOTO / PDF) */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              Purchase Invoice
            </Text>

            <TouchableOpacity
              style={styles.autoInvoiceCard}
              activeOpacity={0.8}
              onPress={pickInvoice}
            >

              <View style={styles.pdfBadge}>
                <Feather
                  name={
                    invoiceFile
                      ? 'check-circle'
                      : 'upload'
                  }
                  size={22}
                  color="#522D70"
                />
              </View>

              <View style={{ flex: 1 }}>

                <Text
                  style={styles.autoInvoiceTitle}
                  numberOfLines={1}
                >
                  {invoiceFile
                    ? invoiceFile.name
                    : 'Upload Invoice'}
                </Text>

                <Text style={styles.autoInvoiceSub}>
                  {invoiceFile
                    ? 'Tap to change the file'
                    : 'Select a photo or PDF of your invoice'}
                </Text>

              </View>

              {invoiceFile && (
                <TouchableOpacity
                  onPress={() => setInvoiceFile(null)}
                  hitSlop={{
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 10,
                  }}
                >
                  <Feather
                    name="x"
                    size={18}
                    color="#522D70"
                  />
                </TouchableOpacity>
              )}

            </TouchableOpacity>
          </View>

        </View>

      </ScrollView>

      {/* ====================================================
          FIXED BOTTOM ACTION BAR
          SAFE ABOVE ANDROID 3 BUTTON NAVIGATION
          ==================================================== */}

      <View
        style={[
          styles.bottomActionBar,
          {
            paddingBottom:
              Math.max(insets.bottom, 12) + 8,
          },
        ]}
      >

        <TouchableOpacity
          style={[
            styles.primaryButton,
            isRegistering && {
              opacity: 0.7,
            },
          ]}
          activeOpacity={0.88}
          onPress={handleRegister}
          disabled={isRegistering}
          accessibilityRole="button"
          accessibilityLabel="Register Product"
        >

          {isRegistering ? (

            <>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text
                style={styles.primaryButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Registering...
              </Text>
            </>

          ) : (

            <>
              <Text
                style={styles.primaryButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Register Product
              </Text>

              <Feather
                name="arrow-right"
                size={18}
                color="#FFFFFF"
              />
            </>

          )}

        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
};

export default ProductRegistrationScreen;

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 32,
    flexGrow: 1,
  },

  // ==========================================================
  // SEGMENTED CONTROL
  // ==========================================================

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
    paddingHorizontal: 4,
    borderRadius: 9,
    gap: 8,
  },

  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    flexShrink: 1,
  },

  segmentTextActive: {
    color: '#522D70',
    fontWeight: '700',
  },

  // ==========================================================
  // QR SCANNER
  // ==========================================================

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
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
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
    textAlign: 'center',
  },

  scanSubText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
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
    backgroundColor: 'rgba(15,23,42,0.75)',
    padding: 8,
    borderRadius: 20,
  },

  // ==========================================================
  // PRODUCT DETAILS FORM
  // ==========================================================

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
    minHeight: 50,
  },

  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 0,
    minWidth: 0,
  },

  dateValueText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },

  // ==========================================================
  // INVOICE UPLOAD CARD
  // ==========================================================

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

  // ==========================================================
  // ANDROID 3 BUTTON NAVIGATION FIX
  // ==========================================================

  bottomActionBar: {

    // IMPORTANT:
    // No position: 'absolute'
    // No bottom: 0

    flexShrink: 0,
    backgroundColor: '#FFFFFF',

    paddingHorizontal: 24,
    paddingTop: 14,

    // Dynamic bottom padding comes from useSafeAreaInsets()

    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
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
    paddingVertical: 10,
    gap: 8,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },

});