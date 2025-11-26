import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function Profile() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Função de Logout oficial
  const handleLogout = () => {
    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", onPress: signOut, style: "destructive" }
      ]
    );
  };

  // Função para simular navegação para telas futuras
  const navigateTo = (screenName: string) => {
      Alert.alert("Em breve", `A tela de ${screenName} será implementada futuramente.`);
  };

  // Formata dados para exibição
  const userName = user?.name || 'Paciente';
  const userEmail = user?.email || 'email@naoinformado.com';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Cabeçalho Verde */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        {/* Botão de Editar (Apenas visual conforme RF005 que diz ser função de Admin, mas mantemos o UI) */}
        <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigateTo('Editar Perfil')}
        >
            <Ionicons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Cartão de Perfil (Sobreposto ao Header) */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
            {/* Se tiver foto use Image, senão use a inicial */}
            <Text style={styles.avatarText}>{userInitial}</Text>
        </View>
        <Text style={styles.nameText}>{userName}</Text>
        <Text style={styles.emailText}>{userEmail}</Text>
      </View>

      {/* Menu de Opções */}
      <View style={styles.menuContainer}>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Dados Pessoais')}>
            <View style={styles.menuIcon}>
                <Ionicons name="person-outline" size={22} color="#2A9F85" />
            </View>
            <Text style={styles.menuText}>Perfil</Text>
            <Ionicons name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Política de Privacidade')}>
            <View style={styles.menuIcon}>
                <Ionicons name="lock-closed-outline" size={22} color="#2A9F85" />
            </View>
            <Text style={styles.menuText}>Política de Privacidade</Text>
            <Ionicons name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Configurações')}>
            <View style={styles.menuIcon}>
                <Ionicons name="settings-outline" size={22} color="#2A9F85" />
            </View>
            <Text style={styles.menuText}>Configurações</Text>
            <Ionicons name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Ajuda')}>
            <View style={styles.menuIcon}>
                <Ionicons name="help-circle-outline" size={22} color="#2A9F85" />
            </View>
            <Text style={styles.menuText}>Ajuda</Text>
            <Ionicons name="chevron-forward" size={22} color="#ccc" />
        </TouchableOpacity>

        {/* Botão de Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" style={{marginRight: 10}} />
            <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#2A9F85',
    height: 180,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    right: 25,
    top: 65,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },

  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -60, // Faz o card subir e ficar sobre o header verde
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 25,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2A9F85',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
  },

  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },

  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF5252',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
