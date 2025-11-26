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
import { TextInputMask } from 'react-native-masked-text';
import api from '../../services/api'; // Certifique-se que o caminho está correto

export default function ForgotPassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Solicitar Código, 2: Redefinir Senha

  // Dados do formulário
  const [cpf, setCpf] = useState('');
  const [userId, setUserId] = useState<number | null>(null); // Armazena o ID retornado na etapa 1
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ETAPA 1: Solicitar Código
  async function handleRequestCode() {
    const cleanedCpf = cpf.replace(/\D/g, '');

    if (cleanedCpf.length !== 11) {
      return Alert.alert('Erro', 'Por favor, digite um CPF válido.');
    }

    try {
      setLoading(true);
      // Endpoint conforme documentação: /password/request_recovery
      const response = await api.post('/password/request_recovery', {
        cpf: cleanedCpf
      });

      // Assumindo que a API retorna o userId necessário para o próximo passo
      // Se a API não retornar o ID aqui, precisaremos ajustar o endpoint de reset
      if (response.data && response.data.userId) {
        setUserId(response.data.userId);
      } else {
        // Fallback caso a API não retorne ID (dependendo da implementação do back-end)
        // Você pode precisar passar o CPF novamente no passo 2
      }

      Alert.alert('Código Enviado', 'Verifique seu SMS ou E-mail com o código de verificação.');
      setStep(2);

    } catch (error: any) {
      console.log(error.response?.data);
      const msg = error.response?.data?.error || 'Não foi possível enviar o código. Verifique o CPF.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  // ETAPA 2: Redefinir Senha
  async function handleResetPassword() {
    if (!code || !newPassword) {
      return Alert.alert('Erro', 'Preencha o código e a nova senha.');
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert('Erro', 'As senhas não coincidem.');
    }

    try {
      setLoading(true);

      // Endpoint conforme documentação: /password/reset
      // Body: { userId, code, newPassword }
      const payload = {
        userId: userId, // ou passar cpf se o back-end suportar
        code: code,
        newPassword: newPassword
      };

      await api.post('/password/reset', payload);

      Alert.alert('Sucesso', 'Sua senha foi redefinida com sucesso!', [
        { text: 'Fazer Login', onPress: () => router.back() }
      ]);

    } catch (error: any) {
      console.log(error.response?.data);
      const msg = error.response?.data?.error || 'Código inválido ou expirado.';
      Alert.alert('Falha na Redefinição', msg);
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
        <Text style={styles.headerTitle}>Recuperar Senha</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {step === 1 ? (
          /* --- TELA 1: SOLICITAR CÓDIGO --- */
          <>
            <Text style={styles.instructionText}>
              Informe seu CPF para receber um código de verificação via SMS/E-mail.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>CPF</Text>
              <TextInputMask
                style={styles.input}
                placeholder="Digite seu CPF"
                placeholderTextColor="#A0A0A0"
                value={cpf}
                onChangeText={setCpf}
                type="cpf"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRequestCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Enviar Código</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          /* --- TELA 2: REDEFINIR SENHA --- */
          <>
            <Text style={styles.instructionText}>
              Digite o código recebido e crie uma nova senha.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Código de Verificação</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 123456"
                placeholderTextColor="#A0A0A0"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nova Senha</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="******"
                  placeholderTextColor="#A0A0A0"
                  value={newPassword}
                  onChangeText={setNewPassword}
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Nova Senha</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="******"
                  placeholderTextColor="#A0A0A0"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Redefinir Senha</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setStep(1)}
            >
              <Text style={styles.linkText}>Reenviar código / Corrigir CPF</Text>
            </TouchableOpacity>
          </>
        )}

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
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22
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
  actionButton: {
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
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#2A9F85', fontWeight: '600' }
});
