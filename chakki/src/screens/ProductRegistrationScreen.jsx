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

const parseQR = (raw) => {
  if (!raw) return null;
  const result = {};

  const patterns = [
    { key: 'deviceName', regex: /Device Name\s*:\s*(.*?)\s*(?=Model No\s*:|$)/i },
    { key: 'modelNo', regex: /Model No\s*:\s*(.*?)\s*(?=Serial No\s*:|$)/i },
    { key: 'serialNo', regex: /Serial No\s*:\s*(.*?)\s*(?=MAC ID\s*:|$)/i },
    { key: 'macId', regex: /MAC ID\s*:\s*(.*?)\s*(?=MDF By\s*:|$)/i },
  ];

  patterns.forEach(({ key, regex }) => {
    const match = raw.match(regex);
    if (match) {
      result[key] = match[1].trim();
    }
  });

  return result;
};

const ProductRegistrationScreen = ({ navigation }) => {
  const [mode, setMode] = useState('scan');
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Form Fields
  const [serialNo, setSerialNo] = useState('SN-45879234');
  const [modelNo, setModelNo] = useState('MODEL-X200');
  const [macId, setMacId] = useState('00:1A:C2:7B:9F:11');

  // Date State
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Scan line animation
  const scanAnimation = useRef(new Animated.Value(0)).current;

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

  const onReadCode = (event) => {
    const qrData = event.nativeEvent.codeStringValue;
    const parsed = parseQR(qrData);

    if (parsed) {
      if (parsed.serialNo) setSerialNo(parsed.serialNo);
      if (parsed.modelNo) setModelNo(parsed.modelNo);
      if (parsed.macId) setMacId(parsed.macId);
      setIsCameraActive(false);
      Alert.alert('Success', 'QR Code scanned successfully!');
    } else {
      Alert.alert('Invalid QR', 'Could not parse QR details.');
    }
  };

  const handleRegister = () => {
    if (!serialNo.trim() || !modelNo.trim() || !macId.trim()) {
      Alert.alert('Validation Error', 'Please complete all product fields.');
      return;
    }

    Alert.alert(
      'Product Registered',
      `Serial: ${serialNo}\nModel: ${modelNo}\nMAC: ${macId}`,
      [
        {
          text: 'OK',
          onPress: () => navigation?.goBack(),
        },
      ]
    );
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header Bar with extra top spacing */}
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

      {/* Main Scroll Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Segmented Control Switcher */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              mode === 'scan' && styles.segmentTabActive,
            ]}
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
              style={[
                styles.segmentText,
                mode === 'scan' && styles.segmentTextActive,
              ]}
            >
              Scan QR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              mode === 'manual' && styles.segmentTabActive,
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

        {/* QR Viewfinder Card */}
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
                onPress={() => setIsCameraActive(true)}
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

        {/* Input Form Fields */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionHeader}>PRODUCT DETAILS</Text>

          {/* Serial Number */}
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
              {mode === 'scan' && (
                <Feather name="lock" size={16} color="#94A3B8" />
              )}
            </View>
          </View>

          {/* Model Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Model Number</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={modelNo}
                onChangeText={setModelNo}
                placeholder="MODEL-XXXX"
                placeholderTextColor="#94A3B8"
                editable={mode === 'manual'}
              />
              {mode === 'scan' && (
                <Feather name="lock" size={16} color="#94A3B8" />
              )}
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
              {mode === 'scan' && (
                <Feather name="lock" size={16} color="#94A3B8" />
              )}
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

      {/* Sticky Bottom Action Bar */}
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

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* Header Bar with explicit padding to push Back Button & Title down */
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