import React, { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';

import { Avatar, Card } from '../../components/common/UI';
import { GlowingButton } from '../../components/auth/AuthUI';
import {
  ArrowRight,
  Calendar,
  Flame,
  Play,
  Target,
  CheckCircle2,
  Clock,
  Bell,
} from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '../../config/supabase';
import {
  getNextAppointment,
  checkInAppointment,
  subscribeToAppointments,
  parseAppointmentDateTime,
  markAsCompleted,
} from '../../services/appointments';
import { getUserNotifications, subscribeToNotifications, Notification } from '../../services/notificationService';

const sanitizeStatus = (status: string): string => {
  const s = (status || '').toUpperCase();
  if (s === 'PENDING' || s === 'AGUARDANDO') return 'AGUARDANDO';
  if (s === 'SCHEDULED' || s === 'PENDENTE') return 'PENDENTE';
  if (s === 'CONFIRMED' || s === 'CHECKED_IN') return 'CHECKED_IN';
  if (s === 'NO_SHOW') return 'NO_SHOW';
  if (s === 'CONCLUIDA' || s === 'COMPLETED' || s === 'CONCLUDED') return 'CONCLUIDA';
  return 'AGUARDANDO';
};

type ClientDashboardProps = {
  onNavigate: (screen: 'ClientBooking' | 'ClientSuccess' | 'ClientWorkouts' | 'ClientWorkoutSuccess' | 'Notifications', params?: any) => void;
};

export default function ClientDashboard({ onNavigate }: ClientDashboardProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState({
    name: '',
    avatar: '',
    streak: 0,
    workoutsCompleted: 0,
    trainer: {
      name: '',
      username: '',
    },
    upcomingClasses: [],
    workouts: [],
  });

  const getCheckInStatus = (dateStr: string, timeStr: string, status: string) => {
    if (status !== 'scheduled') {
      return { available: false, label: status === 'confirmed' ? 'Confirmada' : status === 'pending' ? 'Pendente' : 'No-Show' };
    }

    let classDate = new Date();
    if (dateStr === 'Hoje' || dateStr.toLowerCase().includes('hoje')) {
      // keeps today's date
    } else if (dateStr === 'Amanhã' || dateStr.toLowerCase().includes('amanhã')) {
      classDate.setDate(classDate.getDate() + 1);
    } else {
      const cleanDate = dateStr.trim();
      if (cleanDate.includes('/')) {
        const parts = cleanDate.split('/');
        if (parts.length === 3) {
          classDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      } else if (cleanDate.includes('-')) {
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
          classDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      }
    }

    const timeParts = timeStr.split(':');
    classDate.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);

    const now = new Date();
    const diffMs = classDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 2) {
      return { available: false, label: 'Expirada', expired: true };
    } else {
      return { available: true, label: 'Agendada', expired: false };
    }
  };

  const handleAutoNoShow = async (aptId: string) => {
    if (isSupabaseConfigured()) {
      try {
        const { data: apt } = await supabase
          .from('appointments')
          .select('trainer_id, date, time')
          .eq('id', aptId)
          .single();

        if (apt) {
          await supabase
            .from('appointments')
            .update({ status: 'no_show' })
            .eq('id', aptId);

          await supabase
            .from('available_slots')
            .update({ is_booked: false })
            .eq('trainer_id', apt.trainer_id)
            .eq('date', apt.date)
            .eq('time', apt.time);
        }
      } catch (err) {

      }
    }
    
    setClient(prev => ({
      ...prev,
      upcomingClasses: prev.upcomingClasses.map(c => 
        c.id === aptId ? { ...c, status: 'no_show' } : c
      )
    }));
  };

  const handleConfirmCheckIn = async (aptId: string) => {
    try {
      if (isSupabaseConfigured()) {
        await checkInAppointment(aptId);
      }
      Alert.alert('Sucesso 🎉', 'Seu check-in foi realizado com sucesso! Presença confirmada.');
      await loadData();
    } catch (err) {

      Alert.alert('Erro', 'Não foi possível confirmar o check-in no servidor.');
    }
  };

  const handleFinishWorkout = async (aptId: string) => {
    try {
      if (isSupabaseConfigured()) {
        await markAsCompleted(aptId);
      }
      onNavigate('ClientWorkoutSuccess');
    } catch (err: any) {
      if (err?.message === 'TOO_EARLY') {
        Alert.alert(
          'Ainda não! ⏳',
          'Você só pode finalizar uma aula no horário agendado ou após ele ter começado. Por enquanto, se precisar, você pode apenas reagendar.'
        );
      } else {

        Alert.alert('Erro', 'Não foi possível finalizar o treino no servidor.');
      }
    }
  };

  useEffect(() => {
    const checkExpiry = async () => {
      const next = client.upcomingClasses[0];
      // Only auto no-show for 'scheduled' (trainer-confirmed) appointments
      if (next && next.status === 'scheduled') {
        const check = getCheckInStatus(next.date, next.time, next.status);
        if (check.expired) {
          await handleAutoNoShow(next.id);
        }
      }
    };
    checkExpiry();
  }, [client.upcomingClasses]);

  async function loadData() {
    if (!isSupabaseConfigured()) return;

    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          streak,
          workouts_completed,
          objective,
          trainer_id,
          profile:profiles!students_profile_id_fkey (
            name,
            avatar_url
          )
        `)
        .eq('profile_id', user.id)
        .single();

      if (studentError || !studentData) return;

      const { data: workoutsData } = await supabase
        .from('workouts')
        .select(`
          id,
          title,
          duration,
          level,
          exercises (
            id,
            name,
            sets,
            reps,
            sequence_order
          )
        `)
        .eq('student_id', user.id);

      const nextApt = await getNextAppointment(user.id);
      
      const notifs = await getUserNotifications(user.id);
      setNotifications(notifs.slice(0, 5));
      setUnreadCount(notifs.filter(n => !n.read).length);

      let trainerInfo = {
        name: '',
        username: '',
      };

      if (studentData.trainer_id) {
        const { data: linkedTrainer } = await supabase
          .from('trainers')
          .select(`
            username,
            profile:profiles (
              name,
              avatar_url
            )
          `)
          .eq('profile_id', studentData.trainer_id)
          .single();

        if (linkedTrainer) {
          const tProfile = Array.isArray(linkedTrainer.profile) ? linkedTrainer.profile[0] : linkedTrainer.profile;
          trainerInfo = {
            name: tProfile?.name || '',
            username: linkedTrainer.username || '',
          };
        }
      } else if (nextApt && nextApt.trainer) {
        const trainerObj = nextApt.trainer as any;
        const tProfile = Array.isArray(trainerObj)
          ? (Array.isArray(trainerObj[0]?.profile) ? trainerObj[0].profile[0] : trainerObj[0]?.profile)
          : (Array.isArray(trainerObj.profile) ? trainerObj.profile[0] : trainerObj.profile);
        const tUsername = Array.isArray(trainerObj) ? trainerObj[0]?.username : trainerObj.username;
        trainerInfo = {
          name: tProfile?.name || '',
          username: tUsername || '',
        };
      } else {
        const { data: firstTrainer } = await supabase
          .from('trainers')
          .select(`
            username,
            profile:profiles (
              name
            )
          `)
          .limit(1)
          .single();
        if (firstTrainer) {
          const trainerObj = firstTrainer as any;
          const tProfile = Array.isArray(trainerObj.profile) ? trainerObj.profile[0] : trainerObj.profile;
          trainerInfo = {
            name: tProfile?.name || '',
            username: trainerObj.username || '',
          };
        }
      }

      const formattedUpcoming = nextApt ? (() => {
        const aptTrainer = nextApt.trainer as any;
        const tProfile = Array.isArray(aptTrainer)
          ? (Array.isArray(aptTrainer[0]?.profile) ? aptTrainer[0].profile[0] : aptTrainer[0]?.profile)
          : (Array.isArray(aptTrainer?.profile) ? aptTrainer.profile[0] : aptTrainer?.profile);
        
        let displayDate = nextApt.date;
        if (nextApt.date && nextApt.date.includes('-')) {
          const parts = nextApt.date.split('-');
          if (parts.length === 3) {
            displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }

        return [{
          id: nextApt.id,
          date: displayDate,
          rawDate: nextApt.date,
          time: nextApt.time,
          status: nextApt.status,
          trainerName: tProfile?.name || 'Personal',
        }];
      })() : [];

      // Sort upcoming classes by date/time ascending
      formattedUpcoming.sort((a, b) => {
        const dateA = a.rawDate ? new Date(`${a.rawDate}T${a.time}`) : new Date();
        const dateB = b.rawDate ? new Date(`${b.rawDate}T${b.time}`) : new Date();
        return dateA.getTime() - dateB.getTime();
      });

      // Since created_at doesn't exist, we just reverse the array so newest added is first
      if (workoutsData) {
        workoutsData.reverse();
      }

      const studentProfile = studentData.profile as any;

      setClient({
        name: studentProfile?.name || '',
        avatar: studentProfile?.avatar_url || null,
        streak: studentData.streak ?? 0,
        workoutsCompleted: studentData.workouts_completed ?? 0,
        trainer: trainerInfo,
        upcomingClasses: formattedUpcoming,
        workouts: workoutsData || [],
      });

    } catch (err) {

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    let activeChannel: any = null;
    let workoutsChannel: any = null;
    let studentsChannel: any = null;
    let notifsChannel: any = null;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      activeChannel = subscribeToAppointments('student_id', user.id, () => {
        loadData();
      });

      workoutsChannel = supabase
        .channel(`client-workouts-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts', filter: `student_id=eq.${user.id}` }, () => {
          loadData();
        })
        .subscribe();

      studentsChannel = supabase
        .channel(`client-students-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `profile_id=eq.${user.id}` }, () => {
          loadData();
        })
        .subscribe();

      notifsChannel = subscribeToNotifications(user.id, async () => {
        const notifs = await getUserNotifications(user.id);
        setNotifications(notifs.slice(0, 5));
        setUnreadCount(notifs.filter(n => !n.read).length);
      });
    }

    setupRealtime();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
      if (workoutsChannel) {
        supabase.removeChannel(workoutsChannel);
      }
      if (studentsChannel) {
        supabase.removeChannel(studentsChannel);
      }
      if (notifsChannel) {
        supabase.removeChannel(notifsChannel);
      }
    };
  }, []);

  const { upcomingClasses, trainer, streak, workoutsCompleted, workouts } = client;
  
  // Sort classes dynamically for both mock and DB configurations
  const sortedUpcomingClasses = [...upcomingClasses].sort((a, b) => {
    const parseMockDate = (dateStr: string, timeStr: string) => {
      let d = new Date();
      if (!dateStr) return d;
      if (dateStr.toLowerCase().includes('hoje') || dateStr === 'Hoje') {
        // today
      } else if (dateStr.toLowerCase().includes('amanhã') || dateStr === 'Amanhã') {
        d.setDate(d.getDate() + 1);
      } else {
        const clean = dateStr.trim();
        if (clean.includes('/')) {
          const parts = clean.split('/');
          if (parts.length === 3) {
            d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
        } else if (clean.includes('-')) {
          const parts = clean.split('-');
          if (parts.length === 3) {
            d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
        }
      }
      const tParts = timeStr.split(':');
      d.setHours(parseInt(tParts[0], 10), parseInt(tParts[1], 10), 0, 0);
      return d;
    };

    const dateA = parseMockDate(a.date, a.time);
    const dateB = parseMockDate(b.date, b.time);
    return dateA.getTime() - dateB.getTime();
  });

  const nextClass = sortedUpcomingClasses[0];

  if (loading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#a3e635" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-zinc-950"
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="p-6 gap-6">
        {/* Header */}
        <View className="flex-row items-center justify-between pt-4">
          <View className="flex-row items-center gap-4">
            <Avatar src={client.avatar} size="md" alt={client.name} />
            <View>
              <Text className="text-zinc-400 text-sm">Pronta pro treino,</Text>
              <Text className="text-xl font-bold text-zinc-100">{client.name.split(' ')[0]}?</Text>
            </View>
          </View>
          <Pressable
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center"
            onPress={() => onNavigate('Notifications')}
          >
            {unreadCount > 0 && (
              <View className="absolute top-1 right-1 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1 z-10">
                <Text className="text-[9px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
            <Bell size={18} color={unreadCount > 0 ? "#a3e635" : "#71717a"} />
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-4">
          <Card className="flex-1 p-4 flex-row items-center gap-3 bg-zinc-900/50 border-zinc-800/50">
            <View className="w-10 h-10 rounded-xl bg-orange-500/10 items-center justify-center">
              <Flame size={20} color="#fb923c" />
            </View>
            <View>
              <Text className="text-xl font-bold text-zinc-100">{streak}</Text>
              <Text className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">Dias seguidos</Text>
            </View>
          </Card>
          <Card className="flex-1 p-4 flex-row items-center gap-3 bg-zinc-900/50 border-zinc-800/50">
            <View className="w-10 h-10 rounded-xl bg-lime-400/10 items-center justify-center">
              <Target size={20} color="#a3e635" />
            </View>
            <View>
              <Text className="text-xl font-bold text-zinc-100">{workoutsCompleted}</Text>
              <Text className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">Treinos feitos</Text>
            </View>
          </Card>
        </View>

        {/* Next Class */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-zinc-100">Próxima Aula</Text>
          {nextClass && sanitizeStatus(nextClass.status) !== 'NO_SHOW' ? (() => {
            const statusSanitized = sanitizeStatus(nextClass.status);
            const isCheckedIn = statusSanitized === 'CHECKED_IN';
            const isAguardando = statusSanitized === 'AGUARDANDO';
            
            const isFuture = parseAppointmentDateTime(nextClass.date, nextClass.time).getTime() > new Date().getTime();
            // Check-in only available when trainer has confirmed (PENDENTE/scheduled) and class is in the future
            const showCheckInButton = statusSanitized === 'PENDENTE' && isFuture;

            let badgeText = '';
            let badgeStyle = '';
            let badgeTextStyle = '';

            if (statusSanitized === 'AGUARDANDO') {
              badgeText = '🕐 Aguardando Confirmação';
              badgeStyle = 'bg-blue-500/10 border border-blue-500/20';
              badgeTextStyle = 'text-blue-400';
            } else if (statusSanitized === 'PENDENTE') {
              badgeText = '⏳ Agendada';
              badgeStyle = 'bg-amber-500/10 border border-amber-500/20';
              badgeTextStyle = 'text-amber-500';
            } else if (statusSanitized === 'CHECKED_IN') {
              badgeText = '✅ Check-In Realizado';
              badgeStyle = isCheckedIn ? 'bg-zinc-950/20' : 'bg-lime-400/10 border border-lime-400/20';
              badgeTextStyle = isCheckedIn ? 'text-zinc-900' : 'text-lime-400';
            } else if (statusSanitized === 'NO_SHOW') {
              badgeText = '❌ Não Compareceu';
              badgeStyle = 'bg-red-500/10 border border-red-500/20';
              badgeTextStyle = 'text-red-500';
            } else if (statusSanitized === 'CONCLUIDA') {
              badgeText = '🏁 Aula Concluída';
              badgeStyle = 'bg-zinc-800 border border-zinc-700';
              badgeTextStyle = 'text-zinc-400';
            }
            
            return (
              <Card 
                className={`p-6 relative overflow-hidden ${
                  isCheckedIn 
                    ? 'bg-lime-400 border-lime-400' 
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <View className="flex-row items-center justify-between z-10">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-2 mb-2">
                      <View className={`px-2.5 py-0.5 rounded-full ${badgeStyle}`}>
                        <Text className={`text-[10px] font-bold ${badgeTextStyle}`}>
                          {badgeText}
                        </Text>
                      </View>
                      {!isCheckedIn && showCheckInButton && (
                        <View className="flex-row items-center gap-1">
                          <Clock size={11} color="#facc15" />
                          <Text className="text-[10px] text-amber-400 font-semibold">Requer Check-in</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text className={`font-semibold mb-1 ${isCheckedIn ? 'text-zinc-900' : 'text-zinc-400'}`}>
                      {nextClass.date} às {nextClass.time.slice(0, 5)}
                    </Text>
                    <Text className={`text-2xl font-bold tracking-tight ${isCheckedIn ? 'text-zinc-950' : 'text-zinc-100'}`} numberOfLines={1}>
                      Com {nextClass.trainerName}
                    </Text>
                  </View>
                  <View className={`w-12 h-12 rounded-full items-center justify-center ${isCheckedIn ? 'bg-zinc-950' : 'bg-zinc-800'}`}>
                    <Calendar size={22} color={isCheckedIn ? '#a3e635' : '#71717a'} />
                  </View>
                </View>

                {/* Info banner for AGUARDANDO status */}
                {isAguardando && (
                  <View className="mt-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex-row gap-2 items-center z-10">
                    <Clock size={14} color="#60a5fa" />
                    <Text className="text-xs text-blue-400 font-medium flex-1">
                      Seu reagendamento foi enviado. Aguarde a confirmação do personal.
                    </Text>
                  </View>
                )}

                {/* Warnings / Deadlines for Check-in */}
                {!isCheckedIn && showCheckInButton && (
                  <View className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex-row gap-2 items-center z-10">
                    <Clock size={14} color="#facc15" />
                    <Text className="text-xs text-amber-500 font-medium flex-1">
                      Faça o check-in até 2 horas antes da aula para não perder sua vaga.
                    </Text>
                  </View>
                )}

                <View className="mt-6 flex-row gap-3 z-10">
                  {showCheckInButton && (
                    <Pressable
                      onPress={() => handleConfirmCheckIn(nextClass.id)}
                      className="flex-1 py-3.5 rounded-xl bg-lime-400 items-center justify-center active:scale-95 shadow-sm"
                    >
                      <Text className="text-zinc-950 font-bold text-sm">Fazer Check-In</Text>
                    </Pressable>
                  )}
                  {isCheckedIn ? (
                    <View className="flex-row flex-1 gap-2">
                      <Pressable
                        onPress={() => handleFinishWorkout(nextClass.id)}
                        className="flex-1 py-3.5 rounded-xl bg-lime-400 items-center justify-center active:scale-95 shadow-sm"
                      >
                        <Text className="text-zinc-950 font-bold text-sm">Finalizar Treino</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => onNavigate('ClientBooking', { username: trainer.username, appointmentId: nextClass.id })}
                        className="flex-1 py-3.5 rounded-xl items-center justify-center bg-zinc-950"
                      >
                        <Text className="text-white font-bold text-sm">Reagendar</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => onNavigate('ClientBooking', { username: trainer.username, appointmentId: nextClass.id })}
                      className="flex-1 py-3.5 rounded-xl items-center justify-center bg-zinc-800"
                    >
                      <Text className="text-white font-bold text-sm">Reagendar</Text>
                    </Pressable>
                  )}
                </View>
              </Card>
            );
          })() : (
            <Card className="p-6 items-center gap-4 border-dashed border-zinc-700">
              <View className="w-12 h-12 rounded-full bg-zinc-950 items-center justify-center border border-zinc-800">
                <Calendar size={22} color="#71717a" />
              </View>
              <View className="items-center">
                <Text className="font-semibold text-zinc-300">Nenhuma aula agendada</Text>
                <Text className="text-sm text-zinc-500 mt-1 text-center">
                  Marque seu próximo treino com {trainer.name.split(' ')[0]}
                </Text>
              </View>
              <GlowingButton
                className="w-full"
                onPress={() => onNavigate('ClientBooking', { username: trainer.username })}
              >
                Agendar Agora
              </GlowingButton>
            </Card>
          )}
        </View>

        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-zinc-100">Notificações Recentes</Text>
              <Pressable onPress={() => onNavigate('Notifications')}>
                <Text className="text-lime-400 text-sm font-semibold">Ver todas</Text>
              </Pressable>
            </View>
            <View className="gap-2">
              {notifications.map(n => (
                <Pressable key={n.id} onPress={() => onNavigate('Notifications')}>
                  <Card className={`flex-row items-center justify-between p-3 ${n.read ? 'opacity-70' : 'border-lime-400/30 bg-lime-400/5'}`}>
                    <View className="flex-1 pr-4">
                      <Text className={`font-bold text-sm ${n.read ? 'text-zinc-300' : 'text-zinc-100'}`}>{n.title}</Text>
                      <Text className="text-xs text-zinc-400" numberOfLines={1}>{n.message}</Text>
                    </View>
                    <Text className="text-[10px] text-zinc-500">
                      {new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Today's Workout Quick Access */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-zinc-100">Treino do Dia</Text>
            <Pressable
              onPress={() => onNavigate('ClientWorkouts')}
              className="flex-row items-center gap-1"
            >
              <Text className="text-sm text-lime-400 font-medium">Ver plano</Text>
              <ArrowRight size={14} color="#a3e635" />
            </Pressable>
          </View>

          {workouts && workouts.length > 0 ? (
            <Pressable
              onPress={() => onNavigate('ClientWorkouts')}
            >
              <Card className="p-5 flex-row items-center gap-4 active:border-zinc-700">
                <View className="w-16 h-16 rounded-2xl bg-zinc-950 items-center justify-center border border-zinc-800">
                  <Play size={24} color="#a3e635" style={{ marginLeft: 3 }} />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-zinc-100 text-base">{workouts[0]?.title}</Text>
                  <Text className="text-sm text-zinc-400 mt-1">
                    {workouts[0]?.exercises?.length || 0} exercícios • {workouts[0]?.duration}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ) : (
            <Card className="p-5 items-center gap-3 border-dashed border-zinc-700">
              <Text className="font-medium text-zinc-500 text-sm">Nenhum treino montado para hoje</Text>
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
  );
}