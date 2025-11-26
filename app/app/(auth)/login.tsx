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

      // Remove pontos e traços do CPF antes de enviar
      const cleanIdentifier = identifier.replace(/\D/g, '');

      // Envia o identificador limpo (apenas números)
      await signIn({ identifier: cleanIdentifier, password });

    } catch (error: any) {
      console.log('Erro Login:', error);
      let msg = 'Verifique suas credenciais.';

      if (error.message === 'acesso_negado_perfil') {
        msg = 'Acesso exclusivo para Pacientes.';
      } else if (error.response?.status === 401) {
        msg = 'CPF ou senha incorretos.';
      } else if (error.response?.data?.error) {
        msg = error.response.data.error;
      }

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
        <Text style={styles.headerTitle}>Bem-vindo!</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* MENSAGEM DE BOAS VINDAS */}
        <Text style={styles.welcomeText}>Faça login para continuar</Text>

        {/* INPUT CPF */}
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

        {/* INPUT SENHA */}
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

          {/* LINK ESQUECEU SENHA */}
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={styles.forgotText}>Esqueceu a senha?</Text>
          </TouchableOpacity>
        </View>

        {/* BOTÃO LOGIN */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        {/* LINK CADASTRAR-SE */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Não tem conta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.signupLink}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>

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
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2A9F85',
    marginBottom: 30,
    textAlign: 'center'
  },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: {
    backgroundColor: '#E0F7FA',
    borderRadius: 30,
    height: 50,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#333'
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#E0F7FA',
    borderRadius: 30,
    height: 50,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  passwordInput: { flex: 1, fontSize: 16, color: '#333' },

  // Estilos novos para Esqueceu a Senha
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingVertical: 5,
  },
  forgotText: {
    color: '#2A9F85',
    fontWeight: '600',
    fontSize: 14
  },

  loginButton: {
    backgroundColor: '#2A9F85',
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Estilos para rodapé de cadastro
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  signupText: {
    color: '#666',
    fontSize: 16,
  },
  signupLink: {
    color: '#2A9F85',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
