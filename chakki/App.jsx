import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import IP_CONFIG from './src/services/ip.json';

const API_BASE_URL = IP_CONFIG.BASE_URL;

const App = () => {
  const [grainAlert, setGrainAlert] = useState({
    visible: false,
    title: 'Grain Over!',
    message: '',
    serialNumber: '',
  });

  const userSerialNumbersRef = useRef([]);
  const socketRef = useRef(null);

  // User ke registered devices ke serial numbers fetch karke cache karein
  const loadUserDeviceSerials = async () => {
    try {
      const customerId = await AsyncStorage.getItem('customer_id');
      if (!customerId) return;

      const response = await fetch(`${API_BASE_URL}/customer-products/${customerId}`);
      const data = await response.json();

      if (response.ok && Array.isArray(data.devices)) {
        userSerialNumbersRef.current = data.devices.map((d) =>
          (d.serial_number || '').toLowerCase()
        );
      }
    } catch (err) {
      console.log('Global device fetch error:', err);
    }
  };

  useEffect(() => {
    loadUserDeviceSerials();

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Global Socket Connected');
      // Reconnect hone par list refresh karein (agar user ne abhi login kiya ho)
      loadUserDeviceSerials();
    });

    socket.on('grain_over_alert', async (data) => {
      if (!data?.serial_number) return;

      // Agar list abhi khali hai (e.g., user ne app kholne ke baad login kiya), toh ek baar reload karein
      if (userSerialNumbersRef.current.length === 0) {
        await loadUserDeviceSerials();
      }

      const incomingSN = data.serial_number.toLowerCase();

      // Sirf tabhi alert dikhayein jab device is user ke account se linked ho
      if (userSerialNumbersRef.current.includes(incomingSN)) {
        setGrainAlert({
          visible: true,
          title: data.title || 'Grain Over!',
          message:
            data.message || 'Grain Over! Load more grain or switch off the machine',
          serialNumber: data.serial_number,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleDismissAlert = () => {
    if (socketRef.current && grainAlert.serialNumber) {
      socketRef.current.emit('clear_grain_over', {
        serial_number: grainAlert.serialNumber,
      });
    }
    setGrainAlert((prev) => ({ ...prev, visible: false }));
  };

  return (
    <>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>

      {/* Global Alert Modal - App ki har screen ke upar dikhega */}
      <Modal
        visible={grainAlert.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDismissAlert}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.alertIcon}>⚠️</Text>
            </View>

            <Text style={styles.modalTitle}>{grainAlert.title}</Text>

            {grainAlert.serialNumber ? (
              <Text style={styles.deviceTag}>
                Device: {grainAlert.serialNumber}
              </Text>
            ) : null}

            <Text style={styles.modalMessage}>{grainAlert.message}</Text>

            <TouchableOpacity
              style={styles.okButton}
              activeOpacity={0.8}
              onPress={handleDismissAlert}
            >
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default App;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertIcon: {
    fontSize: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#C62828',
    marginBottom: 4,
    textAlign: 'center',
  },
  deviceTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 22,
  },
  okButton: {
    backgroundColor: '#C62828',
    paddingVertical: 11,
    paddingHorizontal: 36,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  okButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});