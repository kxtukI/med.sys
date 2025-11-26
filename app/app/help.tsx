import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HelpCenter() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centro de Ajuda</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#2A9F85" />
        <TextInput placeholder="Pesquise..." style={styles.input} />
      </View>

      <View style={styles.tabRow}>
          <TouchableOpacity style={styles.activeTab}><Text style={styles.activeTabText}>FAQ</Text></TouchableOpacity>
          <TouchableOpacity style={styles.inactiveTab} onPress={() => router.push('/chat' as any)}><Text style={styles.inactiveTabText}>Contato</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Dúvidas Frequentes</Text>

          <TouchableOpacity style={styles.faqItem}>
              <Text style={styles.faqText}>Como agendar uma consulta?</Text>
              <Ionicons name="chevron-down" size={20} color="#2A9F85" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem}>
              <Text style={styles.faqText}>Como cancelar um agendamento?</Text>
              <Ionicons name="chevron-down" size={20} color="#2A9F85" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem}>
              <Text style={styles.faqText}>Onde vejo meus medicamentos?</Text>
              <Ionicons name="chevron-down" size={20} color="#2A9F85" />
          </TouchableOpacity>

          {/* Botão Grande para Chat Direto */}
          <TouchableOpacity style={styles.chatButton} onPress={() => router.push('/chat' as any)}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
              <Text style={styles.chatButtonText}>Falar com Atendente</Text>
          </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#2A9F85', height: 100, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 20, padding: 10, borderRadius: 10, elevation: 3 },
  input: { marginLeft: 10, flex: 1 },
  tabRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20 },
  activeTab: { backgroundColor: '#2A9F85', paddingVertical: 8, paddingHorizontal: 30, borderRadius: 20 },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  inactiveTab: { borderWidth: 1, borderColor: '#ccc', paddingVertical: 8, paddingHorizontal: 30, borderRadius: 20 },
  inactiveTabText: { color: '#666' },
  content: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2A9F85', marginBottom: 15 },
  faqItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  faqText: { color: '#555', fontSize: 16 },
  chatButton: {
      marginTop: 40, backgroundColor: '#2A9F85', flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
      padding: 15, borderRadius: 15, gap: 10
  },
  chatButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
