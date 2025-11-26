import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../services/api';

interface Professional {
  professional_id: number;
  id?: number;
  specialty: string;
  user: { name: string; email: string; };
  health_units: { name: string; }[];
}

export default function Explore() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [search, setSearch] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfessionals = useCallback(async (term = '', type: 'name' | 'specialty' = 'name') => {
    setLoading(true); setError('');
    let endpoint = '/professionals';
    if (term) endpoint += `?${type}=${term}`;
    try {
      const response = await api.get(endpoint);
      setProfessionals(response.data.data || []);
    } catch (err: any) { setError("Não foi possível carregar os profissionais."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (params.specialty) {
        const spec = params.specialty as string;
        setSearch(spec);
        fetchProfessionals(spec, 'specialty');
    } else { fetchProfessionals(); }
  }, [params.specialty, fetchProfessionals]);

  const handleSearch = () => { fetchProfessionals(search, 'name'); };
  const clearSearch = () => { setSearch(''); fetchProfessionals('', 'name'); };

  const renderItem = ({ item, index }: { item: Professional, index: number }) => {
    const primaryUnit = item.health_units?.[0]?.name || 'Unidade não informada';
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/book-appointment', params: { professional: JSON.stringify(item) } } as any)}>
        <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{item.user.name.charAt(0)}</Text></View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.user.name}</Text>
          <Text style={styles.specialty}>{item.specialty}</Text>
          <View style={styles.locationContainer}><Ionicons name="business-outline" size={14} color="#666" /><Text style={styles.hospital}>{primaryUnit}</Text></View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Encontre um Especialista</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Buscar por nome..." value={search} onChangeText={setSearch} onSubmitEditing={handleSearch} returnKeyType="search" />
          {search.length > 0 && (<TouchableOpacity onPress={clearSearch}><Ionicons name="close-circle" size={20} color="#ccc" /></TouchableOpacity>)}
        </View>
        <Text style={{ color: '#fff', marginTop: 8 }}>{loading ? 'Buscando...' : `${professionals.length} resultados encontrados`}</Text>
      </View>
      {error ? (
          <View style={styles.center}><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={() => fetchProfessionals(search, 'name')}><Text style={styles.retryButton}>Tentar novamente</Text></TouchableOpacity></View>
      ) : loading ? (<View style={styles.center}><ActivityIndicator size="large" color="#2A9F85" /></View>) : (
          <FlatList data={professionals} keyExtractor={(item, index) => String(item.professional_id || item.id || index)} contentContainerStyle={styles.listContent} renderItem={renderItem} ListEmptyComponent={() => (<View style={styles.center}><Text style={styles.emptyText}>Nenhum profissional encontrado.</Text><TouchableOpacity onPress={clearSearch}><Text style={{ color: '#2A9F85', marginTop: 10 }}>Limpar filtros</Text></TouchableOpacity></View>)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#2A9F85', padding: 24, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  listContent: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: '#2A9F85', fontSize: 20, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  specialty: { fontSize: 14, color: '#2A9F85', fontWeight: '600', marginBottom: 4 },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  hospital: { fontSize: 12, color: '#666', marginLeft: 4 },
  emptyText: { textAlign: 'center', color: '#666', fontSize: 16 },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center', marginBottom: 10 },
  retryButton: { color: '#2A9F85', fontSize: 16, fontWeight: 'bold' }
});
