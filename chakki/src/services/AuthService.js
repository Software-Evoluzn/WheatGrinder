import IP_CONFIG from '../services/ip.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
const BASE_URL = IP_CONFIG.BASE_URL;

const USER_STORAGE_KEY = '@rasoi_user_data';
const BIOMETRIC_ENABLED_KEY = '@biometric_enabled_user';

// ===============================
// USER LOGIN
// ===============================

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password,
      }),
    });

    const data = await response.json();

    console.log('LOGIN RESPONSE:', data);

    if (!response.ok) {
      throw new Error(
        data.error || 'Login failed'
      );
    }


    // Save logged-in user details locally
    await AsyncStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({
        customer_id: data.customer_id,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
      })
    );

    return data;

  } catch (error) {
    console.log('LOGIN ERROR:', error);
    throw error;
  }
};


// ===============================
// ENABLE BIOMETRIC ON SERVER
// ===============================
export const registerBiometricOnServer = async (customerId, publicKey) => {
  const bioDeviceId = await DeviceInfo.getUniqueId();
  const response = await fetch(`${BASE_URL}/enable-biometric`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: customerId,
      public_key: publicKey,
      bio_device_id: bioDeviceId,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to enable biometric');

  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, String(customerId));
  return data;
};

// ===============================
// BIOMETRIC LOGIN API CALL
// ===============================
export const loginWithBiometricApi = async (customerId, signature, payload) => {
  const bioDeviceId = await DeviceInfo.getUniqueId();
  const response = await fetch(`${BASE_URL}/biometric-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: customerId,
      signature,
      payload,
      bio_device_id: bioDeviceId,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Biometric login failed');

  await AsyncStorage.setItem(
    USER_STORAGE_KEY,
    JSON.stringify({
      customer_id: data.customer_id,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
    })
  );

  return data;
};

export const getBiometricCustomerId = async () => {
  console.log('Fetching biometric customer ID from AsyncStorage...');
  return await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
};

// ===============================
// GET CURRENT LOGGED-IN USER
// ===============================
export const getStoredUser = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(USER_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.log('GET USER ERROR:', error);
    return null;
  }
};

// ===============================
// LOGOUT USER
// ===============================
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.log('LOGOUT ERROR:', error);
  }
};


export const getCustomerProductCount = async (customerId) => {
  try {
    const url = `${BASE_URL}/customer-products/${customerId}`;
    console.log('Fetching product count from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('CUSTOMER PRODUCTS API RESPONSE:', JSON.stringify(data));

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch products');
    }

    // Check direct array or any common wrapper key from Flask
    if (Array.isArray(data)) return data.length;
    if (Array.isArray(data.products)) return data.products.length;
    if (Array.isArray(data.data)) return data.data.length;
    if (Array.isArray(data.devices)) return data.devices.length;
    if (Array.isArray(data.registrations)) return data.registrations.length;
    if (Array.isArray(data.items)) return data.items.length;
    if (typeof data.count === 'number') return data.count;

    // Fallback: grab the first array property inside the response object
    const firstArray = Object.values(data).find((val) => Array.isArray(val));
    if (firstArray) return firstArray.length;

    return 0;
  } catch (error) {
    console.log('PRODUCT COUNT ERROR:', error);
    return 0;
  }
};


// ===============================
// USER REGISTRATION
// ===============================

export const registerUser = async (
  name,
  mobile,
  email,
  password
) => {
  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      }),
    });

    const data = await response.json();

    console.log('REGISTER RESPONSE:', data);

    if (!response.ok) {
      throw new Error(
        data.error || 'Registration failed'
      );
    }

    return data;

  } catch (error) {
    console.log('REGISTER ERROR:', error);
    throw error;
  }
};

