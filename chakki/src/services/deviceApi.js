import IP_CONFIG from '../services/ip.json'



// api/deviceApi.js
const API_BASE_URL = IP_CONFIG.BASE_URL;

// Reads the response safely: returns JSON, or a clear error if the server sent HTML
const parseResponse = async (response, url) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error(`Non-JSON response from ${url} (status ${response.status}):`, text.slice(0, 200));
    return {
      success: false,
      error: `Server error ${response.status} at ${url.replace(API_BASE_URL, '')}`,
    };
  }
};

export const sendDeviceCommand = async (serialNumber, action, extraPayload = {}, subTopic = 'control') => {
  const url = `${API_BASE_URL}/api/mqtt/publish`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serial_number: serialNumber,
        action,
        sub_topic: subTopic,
        payload: extraPayload,
      }),
    });
    return await parseResponse(response, url);
  } catch (error) {
    console.error('API Error in sendDeviceCommand:', error);
    return { success: false, error: error.message };
  }
};


// // DB se serial_number fetch karne ka function
// export const fetchRegisteredSerialNumber = async (customerId = 1) => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/api/products/get-serial?customer_id=${customerId}`);
//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error("Fetch Serial Number Error:", error);
//     return { success: false, error: error.message };
//   }
// };