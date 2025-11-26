import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, StatusBar, Image } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../services/api';

const COLORS = { primary: '#2A9F85', background: '#FFFFFF', success: '#E0F2F1', successText: '#2A9F85', warning: '#FFF3E0', warningText: '#FF9800', danger: '#FFEBEE', dangerText: '#FF5252' };

interface InventoryItem {
  id: number; available_quantity: number;
  medication: { id: number; name: string; dosage?: string; photo_url?: string; };
  healthUnit: { name: string; };
}

export default function PharmacyList() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const inventoryRes = await api.get('/medication_inventory?limit=50');
      const inventoryData = inventoryRes.data.data || [];
      const catalogRes = await api.get('/medications?limit=50');
      const catalogData = catalogRes.data.data || [];

      const enrichedInventory = inventoryData.map((item: any) => {
        const details = catalogData.find((med: any) => med.id === item.medication.id);
        return { ...item, medication: { ...item.medication, photo_url: details?.photo_url || null, dosage: details?.dosage || item.medication.dosage } };
      });
      setInventory(enrichedInventory);
    } catch (error) { console.log('Erro farmácia:', error); }
    finally { setLoading(false); }
  }

  const getStatus = (quantity: number) => {
    if (quantity <= 0) return { label: 'INDISPONÍVEL', color: COLORS.dangerText, bg: COLORS.danger };
    if (quantity < 10) return { label: 'BAIXO ESTOQUE', color: COLORS.warningText, bg: COLORS.warning };
    return { label: 'DISPONÍVEL', color: COLORS.successText, bg: COLORS.success };
  };

  const filteredData = inventory.filter(item => item.medication.name.toLowerCase().includes(search.toLowerCase()));

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const status = getStatus(item.available_quantity);
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/pharmacy/details', params: { item: JSON.stringify(item) } } as any)}>
        {item.medication.photo_url ? (<Image source={{ uri: item.medication.photo_url }} style={styles.medImage} resizeMode="cover" />) : (<View style={styles.iconContainer}><FontAwesome5 name="pills" size={24} color={COLORS.primary} /></View>)}
        <View style={styles.infoContainer}>
            <Text style={styles.medName}>{item.medication.name}</Text>
            <Text style={styles.medDosage}>{item.medication.dosage || 'Dosagem Padrão'}</Text>
            <Text style={styles.unitText}>{item.healthUnit.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}><Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text></View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="chevron-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Farmácia</Text>
      </View>
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.primary} />
            <TextInput style={styles.searchInput} placeholder="Buscar medicamento..." value={search} onChangeText={setSearch} />
        </View>
      </View>
      {loading ? (<ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />) : (
        <FlatList data={filteredData} keyExtractor={(item) => String(item.id)} renderItem={renderItem} contentContainerStyle={styles.listContent} ListEmptyComponent={<Text style={styles.emptyText}>Nenhum medicamento encontrado.</Text>} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: COLORS.primary, padding: 24, paddingTop: 60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', marginBottom: 10 },
  backButton: { position: 'absolute', top: 50, left: 20, padding: 5 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  searchWrapper: { paddingHorizontal: 20, marginTop: -30, marginBottom: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 30, paddingHorizontal: 15, height: 50, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  listContent: { padding: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  iconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  medImage: { width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#f0f0f0' },
  infoContainer: { flex: 1, marginRight: 5 },
  medName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  medDosage: { fontSize: 13, color: '#666', marginBottom: 2 },
  unitText: { fontSize: 11, color: '#999' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#666' }
});
