import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function Profile() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // CORREÇÃO: Garante que os textos do Alert sejam strings simples
  const handleLogout = () => {
    Alert.alert(
      "Sair", // Título
      "Tem certeza que deseja sair da sua conta?", // Mensagem
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Sair",
          onPress: () => {
            signOut(); // Chama a função de sair
          },
          style: "destructive"
        }
      ]
    );
  };

  const navigateTo = (screenName: string) => {
      Alert.alert("Em breve", `A tela de ${screenName} será implementada futuramente.`);
  };

  // Dados do usuário com fallback para evitar erros se vier nulo
  const userName = user?.name || 'Paciente';
  const userEmail = user?.email || 'email@exemplo.com';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      {/* Fundo Verde Superior (Cabeçalho Curvo) */}
      <View style={styles.headerBackground}>
        <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Meu Perfil</Text>
            <View style={{width: 24}} /> {/* Espaço para centralizar título */}
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* Cartão de Perfil Flutuante */}
        <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
                {/* Lógica: Se tiver foto URL, mostra a imagem. Se não, mostra a letra inicial */}
                {user?.photo_url ? (
                    <Image source={{ uri: user.photo_url }} style={styles.avatarImage} />
                ) : (
                    <Text style={styles.avatarText}>{userInitial}</Text>
                )}

                {/* Botão de Editar (Lápis) */}
                <TouchableOpacity
                    style={styles.editAvatarButton}
                    onPress={() => router.push('/edit-profile' as any)}
                >
                    <Ionicons name="pencil" size={12} color="#fff" />
                </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
        </View>

        {/* Menu de Opções */}
        <View style={styles.menuContainer}>

            <MenuOption
                icon="person-outline"
                label="Editar Perfil"
                onPress={() => router.push('/edit-profile' as any)}
            />

            <MenuOption
                icon="lock-closed-outline"
                label="Política de Privacidade"
                onPress={() => navigateTo('Política de Privacidade')}
            />

            <MenuOption
                icon="settings-outline"
                label="Configurações"
                onPress={() => navigateTo('Configurações')}
            />

            {/* Botão de Ajuda conectado ao Chatbot */}
            <MenuOption
                icon="help-circle-outline"
                label="Ajuda"
                onPress={() => router.push('/help' as any)}
            />

            <MenuOption
                icon="log-out-outline"
                label="Logout"
                isLogout
                onPress={handleLogout}
            />

        </View>

        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );
}

// Componente reutilizável para os itens do menu
const MenuOption = ({ icon, label, onPress, isLogout }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={[styles.iconBox, isLogout && styles.iconBoxLogout]}>
            <Ionicons name={icon} size={20} color={isLogout ? "#FF5252" : "#2A9F85"} />
        </View>
        <Text style={[styles.menuText, isLogout && styles.menuTextLogout]}>{label}</Text>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  // Cabeçalho Verde Curvo
  headerBackground: {
    backgroundColor: '#2A9F85',
    height: 180,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 50,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // ScrollView começa abaixo do header visualmente
  scrollContainer: {
    flex: 1,
    marginTop: 100,
    zIndex: 2,
  },

  // Cartão do Perfil (Flutuante)
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: "#000",
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
    position: 'relative',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2A9F85',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2A9F85',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },

  // Menu
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconBoxLogout: {
    backgroundColor: '#FFEBEE',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuTextLogout: {
    color: '#FF5252',
  },
});
