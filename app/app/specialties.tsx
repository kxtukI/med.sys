import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, StatusBar } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SPECIALTIES = [
  { id: '1', name: 'Cardiologia', icon: 'heartbeat', searchTerm: 'Cardio' },
  { id: '2', name: 'Dermatologia', icon: 'allergies', searchTerm: 'Dermato' },
  { id: '3', name: 'Clínica Geral', icon: 'user-nurse', searchTerm: 'Geral' },
  { id: '4', name: 'Ginecologia', icon: 'female', searchTerm: 'Gineco' },
  { id: '5', name: 'Odontologia', icon: 'tooth', searchTerm: 'Odonto' },
  { id: '6', name: 'Oncologia', icon: 'dna', searchTerm: 'Onco' },
  { id: '7', name: 'Oftalmologia', icon: 'eye', searchTerm: 'Oftalmo' },
  { id: '8', name: 'Ortopedia', icon: 'bone', searchTerm: 'Ortopedia' },
  { id: '9', name: 'Urologia', icon: 'mars', searchTerm: 'Uro' },
  { id: '10', name: 'Psiquiatria', icon: 'brain', searchTerm: 'Psiqui' },
  { id: '11', name: 'Pediatria', icon: 'baby', searchTerm: 'Pediatria' },
  { id: '12', name: 'Neurologia', icon: 'brain', searchTerm: 'Neuro' },
];

export default function Specialties() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filteredData = SPECIALTIES.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectSpecialty = (item: any) => {
    const term = item.searchTerm || item.name;
    router.push({
        pathname: '/(tabs)/explore',
        params: { specialty: term }
    } as any);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelectSpecialty(item)}>
      <FontAwesome5 name={item.icon} size={32} color="#fff" style={styles.icon} />
      <Text style={styles.cardText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Especialidades</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#2A9F85" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Pesquise uma especialidade..." placeholderTextColor="#2A9F85" value={search} onChangeText={setSearch} />
        </View>
      </View>
      <View style={styles.filterContainer}>
        <Text style={styles.sortText}>Ordenar por</Text>
        <TouchableOpacity style={styles.sortButton}><Text style={styles.sortButtonText}>A-Z</Text></TouchableOpacity>
        <Text style={styles.doctorCount}>{filteredData.length} Categorias</Text>
      </View>
      <FlatList data={filteredData} keyExtractor={(item) => item.id} renderItem={renderItem} numColumns={2} contentContainerStyle={styles.gridContent} columnWrapperStyle={styles.columnWrapper} showsVerticalScrollIndicator={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#2A9F85', padding: 24, paddingTop: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { padding: 5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 30, paddingHorizontal: 16, height: 50 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  filterContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  sortText: { color: '#666', marginRight: 8 },
  sortButton: { backgroundColor: '#2A9F85', borderRadius: 15, paddingHorizontal: 12, paddingVertical: 4, marginRight: 8 },
  sortButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  doctorCount: { marginLeft: 'auto', color: '#2A9F85', fontWeight: 'bold' },
  gridContent: { padding: 24, paddingTop: 0 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 16 },
  card: { width: '48%', backgroundColor: '#2A9F85', borderRadius: 20, padding: 20, alignItems: 'center', justifyContent: 'center', height: 130, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  icon: { marginBottom: 12 },
  cardText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
});
