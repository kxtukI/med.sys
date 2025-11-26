import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const BASE_URL = 'https://med-sys-3z00.onrender.com/';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Erro ao recuperar token:', error);
  }
  return config;
});

export default api;
