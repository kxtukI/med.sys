import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const getNextDays = (days = 14) => {
  const list = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    list.push({
      dateObj: date,
      day: date.getDate(),
      weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', ''),
      fullDate: date.toISOString().split('T')[0],
    });
  }
  return list;
};

export default function BookAppointment() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const professional = params.professional ? JSON.parse(params.professional as string) : null;
  const professionalId = professional?.professional_id || professional?.id;

  const [selectedDate, setSelectedDate] = useState(getNextDays()[0].fullDate);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const days = getNextDays();

  useEffect(() => {
    async function fetchSlots() {
      if (!professionalId || !professional?.health_units || professional.health_units.length === 0) return;

      setLoadingSlots(true);
      setAvailableSlots([]);
      setSelectedSlot(null);

      try {
        const allSlots: any[] = [];
        const promises = professional.health_units.map(async (unit: any) => {
            try {
                const response = await api.get(`/appointment_slots/${professionalId}/${unit.id}/${selectedDate}`);
                const rawSlots = response.data.slots || [];
                const slots = rawSlots
                    .filter((s: any) => s.available)
                    .map((s: any) => ({ ...s, healthUnitId: unit.id, healthUnitName: unit.name }));
                return slots;
            } catch (err) { return []; }
        });

        const results = await Promise.all(promises);
        results.forEach(slots => allSlots.push(...slots));
        allSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));
        setAvailableSlots(allSlots);

      } catch (error) {
        console.log('Erro ao buscar vagas:', error);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDate, professionalId]);

  async function getRealPatientId(userId: number) {
      try {
          // Tenta buscar pelo ID direto (fallback rápido)
          try { await api.get(`/patients/${userId}`); return userId; } catch(e) {}
          return userId;
      } catch { return userId; }
  }

  async function handleBook() {
    if (!selectedSlot) return Alert.alert('Atenção', 'Selecione um horário.');

    setSubmitting(true);
    try {
      const patientId = await getRealPatientId(user!.id);

      // --- CORREÇÃO: ENVIO LITERAL (WYSIWYG) ---
      // "What You See Is What You Get"
      // Se o slot é "14:00", enviamos "2025-12-01T14:00:00"
      // Sem Z, sem somar horas. O servidor deve aceitar o horário local.
      const dateTimeLiteral = `${selectedDate}T${selectedSlot.start_time}:00`;

      console.log(`Agendando para: ${dateTimeLiteral}`);

      await api.post('/appointments', {
        patient_id: patientId,
        professional_id: professionalId,
        health_unit_id: selectedSlot.healthUnitId,
        date_time: dateTimeLiteral,
        specialty: professional.specialty,
        status: 'scheduled',
        notes: reason
      });

      Alert.alert('Sucesso!', 'Consulta agendada com sucesso!', [
        { text: 'OK', onPress: () => router.push('/(tabs)') }
      ]);

    } catch (error: any) {
      console.log("ERRO API:", error.response?.data);
      // Exibe a mensagem exata da API para sabermos o que houve
      const errorData = error.response?.data;
      const msg = errorData?.details || errorData?.error || 'Verifique os dados.';

      if (typeof msg === 'string' && msg.includes('encaminhamento')) {
          Alert.alert('Atenção', 'Você precisa de um encaminhamento para agendar com este especialista.');
      } else {
          Alert.alert('Não foi possível agendar', String(msg));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!professional) return <View style={styles.container}><Text>Erro ao carregar dados.</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{professional.user.name}</Text>
        <Text style={styles.headerSubtitle}>{professional.specialty}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Escolha a Data</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {days.map((day, index) => {
              const isSelected = day.fullDate === selectedDate;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                  onPress={() => setSelectedDate(day.fullDate)}
                >
                  <Text style={[styles.dayText, isSelected && styles.textSelected]}>{day.day}</Text>
                  <Text style={[styles.weekText, isSelected && styles.textSelected]}>{day.weekday}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horário Disponível</Text>
          {loadingSlots ? (
            <ActivityIndicator color="#2A9F85" size="large" style={{ marginVertical: 20 }} />
          ) : availableSlots.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={40} color="#ccc" />
                <Text style={styles.noSlotsText}>Nenhum horário livre nesta data.</Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {availableSlots.map((slot, index) => {
                const isSelected = selectedSlot === slot;
                return (
                  <TouchableOpacity
                    key={`${slot.start_time}-${slot.healthUnitId}-${index}`}
                    style={[styles.slotButton, isSelected && styles.slotButtonSelected]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={[styles.slotText, isSelected && styles.textSelected]}>
                      {slot.start_time}
                    </Text>
                    <Text
                        style={[styles.unitText, isSelected && styles.textSelected]}
                        numberOfLines={1}
                    >
                        {slot.healthUnitName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes do Paciente</Text>
          <Text style={styles.label}>Nome: {user?.name}</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={3}
            placeholder="Descreva seu problema (opcional)..."
            value={reason}
            onChangeText={setReason}
          />
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, (!selectedSlot || submitting) && styles.buttonDisabled]}
          onPress={handleBook}
          disabled={!selectedSlot || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar Agendamento</Text>
          )}
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    backgroundColor: '#2A9F85', padding: 20, paddingTop: 60,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    alignItems: 'center', marginBottom: 10,
  },
  backButton: { position: 'absolute', top: 50, left: 20, padding: 10 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  headerSubtitle: { color: '#E0F2F1', fontSize: 14, fontWeight: '500' },

  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },

  dateScroll: { flexDirection: 'row', marginBottom: 10 },
  dateCard: {
    width: 64, height: 75, borderRadius: 16, backgroundColor: '#F5F7FA',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
    borderWidth: 1, borderColor: '#EFEFEF'
  },
  dateCardSelected: { backgroundColor: '#2A9F85', borderColor: '#2A9F85', elevation: 4 },
  dayText: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  weekText: { fontSize: 12, color: '#888', marginTop: 4, fontWeight: '600' },
  textSelected: { color: '#fff' },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  slotButton: {
    width: '48%', paddingVertical: 16, borderRadius: 16, backgroundColor: '#F5F7FA',
    marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EFEFEF'
  },
  slotButtonSelected: { backgroundColor: '#2A9F85', borderColor: '#2A9F85', elevation: 5 },
  slotText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  unitText: { fontSize: 10, color: '#777', marginTop: 2 },

  emptyContainer: { alignItems: 'center', padding: 20, backgroundColor: '#F9F9F9', borderRadius: 12 },
  noSlotsText: { color: '#888', marginTop: 8 },

  label: { fontSize: 14, color: '#555', marginBottom: 8 },
  inputDisabled: { backgroundColor: '#F0F2F5', borderRadius: 12, padding: 16, color: '#555', borderWidth: 1, borderColor: '#EFEFEF' },
  textArea: { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E0E0E0' },

  confirmButton: {
    backgroundColor: '#2A9F85', height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginTop: 20, elevation: 6
  },
  buttonDisabled: { backgroundColor: '#B0BEC5', elevation: 0 },
  confirmButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
