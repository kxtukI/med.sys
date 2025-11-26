import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  user_type: 'patient' | 'professional' | 'admin';
  phone?: string;
  birth_date?: string;
  photo_url?: string; // Adicionado campo de foto
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (credentials: { identifier: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: User) => Promise<void>; // Nova função
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = async () => {
    try {
       await api.post('/logout').catch(() => {});
    } finally {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  // --- NOVA FUNÇÃO: Atualizar Usuário Localmente ---
  const updateUser = async (newUserData: User) => {
      try {
          // Mescla os dados antigos com os novos para não perder info
          const updated = { ...user, ...newUserData };
          setUser(updated);
          await SecureStore.setItemAsync('auth_user', JSON.stringify(updated));
      } catch (error) {
          console.log("Erro ao atualizar contexto:", error);
      }
  };

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && user) {
          Alert.alert("Sessão Expirada", "Por favor, faça login novamente.");
          await signOut();
        }
        return Promise.reject(error);
      }
    );
    return () => { api.interceptors.response.eject(interceptorId); };
  }, [user]);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        const storedUser = await SecureStore.getItemAsync('auth_user');
        if (token && storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.user_type === 'patient') {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(userData);
          } else {
             await signOut();
          }
        }
      } catch (error) { console.error(error); }
      finally { setIsLoading(false); }
    }
    loadStorageData();
  }, []);

  async function signIn({ identifier, password }: { identifier: string; password: string }) {
    try {
      const isEmail = identifier.includes('@');
      const cleanedCpf = identifier.replace(/\D/g, '');
      const payload = isEmail ? { email: identifier, password } : { cpf: cleanedCpf, password };

      const response = await api.post('/sessions', payload);
      const { token, user: userData } = response.data;

      if (userData.user_type !== 'patient') throw new Error('acesso_negado_perfil');

      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('auth_user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
    } catch (error) { throw error; }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
}
