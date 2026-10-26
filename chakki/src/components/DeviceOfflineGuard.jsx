import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { io } from 'socket.io-client';
import IP_CONFIG from '../services/ip.json';
import { useAppTheme } from '../services/theme';

const API_BASE_URL = IP_CONFIG.BASE_URL;
const OFFLINE_GRACE_MS = 5000; // itni der loading, phir button
const POLL_MS = 10000;         // safety: har 10 sec status dobara maango

const DeviceOfflineGuard = ({
  navigation,
  serialNumber,
  homeRouteName = 'Main', // navigator mein registered Home screen ka naam
}) => {
  const { colors } = useAppTheme();
  const [isOffline, setIsOffline] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const offlineRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!serialNumber) return;

    const sn = String(serialNumber).toLowerCase();

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleStatus = (status) => {
      if (status === 'online') {
        clearTimer();
        offlineRef.current = false;
        setIsOffline(false);
        setShowButton(false);
      } else if (status === 'offline') {
        if (offlineRef.current) return; // already offline, timer chal raha hai
        offlineRef.current = true;
        setIsOffline(true);
        setShowButton(false);
        clearTimer();
        timerRef.current = setTimeout(() => setShowButton(true), OFFLINE_GRACE_MS);
      }
      // baaki raw messages (cleaning_done, pause_screen etc.) ignore
    };

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    const askStatus = () =>
      socket.emit('get_device_status', { serial_number: serialNumber });

    socket.on('connect', askStatus);
    socket.on('device_status_update', (data) => {
      if (!data?.serial_number) return;
      if (String(data.serial_number).toLowerCase() !== sn) return;
      handleStatus(data.status);
    });

    const poll = setInterval(() => {
      if (socket.connected) askStatus();
    }, POLL_MS);

    return () => {
      clearInterval(poll);
      clearTimer();
      socket.disconnect();
    };
  }, [serialNumber]);

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: homeRouteName }] });
  };

  return (
    <Modal
      transparent
      visible={isOffline}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Device is offline
          </Text>

          {!showButton ? (
            <>
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={styles.loader}
              />
              <Text style={[styles.message, { color: colors.subText }]}>
                Waiting for device to get online...
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.message, { color: colors.subText }]}>
                Device  is still offline. Please back to home screen .
              </Text>
              <Pressable
                onPress={goHome}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.buttonText}>BACK TO HOME</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default DeviceOfflineGuard;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  loader: {
    marginVertical: 16,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  button: {
    alignSelf: 'stretch',
    marginTop: 20,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});