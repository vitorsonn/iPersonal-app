import React, { useState, useMemo, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Card, Input, Label } from '../../components/common/UI';
import { GlowingButton } from '../../components/auth/AuthUI';
import { MOCK_APPOINTMENTS } from '../../data/mockData';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { subscribeToAppointments } from '../../services/appointments';
import { useToast } from '../../components/common/Toast';

export default function TrainerAgenda() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [activeTab, setActiveTab] = useState<'calendar' | 'availability'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const [standardHours, setStandardHours] = useState<Record<string, { active: boolean; slots: string[] }>>({
    'Segunda': { active: true, slots: ['08:00 - 12:00', '14:00 - 18:00'] },
    'Terça': { active: true, slots: ['08:00 - 12:00', '14:00 - 18:00'] },
    'Quarta': { active: true, slots: ['08:00 - 12:00', '14:00 - 18:00'] },
    'Quinta': { active: true, slots: ['08:00 - 12:00', '14:00 - 18:00'] },
    'Sexta': { active: true, slots: ['08:00 - 12:00', '14:00 - 18:00'] },
  });
  const [isAddingStandard, setIsAddingStandard] = useState(false);
  const [selectedStandardDay, setSelectedStandardDay] = useState('Segunda');
  const [newStandardRange, setNewStandardRange] = useState('');

  useEffect(() => {
    async function loadStoredHours() {
      try {
        const stored = await SecureStore.getItemAsync('trainer_standard_hours');
        if (stored) {
          setStandardHours(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error loading standard hours:', e);
      }
    }
    loadStoredHours();
  }, []);

  const saveStandardHours = async (updated: typeof standardHours) => {
    try {
      setStandardHours(updated);
      await SecureStore.setItemAsync('trainer_standard_hours', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving standard hours:', e);
    }
  };

  const toggleDayActive = (day: string) => {
    const updated = {
      ...standardHours,
      [day]: {
        ...standardHours[day],
        active: !standardHours[day].active,
      }
    };
    saveStandardHours(updated);
  };

  const removeStandardSlot = (day: string, slotIndex: number) => {
    const daySlots = [...standardHours[day].slots];
    daySlots.splice(slotIndex, 1);

    const updated = {
      ...standardHours,
      [day]: {
        ...standardHours[day],
        slots: daySlots,
      }
    };
    saveStandardHours(updated);
  };

  const handleSelectDayAlert = () => {
    Alert.alert(
      'Selecionar Dia',
      'Escolha o dia da semana:',
      [
        { text: 'Segunda', onPress: () => setSelectedStandardDay('Segunda') },
        { text: 'Terça', onPress: () => setSelectedStandardDay('Terça') },
        { text: 'Quarta', onPress: () => setSelectedStandardDay('Quarta') },
        { text: 'Quinta', onPress: () => setSelectedStandardDay('Quinta') },
        { text: 'Sexta', onPress: () => setSelectedStandardDay('Sexta') },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const addStandardSlot = () => {
    if (!newStandardRange.trim()) {
      showToast('Por favor, preencha o horário (ex: 08:00 - 12:00).', 'error');
      return;
    }

    const rangeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!rangeRegex.test(newStandardRange.trim())) {
      showToast('Formato inválido. Use o formato HH:MM - HH:MM (ex: 08:00 - 12:00).', 'error');
      return;
    }

    const daySlots = [...(standardHours[selectedStandardDay]?.slots || []), newStandardRange.trim()];
    const updated = {
      ...standardHours,
      [selectedStandardDay]: {
        ...standardHours[selectedStandardDay],
        slots: daySlots,
      }
    };
    saveStandardHours(updated);
    setNewStandardRange('');
    setIsAddingStandard(false);
    showToast(`Horário padrão adicionado para ${selectedStandardDay}!`, 'success');
  };

  const handleSyncStandardHours = async () => {
    try {
      setLoading(true);
      const mapDayToPt = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const today = new Date();
      const newSlotsToInsert: any[] = [];
      
      let trainerId = 'demo-trainer';
      if (isSupabaseConfigured()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          trainerId = user.id;
        }
      }

      for (let i = 0; i < 30; i++) {
        const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        const weekdayIndex = targetDate.getDay();
        const weekdayName = mapDayToPt[weekdayIndex];
        
        const dayConfig = standardHours[weekdayName];
        if (dayConfig && dayConfig.active) {
          const formattedDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
          
          dayConfig.slots.forEach(range => {
            const parts = range.split('-');
            if (parts.length === 2) {
              const startPart = parts[0].trim();
              const endPart = parts[1].trim();
              const startHour = parseInt(startPart.split(':')[0], 10);
              const endHour = parseInt(endPart.split(':')[0], 10);
              
              if (!isNaN(startHour) && !isNaN(endHour) && startHour < endHour) {
                for (let h = startHour; h < endHour; h++) {
                  const timeString = `${String(h).padStart(2, '0')}:00:00`;
                  
                  const exists = slots.some(s => s.date === formattedDate && s.time.startsWith(`${String(h).padStart(2, '0')}:00`));
                  if (!exists) {
                    newSlotsToInsert.push({
                      trainer_id: trainerId,
                      date: formattedDate,
                      time: timeString,
                      is_booked: false
                    });
                  }
                }
              }
            }
          });
        }
      }

      if (newSlotsToInsert.length === 0) {
        showToast('Todos os horários padrão já estão presentes no seu calendário para os próximos 30 dias.', 'info');
        return;
      }

      if (!isSupabaseConfigured()) {
        const updatedSlots = [...slots];
        newSlotsToInsert.forEach((ns, idx) => {
          updatedSlots.push({
            id: `temp-${Date.now()}-${idx}`,
            ...ns
          });
        });
        setSlots(updatedSlots);
        showToast(`${newSlotsToInsert.length} horários padrão aplicados localmente!`, 'success');
        return;
      }

      const { error } = await supabase
        .from('available_slots')
        .insert(newSlotsToInsert);

      if (error) throw error;

      await loadSlots();
      showToast(`${newSlotsToInsert.length} horários padrão sincronizados com sucesso!`, 'success');
    } catch (err: any) {
      console.error('Error syncing standard slots:', err);
      showToast('Não foi possível sincronizar os horários: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearUnbookedSlots = async () => {
    Alert.alert(
      'Limpar Horários Livres',
      'Deseja remover TODOS os horários livres (não reservados) da sua agenda? Aulas já agendadas por alunos serão mantidas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar Tudo',
          style: 'destructive',
          onPress: async () => {
            if (!isSupabaseConfigured()) {
              setSlots(slots.filter(s => s.is_booked));
              showToast('Todos os horários livres locais foram removidos.', 'success');
              return;
            }

            try {
              setLoading(true);
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { error } = await supabase
                .from('available_slots')
                .delete()
                .eq('trainer_id', user.id)
                .eq('is_booked', false);

              if (error) throw error;

              await loadSlots();
              showToast('Todos os horários livres foram removidos da sua agenda.', 'success');
            } catch (err: any) {
              console.error('Error clearing unbooked slots:', err);
              showToast('Não foi possível limpar os horários: ' + err.message, 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    const formatted = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    setNewSlotDate(formatted);
  }, [selectedDate]);

  const loadData = async () => {
    if (!isSupabaseConfigured()) {
      setAppointments(MOCK_APPOINTMENTS);
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          student:student_id (
            objective,
            profile:profiles!students_profile_id_fkey (
              name
            )
          )
        `)
        .eq('trainer_id', user.id);

      if (data) {
        setAppointments(data);
      }
    } catch (err) {
      console.error('Error loading agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    if (!isSupabaseConfigured()) {
      setSlots([
        { id: '1', date: '2026-06-15', time: '08:00:00', is_booked: true },
        { id: '2', date: '2026-06-15', time: '10:00:00', is_booked: false },
        { id: '3', date: '2026-06-16', time: '14:00:00', is_booked: false },
        { id: '4', date: '2026-06-16', time: '16:00:00', is_booked: false },
      ]);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('available_slots')
        .select('*')
        .eq('trainer_id', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (data) {
        setSlots(data);
      }
    } catch (err) {
      console.error('Error loading slots:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadSlots();

    if (!isSupabaseConfigured()) return;

    let activeChannel: any = null;
    let slotsChannel: any = null;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      activeChannel = subscribeToAppointments('trainer_id', user.id, () => {
        loadData();
      });

      slotsChannel = supabase
        .channel(`trainer-slots-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'available_slots', filter: `trainer_id=eq.${user.id}` }, () => {
          loadSlots();
        })
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
      if (slotsChannel) {
        supabase.removeChannel(slotsChannel);
      }
    };
  }, []);

  // Helper to determine if dates are the same day
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isAppointmentOnDay = (aptDateStr: string, day: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (aptDateStr === 'Hoje') {
      return isSameDay(today, day);
    }
    if (aptDateStr === 'Amanhã') {
      return isSameDay(tomorrow, day);
    }

    try {
      let parsed: Date;
      if (aptDateStr.includes('-')) {
        const parts = aptDateStr.split('-');
        parsed = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        parsed = new Date(aptDateStr);
      }
      if (!isNaN(parsed.getTime())) {
        return isSameDay(parsed, day);
      }
    } catch (e) {}

    return false;
  };

  const bookedDates = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    appointments.forEach(apt => {
      if (apt.date === 'Hoje') {
        dates.push(today);
      } else if (apt.date === 'Amanhã') {
        dates.push(tomorrow);
      } else {
        let parsed: Date;
        if (apt.date && apt.date.includes('-')) {
          const parts = apt.date.split('-');
          parsed = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          parsed = new Date(apt.date);
        }
        if (!isNaN(parsed.getTime())) {
          dates.push(parsed);
        }
      }
    });
    return dates;
  }, [appointments]);

  const selectedDayAppointments = useMemo(() => {
    return appointments
      .filter(apt => isAppointmentOnDay(apt.date, selectedDate))
      .map(apt => ({
        id: apt.id,
        time: apt.time,
        clientName: apt.student?.profile?.name || apt.clientName || 'Aluno',
        objective: apt.student?.objective || apt.objective || 'Treino',
        status: apt.status,
      }));
  }, [appointments, selectedDate]);

  // Generate calendar grid days for currentMonth
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];

    // Padding for days before start of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Days of the month
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [currentMonth]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleAddSlot = async () => {
    if (!newSlotTime.trim()) {
      showToast('Por favor, preencha a hora (ex: 09:00).', 'error');
      return;
    }

    const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newSlotTime.trim())) {
      showToast('Formato de hora inválido. Use o formato HH:MM (ex: 08:30 ou 14:00).', 'error');
      return;
    }

    if (!isSupabaseConfigured()) {
      const newId = String(slots.length + 1);
      setSlots([...slots, {
        id: newId,
        date: newSlotDate,
        time: newSlotTime.trim() + ':00',
        is_booked: false
      }]);
      setNewSlotTime('');
      showToast('Horário adicionado à lista local.', 'success');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('available_slots')
        .insert({
          trainer_id: user.id,
          date: newSlotDate,
          time: newSlotTime.trim() + ':00',
          is_booked: false
        });

      if (error) throw error;

      setNewSlotTime('');
      await loadSlots();
      showToast('Horário livre adicionado com sucesso!', 'success');
    } catch (err: any) {
      console.error('Error adding slot:', err);
      showToast('Não foi possível adicionar o horário: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSlot = async (slotId: string, isBooked: boolean) => {
    if (isBooked) {
      showToast('Este horário já está reservado por um aluno. Para cancelá-lo, cancele a aula na aba de atendimentos.', 'error');
      return;
    }

    Alert.alert(
      'Remover Horário',
      'Tem certeza de que deseja remover este horário da sua disponibilidade?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            if (!isSupabaseConfigured()) {
              setSlots(slots.filter(s => s.id !== slotId));
              showToast('Horário removido localmente.', 'success');
              return;
            }

            try {
              setLoading(true);
              const { error } = await supabase
                .from('available_slots')
                .delete()
                .eq('id', slotId);

              if (error) throw error;

              await loadSlots();
              showToast('Horário livre removido com sucesso!', 'success');
            } catch (err: any) {
              console.error('Error deleting slot:', err);
              showToast('Não foi possível remover o horário.', 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <ScrollView
      className="flex-1 bg-zinc-950"
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="p-6 gap-6">
        {/* Header */}
        <View className="pt-4">
          <Text className="text-2xl font-bold text-zinc-100">Agenda</Text>
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-zinc-900 p-1 rounded-2xl">
          <Pressable
            onPress={() => setActiveTab('calendar')}
            className={`flex-1 py-3 items-center justify-center rounded-xl ${
              activeTab === 'calendar' ? 'bg-zinc-800' : 'bg-transparent'
            }`}
          >
            <Text className={`text-sm font-medium ${activeTab === 'calendar' ? 'text-white' : 'text-zinc-500'}`}>
              Calendário
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('availability')}
            className={`flex-1 py-3 items-center justify-center rounded-xl ${
              activeTab === 'availability' ? 'bg-zinc-800' : 'bg-transparent'
            }`}
          >
            <Text className={`text-sm font-medium ${activeTab === 'availability' ? 'text-white' : 'text-zinc-500'}`}>
              Disponibilidade
            </Text>
          </Pressable>
        </View>

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <View className="gap-5">
            {/* Custom Interactive Calendar */}
            <Card className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl">
              {/* Calendar Header */}
              <View className="flex-row justify-between items-center mb-4 px-2">
                <Text className="text-zinc-100 font-bold text-base">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={handlePrevMonth}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95"
                  >
                    <ChevronLeft size={16} color="#e4e4e7" />
                  </Pressable>
                  <Pressable
                    onPress={handleNextMonth}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95"
                  >
                    <ChevronRight size={16} color="#e4e4e7" />
                  </Pressable>
                </View>
              </View>

              {/* Weekday headers */}
              <View className="flex-row mb-2">
                {weekdays.map((wd, index) => (
                  <View key={index} className="flex-1 items-center py-1">
                    <Text className="text-[11px] font-semibold text-zinc-500">{wd}</Text>
                  </View>
                ))}
              </View>

              {/* Days grid */}
              <View className="flex-row flex-wrap">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <View key={`empty-${idx}`} className="w-[14.28%] aspect-square" />;
                  }

                  const isSelected = isSameDay(day, selectedDate);
                  const isBooked = bookedDates.some(bd => isSameDay(bd, day));
                  const isToday = isSameDay(day, new Date());

                  return (
                    <Pressable
                      key={day.toISOString()}
                      onPress={() => setSelectedDate(day)}
                      className="w-[14.28%] aspect-square items-center justify-center p-1"
                    >
                      <View
                        className={`w-9 h-9 items-center justify-center rounded-xl relative ${
                          isSelected
                            ? 'bg-lime-400'
                            : isToday
                            ? 'border border-lime-400'
                            : 'bg-transparent'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            isSelected
                              ? 'text-zinc-950 font-bold'
                              : isToday
                              ? 'text-lime-400 font-bold'
                              : 'text-zinc-200'
                          }`}
                        >
                          {day.getDate()}
                        </Text>

                        {/* Dot Indicator for Booked dates */}
                        {isBooked && !isSelected && (
                          <View className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-lime-400" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            {/* Selected Date Appointments */}
            <View className="gap-3">
              <Text className="font-semibold text-zinc-300">
                {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
              </Text>

              {selectedDayAppointments.length > 0 ? (
                selectedDayAppointments.map((apt) => (
                  <Card key={apt.id} className="p-4 flex-row items-center gap-4">
                    <View className="flex-col items-center justify-center w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800">
                      <Text className="text-lg font-bold text-lime-400">{apt.time.split(':')[0]}</Text>
                      <Text className="text-[10px] text-zinc-500 uppercase">{apt.time.split(':')[1]}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-zinc-100">{apt.clientName}</Text>
                      <Text className="text-sm text-zinc-400 mt-0.5">{apt.objective}</Text>
                    </View>
                    <View className={`w-2 h-2 rounded-full ${
                      (apt.status === 'confirmed' || apt.status === 'CHECKED_IN') 
                        ? 'bg-lime-400' 
                        : (apt.status === 'scheduled' || apt.status === 'PENDENTE')
                        ? 'bg-amber-400'
                        : (apt.status === 'pending' || apt.status === 'AGUARDANDO')
                        ? 'bg-blue-400'
                        : (apt.status === 'no_show' || apt.status === 'NO_SHOW')
                        ? 'bg-red-500'
                        : (apt.status === 'CONCLUIDA' || apt.status === 'completed')
                        ? 'bg-zinc-500'
                        : 'bg-blue-400'
                    }`} />
                  </Card>
                ))
              ) : (
                <View className="items-center py-10">
                  <Text className="text-sm text-zinc-500 font-medium">Nenhum atendimento neste dia</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Availability View */}
        {activeTab === 'availability' && (
          <View className="gap-6">
            {/* 1. Standard Weekly Schedule */}
            <View className="gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-lg font-bold text-zinc-100">Horários Padrão</Text>
                  <Text className="text-xs text-zinc-500 mt-0.5">Defina seus dias de atendimento semanais</Text>
                </View>
                <Pressable
                  onPress={() => setIsAddingStandard(true)}
                  className="p-2.5 bg-lime-400 rounded-full active:scale-95"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Plus size={18} color="#09090b" strokeWidth={3} />
                </Pressable>
              </View>

              {/* Sync Standard Hours Card */}
              <Card className="p-4 bg-lime-400 border border-lime-400 rounded-3xl flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-zinc-950 font-bold text-sm">Aplicar no Calendário</Text>
                  <Text className="text-zinc-800 text-[11px] font-medium mt-0.5">
                    Gere automaticamente esses horários no seu calendário para os próximos 30 dias.
                  </Text>
                </View>
                <Pressable
                  onPress={handleSyncStandardHours}
                  className="px-4 py-2.5 bg-zinc-950 rounded-xl active:scale-95 flex-row items-center gap-1.5"
                >
                  <Text className="text-lime-400 font-bold text-xs">Sincronizar</Text>
                </Pressable>
              </Card>

              {slots.some(s => !s.is_booked) && (
                <Pressable
                  onPress={handleClearUnbookedSlots}
                  className="py-3.5 px-4 bg-red-500/10 border border-red-500/25 rounded-2xl active:scale-95 items-center justify-center -mt-2"
                >
                  <Text className="text-red-400 font-bold text-xs">Limpar todos os horários livres gerados</Text>
                </Pressable>
              )}

              {/* Add Standard Slot Card Inline */}
              {isAddingStandard && (
                <Card className="p-5 gap-4 bg-zinc-900 border border-zinc-800 rounded-3xl">
                  <Text className="font-bold text-zinc-100 text-sm">Adicionar Horário Padrão</Text>
                  
                  <View className="flex-row gap-4">
                    <View className="flex-1 gap-2">
                      <Label>Dia da Semana</Label>
                      <Pressable
                        onPress={handleSelectDayAlert}
                        className="h-14 bg-zinc-950 border border-zinc-800 rounded-2xl justify-center px-4"
                      >
                        <Text className="text-zinc-100 text-sm">{selectedStandardDay}</Text>
                      </Pressable>
                    </View>
                    <View className="flex-1 gap-2">
                      <Label>Horário (ex: 08:00 - 12:00)</Label>
                      <Input
                        value={newStandardRange}
                        onChangeText={setNewStandardRange}
                        placeholder="08:00 - 12:00"
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-3 mt-1">
                    <Pressable
                      onPress={() => setIsAddingStandard(false)}
                      className="flex-1 h-12 bg-zinc-800 rounded-xl items-center justify-center active:scale-95"
                    >
                      <Text className="text-zinc-300 font-semibold text-sm">Cancelar</Text>
                    </Pressable>
                    <Pressable
                      onPress={addStandardSlot}
                      className="flex-1 h-12 bg-lime-400 rounded-xl items-center justify-center active:scale-95"
                    >
                      <Text className="text-zinc-950 font-bold text-sm">Salvar</Text>
                    </Pressable>
                  </View>
                </Card>
              )}

              <View className="gap-4">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((day) => {
                  const dayData = standardHours[day] || { active: false, slots: [] };
                  return (
                    <Card key={day} className={`p-4 gap-4 ${dayData.active ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-900/40 bg-zinc-900/20 opacity-60'}`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2.5">
                          <Text className={`font-bold text-base ${dayData.active ? 'text-zinc-100' : 'text-zinc-500'}`}>{day}</Text>
                          {!dayData.active && (
                            <View className="px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800">
                              <Text className="text-[10px] text-zinc-500 font-bold uppercase">Folga</Text>
                            </View>
                          )}
                        </View>
                        <Pressable
                          onPress={() => toggleDayActive(day)}
                          className={`w-12 h-6 rounded-full p-1 flex-row items-center ${
                            dayData.active ? 'bg-lime-400 justify-end' : 'bg-zinc-800 justify-start'
                          }`}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <View className="w-4 h-4 rounded-full bg-zinc-950" />
                        </Pressable>
                      </View>
                      
                      {dayData.active && dayData.slots && dayData.slots.length > 0 ? (
                        <View className="flex-row flex-wrap gap-2 pt-3 border-t border-zinc-850">
                          {dayData.slots.map((slot, index) => (
                            <View key={index} className="flex-row items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex-1 min-w-[45%] max-w-[48%]">
                              <View className="flex-row items-center gap-1.5">
                                <Clock size={12} color="#71717a" />
                                <Text className="text-xs text-zinc-300 font-medium">{slot}</Text>
                              </View>
                              <Pressable 
                                onPress={() => removeStandardSlot(day, index)} 
                                className="p-2 -mr-1.5 active:bg-red-500/10 rounded-lg"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <Trash2 size={13} color="#ef4444" />
                              </Pressable>
                            </View>
                          ))}
                        </View>
                      ) : dayData.active ? (
                        <View className="pt-2 border-t border-zinc-850 items-center justify-center py-2">
                          <Text className="text-zinc-500 text-xs">Nenhum horário cadastrado para este dia</Text>
                        </View>
                      ) : null}
                    </Card>
                  );
                })}
              </View>
            </View>

            {/* 2. Custom Date-Specific Slots */}
            <View className="gap-4 pt-6 border-t border-zinc-900">
              <View className="gap-1">
                <Text className="text-lg font-bold text-zinc-100">Datas Livres Individuais</Text>
                <Text className="text-xs text-zinc-500">Cadastre horários extras para datas específicas no calendário</Text>
              </View>

              {/* Add Slot Form Card */}
              <Card className="p-5 gap-4">
                <Text className="font-bold text-sm text-zinc-100">Adicionar Horário na Agenda</Text>
                
                <View className="flex-row gap-4">
                  <View className="flex-1 gap-2">
                    <Label>Data (AAAA-MM-DD)</Label>
                    <Input
                      value={newSlotDate}
                      onChangeText={setNewSlotDate}
                      placeholder="AAAA-MM-DD"
                    />
                  </View>
                  <View className="flex-1 gap-2">
                    <Label>Hora (HH:MM)</Label>
                    <Input
                      value={newSlotTime}
                      onChangeText={setNewSlotTime}
                      placeholder="08:00"
                    />
                  </View>
                </View>

                <GlowingButton className="mt-2" onPress={handleAddSlot}>
                  <View className="flex-row items-center justify-center gap-2">
                    <Plus size={18} color="#09090b" />
                    <Text className="text-zinc-950 font-bold">Adicionar Horário Específico</Text>
                  </View>
                </GlowingButton>
              </Card>

              <View className="gap-4 mt-2">
                <Text className="text-sm font-bold text-zinc-200">Horários Extras Salvos</Text>

                {slots.length > 0 ? (
                  slots.map((slot) => {
                    const displayTime = slot.time.split(':').slice(0, 2).join(':');
                    let displayDate = slot.date;
                    if (slot.date && slot.date.includes('-')) {
                      const parts = slot.date.split('-');
                      if (parts.length === 3) {
                        displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                      }
                    }

                    return (
                      <Card key={slot.id} className="p-4 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-4">
                          <View className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 items-center justify-center">
                            <Clock size={18} color="#a3e635" />
                          </View>
                          <View>
                            <Text className="font-semibold text-zinc-100">{displayDate}</Text>
                            <Text className="text-sm text-zinc-400 mt-0.5">{displayTime}</Text>
                          </View>
                        </View>

                        <View className="flex-row items-center gap-3">
                          <View className={`px-2.5 py-1 rounded-full ${
                            slot.is_booked
                              ? 'bg-zinc-800'
                              : 'bg-lime-400/10'
                          }`}>
                            <Text className={`text-[10px] font-semibold ${
                              slot.is_booked ? 'text-zinc-500' : 'text-lime-400'
                            }`}>
                              {slot.is_booked ? 'Reservado' : 'Livre'}
                            </Text>
                          </View>
                          
                          <Pressable
                            onPress={() => handleRemoveSlot(slot.id, slot.is_booked)}
                            className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 active:bg-red-500/10"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Trash2 size={15} color="#ef4444" />
                          </Pressable>
                        </View>
                      </Card>
                    );
                  })
                ) : (
                  <View className="items-center py-8 border border-dashed border-zinc-850 rounded-3xl bg-zinc-900/10">
                    <Text className="text-sm text-zinc-500 font-medium">Nenhum horário individual cadastrado</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
