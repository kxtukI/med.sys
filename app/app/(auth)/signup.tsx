import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { TextInputMask } from 'react-native-masked-text';

const convertDateToISO = (dateString: string): string => {
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }
  return '';
};

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    sus_number: '',
    birth_date: '',
    phone: '',
    password: '',
  });

  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  async function handleSignup() {
    if (formData.password !== confirmPassword) {
      return Alert.alert('Erro de Segurança', 'A senha e a confirmação não coincidem.');
    }

    const cleanedCpf = formData.cpf.replace(/\D/g, '');
    const cleanedSus = formData.sus_number.replace(/\D/g, '');
    const requiredFields = [
      formData.name,
      cleanedCpf,
      cleanedSus,
      formData.birth_date,
      formData.phone,
      formData.password
    ];

    if (requiredFields.some(v => v.trim() === '')) {
      return Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
    }

    if (cleanedSus.length !== 15) {
      return Alert.alert('Erro', 'O Número do SUS deve ter 15 dígitos.');
    }

    const convertedDate = convertDateToISO(formData.birth_date);
    if (!convertedDate) {
      return Alert.alert('Erro', 'Formato da data de nascimento inválido. Use DD/MM/AAAA.');
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name,
        password: formData.password,
        cpf: cleanedCpf,
        phone: formData.phone.replace(/\D/g, ''),
        sus_number: cleanedSus,
        birth_date: convertedDate,
      };

      await api.post('/patients', payload);

      Alert.alert('Sucesso', 'Conta criada com sucesso!', [
        { text: 'Fazer Login', onPress: () => router.back() }
      ]);

    } catch (error: any) {
      console.log(error.response?.data);
      const msg =
        error.response?.data?.error ||
        'Verifique se o CPF/SUS já está cadastrado ou se o formato da data está correto.';
      Alert.alert('Erro no Cadastro', msg);
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
        <Text style={styles.headerTitle}>Nova Conta</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Dados de Acesso e Pessoais</Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Nome Completo *"
            placeholderTextColor="#A0A0A0"
            value={formData.name}
            onChangeText={t => handleChange('name', t)}
          />
        </View>

        <View style={styles.inputGroup}>
          <TextInputMask
            style={styles.input}
            placeholder="CPF *"
            placeholderTextColor="#A0A0A0"
            keyboardType="numeric"
            type="cpf"
            value={formData.cpf}
            onChangeText={t => handleChange('cpf', t)}
          />
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Nº do SUS (15 dígitos) *"
            placeholderTextColor="#A0A0A0"
            keyboardType="numeric"
            maxLength={15}
            value={formData.sus_number}
            onChangeText={t => handleChange('sus_number', t)}
          />
        </View>

        <View style={styles.row}>
          <TextInputMask
            style={[styles.input, styles.halfInput]}
            placeholder="Nasc. (DD/MM/AAAA) *"
            placeholderTextColor="#A0A0A0"
            keyboardType="numeric"
            type="datetime"
            options={{ format: 'DD/MM/YYYY' }}
            value={formData.birth_date}
            onChangeText={t => handleChange('birth_date', t)}
          />
          <TextInputMask
            style={[styles.input, styles.halfInput]}
            placeholder="Telefone *"
            placeholderTextColor="#A0A0A0"
            keyboardType="phone-pad"
            type="cel-phone"
            options={{ maskType: 'BRL', withDDD: true, dddMask: '(99) ' }}
            value={formData.phone}
            onChangeText={t => handleChange('phone', t)}
          />
        </View>

        <Text style={styles.sectionTitle}>Senha de Acesso</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Crie sua senha *"
            placeholderTextColor="#A0A0A0"
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={t => handleChange('password', t)}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#2A9F85"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirme sua senha *"
            placeholderTextColor="#A0A0A0"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#2A9F85"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.termsText}>
          Os campos com asterisco (*) são obrigatórios. O endereço será solicitado na primeira consulta.
        </Text>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#2A9F85',
    height: 100,
    paddingTop: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButton: { position: 'absolute', left: 20, top: 50, zIndex: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A9F85',
    marginTop: 10,
    marginBottom: 15
  },
  inputGroup: { marginBottom: 15 },
  input: {
    backgroundColor: '#E0F7FA',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#333'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  halfInput: { width: '48%' },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#E0F7FA',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20
  },
  passwordInput: { flex: 1, fontSize: 16, color: '#333' },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  },
  signupButton: {
    backgroundColor: '#2A9F85',
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footerSpacer: { height: 40 }
});
