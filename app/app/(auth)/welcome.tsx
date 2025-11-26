import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Logo from '../../assets/images/logo-color.svg';

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <Logo width={180} height={180} />
          <Text style={styles.appName}>Med.Sys</Text>
        </View>

        <Text style={styles.description}>
          Gerencie suas consultas, verifique a farmácia e cuide da sua saúde de forma simples e rápida.
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => router.push('/(auth)/login' as any)}
          >
            <Text style={styles.loginText}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.signupButton]}
            onPress={() => router.push('/(auth)/signup' as any)}
          >
            <Text style={styles.signupText}>Cadastrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    width: '85%',
    alignItems: 'center',
  },

  logoWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },

  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2A9F85',
    marginTop: 10,
  },

  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: 20,
  },

  buttons: {
    width: '100%',
    gap: 16,
  },

  button: {
    width: '100%',
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginButton: {
    backgroundColor: '#2A9F85',
  },

  loginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  signupButton: {
    backgroundColor: '#E0F7FA',
  },

  signupText: {
    color: '#2A9F85',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
