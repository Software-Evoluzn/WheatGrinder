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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Camera } from 'react-native-camera-kit';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IP_CONFIG from '../services/ip.json';

const base_url = IP_CONFIG.BASE_URL;

// =====================================================================
// STEP 1: QR PARSER
// QR ka text aisa hota hai:
//   Product Name : Softel Multi Grain Millet Mill
//   Device ID : softelF0C099
//   MAC ID : 8C:4C:AD:F0:C0:99
//
// Har label ke baad ka value tab tak uthate hain jab tak
// agla label na aa jaye (ya text khatam ho jaye).
// =====================================================================

// Saare labels jo QR mein aa sakte hain (naya + purana format dono)
const ALL_LABELS =
  'Product Name|Device Name|Device ID|Serial No|Model No|MAC ID|MDF By';

// Ek label ka value nikalne wala helper
// labelNames example: 'Device ID|Serial No'  (jo bhi mile wo le lo)
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
    serialNo: getValue(raw, 'Device ID|Serial No'), // Device ID hi serial number hai
    macId: getValue(raw, 'MAC ID'),
  };

  console.log('PARSED QR DATA: ', result);

  // Device ID nahi mila to QR galat hai
  if (!result.serialNo) return null;

  return result;
};

// =====================================================================
// STEP 2: DATE HELPERS
// =====================================================================

// Screen par dikhane ke liye: DD-MM-YYYY
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Flask / MySQL ko bhejne ke liye: YYYY-MM-DD
const formatDateForAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// =====================================================================
// STEP 3: SCREEN
// =====================================================================
const ProductRegistrationScreen = ({ navigation }) => {
  // 'scan' ya 'manual'
  const [mode, setMode] = useState('scan');
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Form fields
  const [productName, setProductName] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [macId, setMacId] = useState('');
  const [customerId, setCustomerId] = useState(null);

  // Date
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Scan line animation
  const scanAnimation = useRef(new Animated.Value(0)).current;

  // Camera ek hi QR ko baar-baar read karta hai, ye usse rokta hai
  const hasScanned = useRef(false);

  // ---- Screen khulte hi customer_id nikalo ----
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

  // ---- Camera on ho to scan line chalao ----
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
  }, [isCameraActive]);

  // ---- Camera start karna ----
  const startScanner = () => {
    hasScanned.current = false; // naya scan allow karo
    setIsCameraActive(true);
  };

  // ---- QR scan hone par ----
  const onReadCode = (event) => {
    if (hasScanned.current) return; // pehle hi scan ho chuka hai

    const qrData = event.nativeEvent.codeStringValue;
    console.log('QR Scanned: ', qrData);

    if (!qrData) return;

    const parsed = parseQR(qrData);

    if (!parsed) {
      Alert.alert('Invalid QR', 'QR Code format is not valid.');
      return;
    }

    hasScanned.current = true;

    // Form mein data bharo
    setProductName(parsed.productName);
    setSerialNo(parsed.serialNo);
    setMacId(parsed.macId);

    setIsCameraActive(false);
    Alert.alert('Success', 'QR Code scanned successfully!');
  };

  // ---- Register button dabane par ----
  const handleRegister = async () => {
    // Model No required nahi hai (naye QR mein nahi aata)
    if (!productName.trim() || !serialNo.trim() || !macId.trim()) {
      Alert.alert('Validation Error', 'Please complete all product fields.');
      return;
    }

    if (!customerId) {
      Alert.alert('Error', 'User session not found. Please log in again.');
      return;
    }

    try {
      const response = await fetch(`${base_url}/register-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          product_name: productName,
          serial_number: serialNo, // Device ID
          mac_id: macId,
          purchase_date: formatDateForAPI(purchaseDate),
        }),
      });

      const data = await response.json();

      if (response.status === 409) {
        // Device pehle se registered hai
        Alert.alert(
          'Device Already Registered',
          data.error || 'This device is already registered.'
        );
      } else if (response.ok) {

        
        // Success
        Alert.alert(
          'Success',
          data.message || 'Product Registered Successfully',
          [{ text: 'OK', onPress: () => navigation?.goBack() }]
        );
      } else {
        // Baaki errors
        Alert.alert('Registration Failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Registration Error:', error);
      Alert.alert(
        'Network Error',
        'Unable to connect to the server. Please try again.'
      );
    }
  };

  // ===================================================================
  // UI
  // ===================================================================
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
        </View>

        <Text style={styles.footerBranding}>POWERED BY EVOLUZN</Text>
      </ScrollView>

      {/* Bottom Register button */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.88}
          onPress={handleRegister}
        >
          <Text style={styles.primaryButtonText}>Register Product</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProductRegistrationScreen;

// =====================================================================
// STYLES (same as before, koi change nahi)
// =====================================================================
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