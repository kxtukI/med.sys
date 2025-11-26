import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="information-circle" size={50} color="#2A9F85" />
        <Text style={styles.title}>Informações</Text>
        <View style={styles.separator} />

        <Text style={styles.text}>
          Este é o aplicativo do paciente Med.Sys, desenvolvido para o TCC.
        </Text>
        <Text style={styles.text}>
          Versão 1.0.0
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Fechar</Text>
        </TouchableOpacity>
      </View>

      {/* Ajuste da barra de status para iOS */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Fundo semi-transparente se for usado como modal transparente
  },
  card: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  separator: {
    marginVertical: 15,
    height: 1,
    width: '100%',
    backgroundColor: '#eee',
  },
  text: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#2A9F85',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
