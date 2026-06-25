import React, { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';

import { Avatar, Card, Input, Label } from '../../components/common/UI';
import { GlowingButton } from '../../components/auth/AuthUI';
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Star,
} from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { rescheduleAppointment } from '../../services/appointments';

const getFriendlyDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const isToday = today.getFullYear() === date.getFullYear() && today.getMonth() === date.getMonth() && today.getDate() === date.getDate();
    const isTomorrow = tomorrow.getFullYear() === date.getFullYear() && tomorrow.getMonth() === date.getMonth() && tomorrow.getDate() === date.getDate();
    
    const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weekdayName = weekdays[date.getDay()];
    const formattedDate = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`;
    
    if (isToday) return `Hoje (${formattedDate})`;
    if (isTomorrow) return `Amanhã (${formattedDate})`;
    return `${weekdayName}, ${formattedDate}`;
  } catch (e) {
    return dateStr;
  }
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
};

type ClientBookingPageProps = {
  username?: string;
  appointmentId?: string;
  onNavigate: (screen: 'ClientBooking' | 'ClientSuccess' | 'ClientWorkouts', params?: any) => void;
  onGoBack: () => void;
};

export default function ClientBookingPage({ username, appointmentId, onNavigate, onGoBack }: ClientBookingPageProps) {
  const isReschedule = !!appointmentId;
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [step, setStep] = useState<'profile' | 'form'>('profile');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [objective, setObjective] = useState('');

  const [trainer, setTrainer] = useState({
    name: '',
    avatar: '',
    role: '',
    bio: '',
    specialties: [],
    certifications: [],
    availableSlots: [],
    username: '',
  });

  useEffect(() => {
    async function loadTrainer() {
      if (!isSupabaseConfigured() || !username) {
        return;
      }

      try {
        setLoading(true);
        // 1. Fetch trainer data by username
        const { data: trainerData, error: tError } = await supabase
          .from('trainers')
          .select(`
            profile_id,
            username,
            bio,
            specialties,
            certifications,
            profile:profiles (
              name,
              avatar_url
            )
          `)
          .eq('username', username)
          .single();

        if (tError || !trainerData) return;

        const tProfile = Array.isArray(trainerData.profile) ? trainerData.profile[0] : trainerData.profile;

        // 2. Fetch available slots for this trainer
        const { data: slotsData } = await supabase
          .from('available_slots')
          .select('*')
          .eq('trainer_id', trainerData.profile_id);

        const defaultSlots = [
          { id: '1', date: '2026-06-15', time: '08:00' },
          { id: '2', date: '2026-06-15', time: '10:00' },
          { id: '3', date: '2026-06-16', time: '14:00' },
          { id: '4', date: '2026-06-16', time: '16:00' },
        ];

        const formattedSlots = slotsData && slotsData.length > 0
          ? slotsData.map((s: any) => ({
              id: s.id,
              date: s.date,
              time: s.time,
              trainer_id: s.trainer_id || trainerData.profile_id,
            }))
          : defaultSlots.map(s => ({ ...s, trainer_id: trainerData.profile_id }));

        setTrainer({
          name: tProfile?.name || '',
          avatar: tProfile?.avatar_url || '',
          role: 'Personal Trainer',
          bio: trainerData.bio || 'Especialista em saúde e boa forma.',
          specialties: trainerData.specialties || ['Hipertrofia'],
          certifications: trainerData.certifications || [],
          availableSlots: formattedSlots,
          username: trainerData.username,
        });
      } catch (err) {

      } finally {
        setLoading(false);
      }
    }

    loadTrainer();
  }, [username]);

  if (loading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#a3e635" />
      </View>
    );
  }

  const handleObjectivePress = () => {
    Alert.alert(
      'Selecionar Objetivo',
      'Escolha seu objetivo principal:',
      [
        { text: 'Emagrecimento', onPress: () => setObjective('Emagrecimento') },
        { text: 'Hipertrofia', onPress: () => setObjective('Hipertrofia') },
        { text: 'Condicionamento Físico', onPress: () => setObjective('Condicionamento Físico') },
        { text: 'Reabilitação', onPress: () => setObjective('Reabilitação') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleReschedule = async () => {
    if (!selectedSlotData || !appointmentId) return;

    try {
      if (isSupabaseConfigured()) {
        await rescheduleAppointment(
          appointmentId,
          selectedSlotData.date,
          selectedSlotData.time,
          selectedSlotData.id,
        );
      } else {
        // Mock mode: update existing appointment in-place (no duplication)
        const mockApt = [].find((a: any) => a.id === appointmentId);
        if (mockApt) {
          mockApt.date = selectedSlotData.date;
          mockApt.time = selectedSlotData.time;
          mockApt.status = 'pending';
        }
        const mockClass = [].find((c: any) => c.id === appointmentId);
        if (mockClass) {
          mockClass.date = selectedSlotData.date;
          mockClass.time = selectedSlotData.time;
          mockClass.status = 'pending';
        }
      }
      onNavigate('ClientSuccess', { username });
    } catch (err: any) {

      Alert.alert('Erro', 'Houve um erro ao reagendar: ' + err.message);
    }
  };

  const handleConfirm = async () => {
    if (!fullName || !phone || !email || !objective) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (isSupabaseConfigured() && selectedSlotData) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          Alert.alert('Erro', 'Você precisa estar logado para agendar.');
          return;
        }

        // Clean up old active appointments (rescheduling)
        const { data: oldApts } = await supabase
          .from('appointments')
          .select('trainer_id, date, time')
          .eq('student_id', user.id)
          .in('status', ['pending', 'scheduled', 'PENDENTE']);

        if (oldApts && oldApts.length > 0) {
          for (const oldApt of oldApts) {
            // Free the slot
            await supabase
              .from('available_slots')
              .update({ is_booked: false })
              .eq('trainer_id', oldApt.trainer_id)
              .eq('date', oldApt.date)
              .eq('time', oldApt.time);
          }

          // Delete old appointments
          await supabase
            .from('appointments')
            .delete()
            .eq('student_id', user.id)
            .in('status', ['pending', 'scheduled', 'PENDENTE']);
        }

        const { data: newApt, error: aptError } = await supabase
          .from('appointments')
          .insert({
            trainer_id: selectedSlotData.trainer_id,
            student_id: user.id,
            date: selectedSlotData.date,
            time: selectedSlotData.time,
            status: 'pending',
          })
          .select()
          .single();

        if (aptError) throw aptError;

        const { error: slotError } = await supabase
          .from('available_slots')
          .update({ is_booked: true })
          .eq('id', selectedSlotData.id);

        if (slotError) {

        }

        if (newApt) {
          import('../../services/notificationService').then(service => {
            service.createAppointmentNotification(
              user.id,
              selectedSlotData.trainer_id,
              fullName || 'Aluno',
              selectedSlotData.date,
              selectedSlotData.time,
              newApt.id
);
          });
        }

      } catch (err: any) {

        Alert.alert('Erro', 'Houve um erro ao salvar o agendamento no servidor: ' + err.message);
        return;
      }
    } else if (selectedSlotData) {
      // Offline/Mock mode
      const newAptId = `mock-a-${Date.now()}`;
      
      // Remove old pending/scheduled appointments from mock lists
      const oldAptsIdxs = [].map((a, i) => 
        (a.clientName === '' && (a.status === 'pending' || a.status === 'scheduled' || a.status === 'PENDENTE')) ? i : -1
      ).filter(i => i !== -1);
      
      for (let i = oldAptsIdxs.length - 1; i >= 0; i--) {
        [].splice(oldAptsIdxs[i], 1);
      }

      [] = [].filter(c => 
        c.status !== 'pending' && c.status !== 'scheduled' && c.status !== 'PENDENTE'
      );

      [].push({
        id: newAptId,
        clientName: '',
        date: selectedSlotData.date,
        time: selectedSlotData.time,
        status: 'pending',
        objective: objective,
      });

      [].unshift({
        id: newAptId,
        date: selectedSlotData.date,
        time: selectedSlotData.time,
        status: 'pending',
        trainerName: trainer.name,
      });
    }

    onNavigate('ClientSuccess', { username });
  };

  const selectedSlotData = trainer.availableSlots.find(s => s.id === selectedSlot) as any;

  if (step === 'form') {
    return (
      <View className="flex-1 bg-zinc-950">
        {/* Header */}
        <View className="px-6 pt-12 pb-4 flex-row items-center gap-4 border-b border-zinc-900 bg-zinc-950/80">
          <Pressable
            onPress={() => setStep('profile')}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center active:scale-95"
          >
            <ChevronLeft size={20} color="#71717a" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-zinc-400 text-xs">Agendando com</Text>
            <Text className="font-bold text-zinc-100 text-base" numberOfLines={1}>
              {trainer.name}
            </Text>
          </View>
        </View>

        {/* Form Container */}
        <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="gap-6">
            <View>
              <Text className="text-2xl font-bold text-zinc-100">Seus Detalhes</Text>
              {selectedSlotData && (
                <View className="flex-row flex-wrap items-center mt-1 gap-1">
                  <Text className="text-zinc-400 text-sm">Preencha para confirmar o agendamento em </Text>
                  <Text className="text-lime-400 font-bold text-sm">
                    {getFriendlyDate(selectedSlotData.date)} às {formatTime(selectedSlotData.time)}
                  </Text>
                </View>
              )}
            </View>

            <View className="gap-5">
              <View className="gap-2">
                <Label>Nome completo</Label>
                <Input value={fullName} onChangeText={setFullName} placeholder="Ex: João Silva" />
              </View>

              <View className="gap-2">
                <Label>Telefone (WhatsApp)</Label>
                <Input
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="(00) 00000-0000"
                />
              </View>

              <View className="gap-2">
                <Label>E-mail</Label>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="seu@email.com"
                />
              </View>

              <View className="gap-2">
                <Label>Qual o seu objetivo principal?</Label>
                <Pressable
                  onPress={handleObjectivePress}
                  className="h-14 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 justify-center"
                >
                  <Text className={`text-sm ${objective ? 'text-zinc-100' : 'text-zinc-500'}`}>
                    {objective || 'Selecione...'}
                  </Text>
                </Pressable>
              </View>

              <GlowingButton className="mt-4" onPress={handleConfirm}>
                <Text className="text-zinc-950 font-bold text-base">Confirmar Agendamento</Text>
              </GlowingButton>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Scrollable details */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: selectedSlot ? 120 : 60 }}>
        {/* Cover visual placeholder */}
        <View className="h-48 w-full bg-zinc-900 items-center justify-center relative overflow-hidden">
          <View className="absolute inset-0 bg-zinc-900/60" />
          <View className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-zinc-950 to-transparent" />
          {/* Back button */}
          <Pressable
            onPress={onGoBack}
            className="absolute top-12 left-6 w-10 h-10 rounded-full bg-zinc-950/80 items-center justify-center border border-zinc-800 z-25"
          >
            <ChevronLeft size={20} color="#e4e4e7" />
          </Pressable>
        </View>

        {/* Profile Card Overlay */}
        <View className="px-6 -mt-16 relative z-10 gap-6">
          <View className="items-center gap-3">
            <Avatar src={trainer.avatar} name={trainer.name} size="xl" className="ring-4 ring-zinc-950 shadow-xl" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-zinc-100 tracking-tight">{trainer.name}</Text>
              <Text className="text-lime-400 font-semibold text-sm mt-0.5">{trainer.role}</Text>
            </View>
            <Text className="text-zinc-400 text-sm text-center leading-relaxed px-4">
              {trainer.bio}
            </Text>
          </View>

          {/* Specialties Card */}
          <Card className="gap-5">
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <Star size={18} color="#a3e635" />
                <Text className="font-bold text-base text-zinc-200">Especialidades</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {trainer.specialties.map(spec => (
                  <View key={spec} className="px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700">
                    <Text className="text-zinc-300 text-xs font-semibold">{spec}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="gap-3 border-t border-zinc-800/60 pt-4">
              <View className="flex-row items-center gap-2">
                <Award size={18} color="#a3e635" />
                <Text className="font-bold text-base text-zinc-200">Certificações</Text>
              </View>
              <View className="gap-2">
                {trainer.certifications.map(cert => (
                  <View key={cert} className="flex-row items-center gap-2">
                    <CheckCircle2 size={14} color="#71717a" />
                    <Text className="text-sm text-zinc-400">{cert}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>

          {/* Open Slots */}
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Calendar size={20} color="#a3e635" />
                <Text className="text-lg font-bold text-zinc-100">Horários Livres</Text>
              </View>
              <View className="px-2.5 py-1 bg-zinc-900 rounded-md border border-zinc-800">
                <Text className="text-[10px] text-zinc-500 font-semibold uppercase">Próximos dias</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-3">
              {trainer.availableSlots.map(slot => {
                const isSelected = selectedSlot === slot.id;
                return (
                  <Pressable
                    key={slot.id}
                    onPress={() => setSelectedSlot(slot.id)}
                    className={`p-4 rounded-2xl border flex-1 min-w-[45%] ${
                      isSelected
                        ? 'bg-lime-400/10 border-lime-400'
                        : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <Text className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isSelected ? 'text-lime-400' : 'text-zinc-500'}`}>
                      {getFriendlyDate(slot.date)}
                    </Text>
                    <View className="flex-row items-center gap-1.5 mt-1">
                      <Clock size={14} color={isSelected ? '#a3e635' : '#e4e4e7'} />
                      <Text className={`font-semibold text-base ${isSelected ? 'text-lime-400' : 'text-zinc-200'}`}>
                        {formatTime(slot.time)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {selectedSlot && (
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pb-8">
          <GlowingButton className="w-full animate-fade-in" onPress={isReschedule ? handleReschedule : () => setStep('form')}>
            <Text className="text-zinc-950 font-bold text-base">
              {isReschedule ? 'Confirmar Reagendamento' : 'Continuar Agendamento'}
            </Text>
          </GlowingButton>
        </View>
      )}
    </View>
  );
}
