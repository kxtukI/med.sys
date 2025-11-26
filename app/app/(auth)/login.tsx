import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { TextInputMask } from 'react-native-masked-text';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!identifier || !password) {
      return Alert.alert('Erro', 'Preencha todos os campos.');
    }

    try {
      setLoading(true);
      await signIn({ identifier, password });
    } catch (error: any) {
      let msg = 'Verifique suas credenciais.';
      if (error.message === 'acesso_negado_perfil') msg = 'Acesso exclusivo para Pacientes.';
      else if (error.response?.status === 401) msg = 'CPF ou senha incorretos.';
      Alert.alert('Falha no Login', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hello!</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.welcomeText}>Bem-Vindo</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>CPF</Text>
          <TextInputMask
            style={styles.input}
            placeholder="Digite seu CPF"
            placeholderTextColor="#A0A0A0"
            value={identifier}
            onChangeText={setIdentifier}
            type="cpf"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Senha</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="******"
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#2A9F85"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#2A9F85',
    height: 120,
    paddingTop: 40,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  backButton: { position: 'absolute', top: 50, left: 20 },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10
  },
  content: { padding: 24, paddingTop: 40 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#2A9F85', marginBottom: 30 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#E0F7FA',
    borderRadius: 30,
    height: 50,
    paddingHorizontal: 20
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#E0F7FA',
    borderRadius: 30,
    height: 50,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  passwordInput: { flex: 1 },
  loginButton: {
    backgroundColor: '#2A9F85',
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
