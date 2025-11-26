import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import api from '../../services/api';

const COLORS = {
  primary: '#2A9F85',
  background: '#FFFFFF',
  divider: '#EEE',
  textPrimary: '#333',
  textSecondary: '#666',
  success: '#E0F2F1', warning: '#FFF3E0', danger: '#FFEBEE'
};

export default function MedicationDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Dados iniciais vindos da lista
  const initialItem = JSON.parse(params.item as string);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFullDetails() {
      try {
        // Busca os dados completos (incluindo contraindicações) pelo ID
        const response = await api.get(`/medications/${initialItem.medication.id}`);
        if (response.data && response.data.medication) {
            setDetails(response.data.medication);
        }
      } catch (error) {
        console.log("Erro ao buscar detalhes:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFullDetails();
  }, [initialItem.medication.id]);

  // Mescla dados da lista com dados completos da API
  const medication = { ...initialItem.medication, ...details };

  const getStatus = (quantity: number) => {
    if (quantity <= 0) return { label: 'INDISPONÍVEL', color: '#FF5252', bg: '#FFEBEE' };
    if (quantity < 10) return { label: 'ESTOQUE BAIXO', color: '#FF9800', bg: '#FFF3E0' };
    return { label: 'DISPONÍVEL', color: '#2A9F85', bg: '#E0F2F1' };
  };

  const status = getStatus(initialItem.available_quantity);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {medication.name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Ícone ou Foto */}
        <View style={styles.iconWrapper}>
          {medication.photo_url ? (
            <Image
              source={{ uri: medication.photo_url }}
              style={styles.bigImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.bigIcon}>
              <FontAwesome5 name="capsules" size={60} color={COLORS.primary} />
            </View>
          )}
        </View>

        <Text style={styles.medName}>{medication.name}</Text>
        <Text style={styles.medDosage}>
          {medication.dosage || 'Dosagem não informada'} • {medication.manufacturer || 'Fabricante não informado'}
        </Text>

        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>

        <Text style={styles.availabilityText}>
           Quantidade aprox: {initialItem.available_quantity}
        </Text>
        <Text style={styles.availabilityText}>
           Unidade: {initialItem.healthUnit.name}
        </Text>

        <View style={styles.divider} />

        {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{marginTop: 20}} />
        ) : (
            <>
                <Text style={styles.sectionTitle}>Descrição</Text>
                <Text style={styles.description}>
                    {medication.description || "Sem descrição disponível."}
                </Text>

                <Text style={styles.sectionTitle}>Princípio Ativo</Text>
                <Text style={styles.description}>
                    {medication.active_ingredient || "Não informado."}
                </Text>

                {/* --- NOVA SEÇÃO ADICIONADA --- */}
                <Text style={styles.sectionTitle}>Contraindicações</Text>
                <Text style={[styles.description, { color: '#D32F2F' }]}>
                    {medication.contraindications || "Nenhuma contraindicação cadastrada."}
                </Text>
            </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    backgroundColor: COLORS.primary,
    height: 100,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 2,
  },
  backButton: { marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1 },

  content: { padding: 24, alignItems: 'center', paddingBottom: 40 },

  iconWrapper: { marginBottom: 20, marginTop: 10 },
  bigIcon: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 4, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff'
  },
  bigImage: {
    width: 150, height: 150, borderRadius: 75, marginBottom: 10
  },

  medName: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 5, textAlign: 'center' },
  medDosage: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 20, textAlign: 'center' },

  statusBadge: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 15
  },
  statusText: { fontWeight: 'bold', fontSize: 14 },

  availabilityText: { fontSize: 14, color: '#555', marginBottom: 5 },

  divider: { width: '100%', height: 1, backgroundColor: COLORS.divider, marginVertical: 20 },

  sectionTitle: {
    alignSelf: 'flex-start', fontSize: 18, fontWeight: 'bold',
    color: COLORS.textPrimary, marginBottom: 8, marginTop: 10
  },
  description: {
    alignSelf: 'flex-start', fontSize: 15, color: COLORS.textSecondary,
    lineHeight: 22, marginBottom: 10, textAlign: 'left'
  }
});
