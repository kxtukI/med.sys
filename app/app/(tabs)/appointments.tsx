import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar,
  Alert, ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Interface expandida para incluir a foto que vamos injetar
interface Appointment {
  id: number;
  date_time: string;
  specialty: string;
  status: string;
  professional: {
      id: number;
      photo_url?: string; // Vamos preencher isso manualmente
      user: { name: string; }
  };
  health_unit: { name: string; };
}

export default function MyAppointments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'canceled'>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      let statusApi = 'scheduled';
      if (activeTab === 'completed') statusApi = 'completed';
      if (activeTab === 'canceled') statusApi = 'canceled';

      // 1. Busca os Agendamentos
      const responseApps = await api.get(`/appointments?status=${statusApi}`);
      let dataApps = responseApps.data.data || [];

      // 2. Busca os Profissionais (para pegar as fotos que faltam)
      // Limit 100 para tentar pegar todos os médicos e garantir que a foto venha
      try {
          const responseProfs = await api.get('/professionals?limit=100');
          const professionals = responseProfs.data.data || [];

          // Cria um "Dicionário de Fotos": ID do Médico -> URL da Foto
          const photoMap: Record<number, string> = {};
          professionals.forEach((p: any) => {
              if (p.photo_url) {
                  photoMap[p.professional_id] = p.photo_url;
              }
          });

          // 3. Injeta a foto nos agendamentos
          dataApps = dataApps.map((app: any) => {
              const profId = app.professional?.id;
              // Se achou foto no dicionário, usa.
              const photo = photoMap[profId];

              return {
                  ...app,
                  professional: {
                      ...app.professional,
                      photo_url: photo // Adiciona a foto aqui
                  }
              };
          });

      } catch (err) {
          console.log("Erro ao buscar fotos:", err);
          // Se falhar a busca de fotos, a lista carrega sem elas (não trava o app)
      }

      // 4. Filtra apenas os agendamentos deste usuário (ID 14 -> Paciente 11)
      const myAppointments = dataApps.filter((app: any) => {
          const appUserId = app.patient?.users?.id || app.patient?.user_id;
          return String(appUserId) === String(user?.id);
      });

      // 5. Ordena por data
      const sorted = myAppointments.sort((a: any, b: any) =>
        new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
      );

      setAppointments(sorted);

    } catch (error) {
      console.log('Erro consultas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleCancel = (id: number) => {
    Alert.alert("Cancelar", "Deseja cancelar?", [
        { text: "Não", style: "cancel" },
        { text: "Sim", style: 'destructive', onPress: async () => {
            try { await api.delete(`/appointments/${id}`); Alert.alert("Sucesso", "Cancelada."); fetchAppointments(); }
            catch (error) { Alert.alert("Erro", "Falha ao cancelar."); }
        }}
    ]);
  };

  const handleReschedule = () => {
      Alert.alert("Remarcar", "Para remarcar, cancele esta consulta e agende uma nova.");
  };

  const formatDate = (dateString: string) => {
    try {
        if (!dateString) return { date: '--', time: '--' };
        let dateObj = new Date(dateString);

        // Tratamento para data BR "DD/MM/YYYY HH:mm"
        if (dateString.includes('/')) {
            const [d, t] = dateString.split(' ');
            const [day, month, year] = d.split('/');
            dateObj = new Date(`${year}-${month}-${day}T${t ? t + ':00' : '00:00:00'}`);
        }

        if (isNaN(dateObj.getTime())) return { date: '--', time: '--' };

        const dateFmt = dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' });
        const timeFmt = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return { date: dateFmt.charAt(0).toUpperCase() + dateFmt.slice(1), time: timeFmt };
    } catch (e) { return { date: '--', time: '--' }; }
  };

  const renderItem = ({ item }: { item: Appointment }) => {
    const { date, time } = formatDate(item.date_time);
    const doctorName = item.professional?.user?.name || 'Médico';
    // Agora usamos o campo que injetamos manualmente
    const doctorPhoto = item.professional?.photo_url;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {/* EXIBE FOTO SE TIVER, SENÃO LETRA */}
          {doctorPhoto ? (
             <Image source={{ uri: doctorPhoto }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
             <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{doctorName.charAt(0)}</Text>
             </View>
          )}

          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{doctorName}</Text>
            <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
            <Text style={styles.unitText}>{item.health_unit?.name}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.scheduleInfo}>
          <View style={styles.timeRow}><Ionicons name="calendar-outline" size={16} color="#666" /><Text style={styles.timeText}>{date}</Text></View>
          <View style={styles.timeRow}><Ionicons name="time-outline" size={16} color="#666" /><Text style={styles.timeText}>{time}</Text></View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.outlineButton} onPress={() => Alert.alert('Detalhes', `Consulta em ${item.health_unit?.name}`)}><Text style={styles.outlineButtonText}>Detalhes</Text></TouchableOpacity>
          {activeTab === 'upcoming' && (
            <>
               <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#FFA726', marginRight: 5 }]} onPress={handleReschedule}>
                  <Text style={styles.primaryButtonText}>Remarcar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#FF5252' }]} onPress={() => handleCancel(item.id)}>
                  <Text style={styles.primaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}><Text style={styles.headerTitle}>Minhas Consultas</Text></View>
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'completed' && styles.activeTab]} onPress={() => setActiveTab('completed')}><Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completas</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} onPress={() => setActiveTab('upcoming')}><Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Por vir</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'canceled' && styles.activeTab]} onPress={() => setActiveTab('canceled')}><Text style={[styles.tabText, activeTab === 'canceled' && styles.activeTabText]}>Canceladas</Text></TouchableOpacity>
      </View>
      {loading ? (<ActivityIndicator size="large" color="#2A9F85" style={{marginTop: 50}} />) : (
          <FlatList data={appointments} keyExtractor={(item) => String(item.id)} renderItem={renderItem} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Nenhuma consulta.</Text></View>} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#2A9F85', padding: 20, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, alignItems: 'center', },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  tabsContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 30, padding: 4, elevation: 2 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 26 },
  activeTab: { backgroundColor: '#2A9F85' },
  tabText: { color: '#666', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  listContent: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },

  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, marginRight: 12, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#2A9F85' },
  avatarImage: { width: 60, height: 60, borderRadius: 30, marginRight: 12, backgroundColor: '#E0F2F1' },

  doctorInfo: { flex: 1, justifyContent: 'center' },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  doctorSpecialty: { fontSize: 14, color: '#666', marginBottom: 2 },
  unitText: { fontSize: 12, color: '#888', fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 12 },
  scheduleInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { color: '#333', fontSize: 13 },
  actionButtons: { flexDirection: 'row', gap: 5 },
  outlineButton: { flex: 0.8, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#2A9F85', alignItems: 'center' },
  outlineButtonText: { color: '#2A9F85', fontWeight: 'bold', fontSize: 12 },
  primaryButton: { flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: '#2A9F85', alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', fontStyle: 'italic', marginTop: 10 }
});
