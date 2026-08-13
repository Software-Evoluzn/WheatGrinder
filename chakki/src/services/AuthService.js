import IP_CONFIG from '../services/ip.json';


const BASE_URL = IP_CONFIG.BASE_URL;

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

    return data;

  } catch (error) {
    console.log('LOGIN ERROR:', error);
    throw error;
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

