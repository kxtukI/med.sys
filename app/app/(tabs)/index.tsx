import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Alert
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Appointment {
  id: number;
  date_time: string;
  specialty: string;
  status: string;
  professional: {
    id: number;
    specialty: string;
    user: { name: string; }
  };
  health_unit: { name: string; };
  patient?: {
      users?: { id: number; }
  }
}

const parseAndFormatDate = (dateString: string) => {
    if (!dateString) return { line1: '--', line2: '--', timestamp: 0 };
    let dateObj = new Date();

    if (dateString.includes('/')) {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('/');
        dateObj = new Date(`${year}-${month}-${day}T${timePart}:00`);
    } else {
        dateObj = new Date(dateString);
    }

    if (isNaN(dateObj.getTime())) return { line1: 'Data Inválida', line2: '', timestamp: 0 };

    const dayWeek = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dayMonth = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' });
    const time = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return {
        line1: `${dayWeek.charAt(0).toUpperCase() + dayWeek.slice(1)}, ${dayMonth}`,
        line2: time,
        timestamp: dateObj.getTime()
    };
};

const getCalendarDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 6; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({
        day: date.getDate(),
        week: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase(),
        active: i === 0
    });
  }
  return days;
};

export default function Home() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const calendarDays = getCalendarDays();

  const fetchAppointments = useCallback(async () => {
    try {
      // --- CORREÇÃO AQUI ---
      // 1. Removemos o 'patient_id' da URL para a API não filtrar errado.
      // 2. Adicionamos 'limit=100' para garantir que sua consulta venha na lista.
      const response = await api.get(`/appointments?status=scheduled&limit=100`);
      const allData = response.data.data || [];

      // 3. FILTRO MANUAL: Onde 'patient.users.id' é igual ao MEU ID (14)
      const myAppointments = allData.filter((app: any) => {
          const appUserId = app.patient?.users?.id || app.patient?.user_id;
          return String(appUserId) === String(user?.id);
      });

      const sorted = myAppointments.sort((a: any, b: any) => {
          const timeA = parseAndFormatDate(a.date_time).timestamp;
          const timeB = parseAndFormatDate(b.date_time).timestamp;
          return timeA - timeB;
      });

      setAppointments(sorted);
    } catch (error) {
      console.log('Erro ao buscar home:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  const onRefresh = () => { setRefreshing(true); fetchAppointments(); };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: signOut }]);
  };

  const goToExplore = (term: string) => {
      router.push({ pathname: '/(tabs)/explore', params: { specialty: term } } as any);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text></View>
          <View>
            <Text style={styles.welcomeLabel}>Bem-Vindo de Volta</Text>
            <Text style={styles.userName}>{user?.name ? user.name.split(' ')[0] : 'Paciente'}</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => Alert.alert("Sem notificações")}><Ionicons name="notifications-outline" size={24} color="#333" /></TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCategories = () => (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorias</Text>
          <TouchableOpacity onPress={() => router.push('/specialties' as any)}><Text style={styles.seeAll}>Veja tudo</Text></TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
          style={styles.categoriesScroll}
        >
          <CategoryItem icon="user-md" lib="FontAwesome5" label="Doutores" onPress={() => router.push('/(tabs)/explore' as any)} />
          <CategoryItem icon="capsules" lib="FontAwesome5" label="Farmácia" onPress={() => router.push('/pharmacy' as any)} />
          <CategoryItem icon="plus-circle" lib="FontAwesome5" label="Espec." onPress={() => router.push('/specialties' as any)} />
          <CategoryItem icon="chatbubbles" lib="Ionicons" label="Chat IA" onPress={() => router.push('/chat' as any)} />
          <CategoryItem icon="file-medical" lib="FontAwesome5" label="Prontuário" onPress={() => Alert.alert("Prontuário", "Em breve.")} />
        </ScrollView>
      </View>
    );

  const renderUpcoming = () => (
    <View style={styles.greenSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: '#fff' }]}>Próximas Consultas</Text>
        <Text style={{ color: '#fff' }}>Mês</Text>
      </View>

      <View style={styles.calendarStrip}>
        {calendarDays.map((item, index) => (
            <CalendarDay key={index} day={item.day} week={item.week} active={item.active} />
        ))}
      </View>

      <View style={styles.appointmentsContainer}>
        <View style={styles.cardHeader}>
           <Text style={{color: '#fff', opacity: 0.8}}>Seus agendamentos</Text>
           <TouchableOpacity onPress={() => router.push('/(tabs)/appointments' as any)}>
               <Text style={{color: '#fff', fontWeight: 'bold'}}>Veja tudo</Text>
           </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#fff" style={{marginTop: 20}} />
        ) : appointments.length > 0 ? (
          appointments.slice(0, 2).map((app) => {
            const dateInfo = parseAndFormatDate(app.date_time);
            return (
              <View key={app.id} style={styles.appointmentCard}>
                <View style={styles.timeContainer}>
                   <Text style={styles.dateText}>{dateInfo.line1}</Text>
                   <Text style={styles.timeText}>{dateInfo.line2}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.doctorInfo}>
                   <Text style={styles.doctorName}>{app.professional?.user?.name || 'Médico'}</Text>
                   <Text style={styles.doctorSpecialty}>
                       {app.specialty} • {app.health_unit?.name || 'Unidade'}
                   </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.noAppointmentText}>Nenhuma consulta agendada.</Text>
        )}
      </View>
    </View>
  );

  const renderSpecialties = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Especializações</Text>
        <TouchableOpacity onPress={() => router.push('/specialties' as any)}>
            <Text style={styles.seeAll}>Ver tudo</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.specialtiesGrid}>
        <SpecialtyCard icon="heartbeat" name="Cardiologia" color="#2A9F85" onPress={() => goToExplore('Cardio')} />
        <SpecialtyCard icon="allergies" name="Dermatologia" color="#2A9F85" onPress={() => goToExplore('Dermato')} />
        <SpecialtyCard icon="user-nurse" name="Clínica Geral" color="#2A9F85" onPress={() => goToExplore('Geral')} />
        <SpecialtyCard icon="baby" name="Pediatria" color="#2A9F85" onPress={() => goToExplore('Pediatria')} />
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      {renderCategories()}
      {renderUpcoming()}
      {renderSpecialties()}
      <View style={{height: 100}} />
    </ScrollView>
  );
}

const CategoryItem = ({ icon, lib, label, onPress }: any) => (
  <TouchableOpacity style={styles.categoryItem} onPress={onPress}>
    <View style={styles.categoryIcon}>
      {lib === 'FontAwesome5' ?
        <FontAwesome5 name={icon} size={20} color="#2A9F85" /> :
        <Ionicons name={icon} size={20} color="#2A9F85" />
      }
    </View>
    <Text style={styles.categoryLabel}>{label}</Text>
  </TouchableOpacity>
);

const CalendarDay = ({ day, week, active }: any) => (
  <View style={[styles.calendarItem, active && styles.calendarItemActive]}>
    <Text style={[styles.calendarDay, active && styles.calendarTextActive]}>{day}</Text>
    <Text style={[styles.calendarWeek, active && styles.calendarTextActive]}>{week}</Text>
  </View>
);

const SpecialtyCard = ({ icon, name, color, onPress }: any) => (
  <TouchableOpacity style={styles.specialtyCard} onPress={onPress}>
    <FontAwesome5 name={icon} size={32} color="#fff" />
    <Text style={styles.specialtyName}>{name}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: { padding: 20, paddingTop: 50 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerIcons: { flexDirection: 'row', gap: 15 },
  iconButton: { padding: 5 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#2A9F85', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  welcomeLabel: { fontSize: 12, color: '#2A9F85', textAlign: 'left' },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'left' },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2A9F85' },
  seeAll: { color: '#2A9F85', fontSize: 14 },

  categoriesScroll: { paddingBottom: 10 },
  categoriesContent: { flexGrow: 1, justifyContent: 'space-between' },

  categoryItem: { alignItems: 'center', minWidth: 70 },
  categoryIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  categoryLabel: { fontSize: 12, color: '#2A9F85', fontWeight: '500' },

  greenSection: { backgroundColor: '#2A9F85', paddingVertical: 20, paddingHorizontal: 20, marginBottom: 20 },
  calendarStrip: { flexDirection: 'row', marginBottom: 20, justifyContent: 'space-between', width: '100%' },
  calendarItem: { width: 48, height: 70, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  calendarItemActive: { backgroundColor: '#fff', borderColor: '#fff' },
  calendarDay: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  calendarWeek: { fontSize: 12, color: '#fff', marginTop: 4 },
  calendarTextActive: { color: '#2A9F85' },

  appointmentsContainer: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  appointmentCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  timeContainer: { width: '35%' },
  dateText: { color: '#fff', fontSize: 12 },
  timeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  divider: { width: 1, height: '80%', backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 15 },
  doctorInfo: { flex: 1 },
  doctorName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  doctorSpecialty: { color: '#fff', fontSize: 12, opacity: 0.9 },
  noAppointmentText: { color: '#fff', textAlign: 'center', marginVertical: 10, fontStyle: 'italic' },

  specialtiesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  specialtyCard: { width: '48%', backgroundColor: '#2A9F85', borderRadius: 20, padding: 20, alignItems: 'center', justifyContent: 'center', height: 120, marginBottom: 10 },
  specialtyName: { color: '#fff', fontWeight: 'bold', marginTop: 10, fontSize: 14 }
});
