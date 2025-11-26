import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform
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
  success: '#E0F2F1', warning: '#FFF3E0', danger: '#FFEBEE',
  // Adicionei uma cor para o botão desabilitado
  disabled: '#BDBDBD'
};

export default function MedicationDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Dados iniciais vindos da lista
  const initialItem = JSON.parse(params.item as string);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados para o Modal de Reserva
  const [modalVisible, setModalVisible] = useState(false);
  const [reserveQty, setReserveQty] = useState('1');
  const [reserveNotes, setReserveNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchFullDetails() {
      try {
        // Busca os dados completos (incluindo contraindicações) pelo ID [cite: 953]
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

  // Função para realizar a reserva
  const handleReserve = async () => {
    const qty = parseInt(reserveQty);

    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Erro', 'Por favor, insira uma quantidade válida.');
      return;
    }

    if (qty > initialItem.available_quantity) {
      Alert.alert('Estoque Insuficiente', `A quantidade máxima disponível é ${initialItem.available_quantity}.`);
      return;
    }

    setSubmitting(true);

    try {
      // Definindo data de retirada para 24h a partir de agora (Regra de negócio sugerida)
      // A API exige formato ISO: YYYY-MM-DDTHH:mm:ssZ [cite: 924]
      const pickupDate = new Date();
      pickupDate.setHours(pickupDate.getHours() + 24);

      const payload = {
        medication_id: initialItem.medication.id, //
        health_unit_id: initialItem.healthUnit.id || initialItem.health_unit_id, // Garante pegar o ID da unidade
        quantity: qty, //
        scheduled_pickup_at: pickupDate.toISOString(), //
        notes: reserveNotes //
      };

      await api.post('/medication_reservations', payload);

      Alert.alert('Sucesso', 'Medicamento reservado com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            setModalVisible(false);
            router.back(); // Volta para a lista
          }
        }
      ]);

    } catch (error: any) {
      console.log('Erro reserva:', error.response?.data);
      if (error.response?.status === 409) { //
        Alert.alert('Erro', 'Quantidade insuficiente no estoque.');
      } else {
        Alert.alert('Erro', 'Não foi possível realizar a reserva. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Mescla dados da lista com dados completos da API
  const medication = { ...initialItem.medication, ...details };

  const getStatus = (quantity: number) => {
    if (quantity <= 0) return { label: 'INDISPONÍVEL', color: '#FF5252', bg: '#FFEBEE' };
    if (quantity < 10) return { label: 'ESTOQUE BAIXO', color: '#FF9800', bg: '#FFF3E0' };
    return { label: 'DISPONÍVEL', color: '#2A9F85', bg: '#E0F2F1' };
  };

  const status = getStatus(initialItem.available_quantity);
  const canReserve = initialItem.available_quantity > 0;

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

                <Text style={styles.sectionTitle}>Contraindicações</Text>
                <Text style={[styles.description, { color: '#D32F2F' }]}>
                    {medication.contraindications || "Nenhuma contraindicação cadastrada."}
                </Text>
            </>
        )}
      </ScrollView>

      {/* Botão de Reservar Fixo no Rodapé */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.reserveButton, !canReserve && styles.reserveButtonDisabled]}
          onPress={() => setModalVisible(true)}
          disabled={!canReserve}
        >
          <Text style={styles.reserveButtonText}>
            {canReserve ? 'Reservar Medicamento' : 'Indisponível para Reserva'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Reserva */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar Reserva</Text>
            <Text style={styles.modalSubtitle}>
              Você está reservando: {medication.name}
            </Text>
            <Text style={styles.modalInfo}>
              Unidade: {initialItem.healthUnit.name}
            </Text>

            <Text style={styles.label}>Quantidade:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={reserveQty}
              onChangeText={setReserveQty}
              placeholder="Ex: 1"
            />

            <Text style={styles.label}>Notas (Opcional):</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reserveNotes}
              onChangeText={setReserveNotes}
              placeholder="Ex: Retiro amanhã à tarde"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.helperText}>
              * A reserva ficará válida por 24h a partir de agora.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleReserve}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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

  content: { padding: 24, alignItems: 'center', paddingBottom: 100 }, // Aumentei o paddingBottom para o footer não cobrir o texto

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
  },

  // Estilos do Footer e Botão
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee',
    elevation: 10
  },
  reserveButton: {
    backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center',
    shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 2
  },
  reserveButtonDisabled: {
    backgroundColor: COLORS.disabled
  },
  reserveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Estilos do Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20
  },
  modalContent: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 5
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginBottom: 5 },
  modalSubtitle: { fontSize: 16, color: '#333', marginBottom: 5 },
  modalInfo: { fontSize: 14, color: '#666', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 5 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9'
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  helperText: { fontSize: 12, color: '#888', marginTop: 10, fontStyle: 'italic' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  modalBtn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f5f5f5', marginRight: 10 },
  confirmBtn: { backgroundColor: COLORS.primary, marginLeft: 10 },
  cancelBtnText: { color: '#666', fontWeight: 'bold' },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' }
});
