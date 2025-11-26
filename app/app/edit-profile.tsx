import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image, Alert, ActivityIndicator, Platform, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { TextInputMask } from 'react-native-masked-text';

const convertDateToISO = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
};

const convertDateToBR = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
};

export default function EditProfile() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
        setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            birth_date: user.birth_date ? convertDateToBR(user.birth_date) : '',
            password: '',
            confirmPassword: ''
        });
        if (user.photo_url) setImage(user.photo_url);
    }
  }, [user]);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: false, // Se for usar FormData, não precisa de base64
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    if (!formData.name.trim()) {
        setLoading(false);
        return Alert.alert('Erro', 'O nome é obrigatório.');
    }

    if (formData.password || formData.confirmPassword) {
        if (formData.password !== formData.confirmPassword) {
            setLoading(false);
            return Alert.alert('Erro', 'As senhas não coincidem.');
        }
    }

    try {
        const hasNewImage = image && !image.startsWith('http');

        if (hasNewImage) {
            // Envio com Foto (Multipart)
            const form = new FormData();
            form.append('name', formData.name);
            // Remove mascara antes de enviar
            form.append('phone', formData.phone.replace(/\D/g, ''));

            if (formData.birth_date) form.append('birth_date', convertDateToISO(formData.birth_date));
            if (formData.password) form.append('password', formData.password);

            const filename = image.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : `image`;

            // @ts-ignore
            form.append('photo', { uri: image, name: filename, type });

            const response = await api.put(`/patients/${user?.id}`, form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Atualiza o contexto com os dados novos (incluindo a URL da foto nova)
            updateUser(response.data.patient || response.data);

        } else {
            // Envio sem Foto (JSON)
            const payload: any = {
                name: formData.name,
                phone: formData.phone.replace(/\D/g, ''),
                birth_date: convertDateToISO(formData.birth_date),
            };
            if (formData.password) payload.password = formData.password;

            const response = await api.put(`/patients/${user?.id}`, payload);

            updateUser(response.data.patient || response.data);
        }

        Alert.alert('Sucesso', 'Perfil atualizado!', [
            { text: 'OK', onPress: () => router.back() }
        ]);

    } catch (error: any) {
        console.log('Erro update:', error.response?.data);
        Alert.alert('Erro', 'Não foi possível atualizar. Verifique sua conexão.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.headerBackground}>
        <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Perfil</Text>
            <View style={{width: 24}} />
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.avatarImage} />
                ) : (
                    <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'P'}</Text>
                )}
                <TouchableOpacity style={styles.editAvatarButton} onPress={pickImage}>
                    <Ionicons name="camera" size={16} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={20} color="#2A9F85" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Nome Completo"
                    value={formData.name}
                    onChangeText={t => handleChange('name', t)}
                />
            </View>

            <View style={styles.inputGroup}>
                <Ionicons name="mail-outline" size={20} color="#2A9F85" style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, {color: '#999'}]}
                    value={formData.email}
                    editable={false}
                />
            </View>

             <View style={styles.inputGroup}>
                <Ionicons name="call-outline" size={20} color="#2A9F85" style={styles.inputIcon} />
                <TextInputMask
                    style={styles.input}
                    placeholder="Telefone"
                    type={'cel-phone'}
                    options={{maskType: 'BRL', withDDD: true, dddMask: '(99) '}}
                    value={formData.phone || ''}  // Proteção contra undefined
                    onChangeText={t => handleChange('phone', t)}
                />
            </View>

            <View style={styles.inputGroup}>
                <Ionicons name="calendar-outline" size={20} color="#2A9F85" style={styles.inputIcon} />
                <TextInputMask
                    style={styles.input}
                    placeholder="Data de Nascimento"
                    type={'datetime'}
                    options={{format: 'DD/MM/YYYY'}}
                    value={formData.birth_date || ''} // Proteção contra undefined
                    onChangeText={t => handleChange('birth_date', t)}
                />
            </View>

            <Text style={styles.sectionTitle}>Alterar Senha (Opcional)</Text>

            <View style={styles.inputGroup}>
                <Ionicons name="lock-closed-outline" size={20} color="#2A9F85" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Nova Senha"
                    secureTextEntry
                    value={formData.password}
                    onChangeText={t => handleChange('password', t)}
                />
            </View>

            <View style={styles.inputGroup}>
                <Ionicons name="lock-closed-outline" size={20} color="#2A9F85" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Confirmar Nova Senha"
                    secureTextEntry
                    value={formData.confirmPassword}
                    onChangeText={t => handleChange('confirmPassword', t)}
                />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                )}
            </TouchableOpacity>
        </View>
        <View style={{height: 50}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerBackground: { backgroundColor: '#2A9F85', height: 150, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingTop: 50, paddingHorizontal: 20, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { padding: 5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scrollContainer: { flex: 1, marginTop: 80, zIndex: 2 },
  profileCard: { alignItems: 'center', marginBottom: 20 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', position: 'relative', borderWidth: 3, borderColor: '#fff', elevation: 5 },
  avatarImage: { width: 94, height: 94, borderRadius: 47 },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: '#2A9F85' },
  editAvatarButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2A9F85', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  formContainer: { paddingHorizontal: 20 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, height: 50, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, elevation: 1 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2A9F85', marginTop: 10, marginBottom: 15 },
  saveButton: { backgroundColor: '#2A9F85', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 20, shadowColor: '#2A9F85', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, elevation: 4 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
