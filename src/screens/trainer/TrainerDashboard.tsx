import React, { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { Avatar, Card } from '../../components/common/UI';
import { GlowingButton } from '../../components/auth/AuthUI';
import {
  ArrowRight,
  Calendar,
  Copy,
  Plus,
  Share2,
  Users,
} from 'lucide-react-native';
import { supabase } from '../../config/supabase';
import { subscribeToAppointments } from '../../services/appointments';
import { getUserNotifications, subscribeToNotifications, Notification } from '../../services/notificationService';
import { Bell } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { isTodayStr, parseDateFromString } from '../../utils/dateUtils';

type TrainerDashboardProps = {
  onNavigate: (screen: 'TrainerAssignWorkout' | 'TrainerAgenda' | 'TrainerAppointments' | 'Notifications', params?: any) => void;
};

export default function TrainerDashboard({ onNavigate }: TrainerDashboardProps) {
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(false);
  const [trainer, setTrainer] = useState({
    name: '',
    avatar: '',
    username: '',
  });
  const [activeStudentsCount, setActiveStudentsCount] = useState(24);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [aulasHojeCount, setAulasHojeCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    async function loadData() {
      try {
        setDataLoading(true);

        const notifs = await getUserNotifications(user!.id);
        setNotifications(notifs.slice(0, 5));
        setUnreadCount(notifs.filter(n => !n.read).length);

        const { data: trainerData } = await supabase
          .from('trainers')
          .select('username')
          .eq('profile_id', user!.id)
          .single();

        setTrainer({
          name: authProfile?.name || '',
          avatar: authProfile?.avatar_url || null,
          username: trainerData?.username || '',
        });

        const { data: workouts } = await supabase
          .from('workouts')
          .select('student_id')
          .eq('trainer_id', user!.id);

        const { data: appointments } = await supabase
          .from('appointments')
          .select('student_id')
          .eq('trainer_id', user!.id);

        const { data: linkedStudents } = await supabase
          .from('students')
          .select('profile_id')
          .eq('trainer_id', user!.id);

        const studentIds = new Set([
          ...(workouts || []).map(w => w.student_id),
          ...(appointments || []).map(a => a.student_id),
          ...(linkedStudents || []).map(s => s.profile_id)
        ]);
        setActiveStudentsCount(studentIds.size || 0);

        const { data: apptsData } = await supabase
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
          .eq('trainer_id', user!.id);

        if (apptsData) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // 1. Calculate count for "Aulas Hoje"
          const todayAppointmentsFiltered = apptsData.filter((apt: any) => isTodayStr(apt.date));
          setAulasHojeCount(todayAppointmentsFiltered.length);

          // 2. Format and sort upcoming appointments
          const formatted = apptsData
            .map((apt: any) => {
              const aptDate = parseDateFromString(apt.date, apt.time);
              aptDate.setHours(0, 0, 0, 0);

              // Pretty print date for render
              let displayDate = apt.date;
              if (apt.date && apt.date.includes('-')) {
                const parts = apt.date.split('-');
                if (parts.length === 3) {
                  displayDate = `${parts[2]}/${parts[1]}`;
                }
              }

              return {
                id: apt.id,
                time: apt.time,
                date: displayDate,
                dateObj: aptDate,
                clientName: apt.student?.profile?.name || 'Aluno',
                objective: apt.student?.objective || 'Treino',
                status: apt.status,
              };
            })
            .filter((apt: any) => apt.dateObj >= today)
            .sort((a: any, b: any) => {
              if (a.dateObj.getTime() !== b.dateObj.getTime()) {
                return a.dateObj.getTime() - b.dateObj.getTime();
              }
              return a.time.localeCompare(b.time);
            });

          setTodayAppointments(formatted);
        } else {
          setAulasHojeCount(0);
          setTodayAppointments([]);
        }

      } catch (err) {

      } finally {
        setDataLoading(false);
      }
    }

    loadData();

    let activeChannel: any = null;
    let workoutsChannel: any = null;
    let studentsChannel: any = null;
    let notifsChannel: any = null;

    async function setupRealtime() {
      activeChannel = subscribeToAppointments('trainer_id', user!.id, () => {
        loadData();
      });

      workoutsChannel = supabase
        .channel(`trainer-workouts-${user!.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts', filter: `trainer_id=eq.${user!.id}` }, () => {
          loadData();
        })
        .subscribe();

      studentsChannel = supabase
        .channel(`trainer-students-${user!.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `trainer_id=eq.${user!.id}` }, () => {
          loadData();
        })
        .subscribe();

      notifsChannel = subscribeToNotifications(user!.id, async () => {
        const notifs = await getUserNotifications(user!.id);
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
  }, [user, authProfile]);

  const copyLink = async () => {
    await Clipboard.setStringAsync(`exp://192.168.0.15:8081/--/personal/${trainer.username}`);
    Alert.alert('Link Copiado', `O link exp://192.168.0.15:8081/--/personal/${trainer.username} foi copiado para a área de transferência.`);
  };

  if (authLoading || dataLoading) {
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
            <Avatar src={trainer.avatar} name={trainer.name} size="md" alt={trainer.name} />
            <View>
              <Text className="text-zinc-400 text-sm">Olá,</Text>
              <Text className="text-xl font-bold text-zinc-100">{trainer.name.split(' ')[0]}</Text>
            </View>
          </View>
          <Pressable
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center relative"
            onPress={() => onNavigate('Notifications')}
          >
            {unreadCount > 0 && (
              <View className="absolute top-1 right-1 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1 z-10">
                <Text className="text-[9px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
            <View className="opacity-70">
              <Bell size={18} color={unreadCount > 0 ? "#a3e635" : "#71717a"} />
            </View>
          </Pressable>
        </View>

        {/* Action Button */}
        <View className="flex-row gap-3">
          <GlowingButton
            className="flex-1 h-14"
            onPress={() => onNavigate('TrainerAssignWorkout')}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Plus size={18} color="#09090b" strokeWidth={3} />
              <Text className="text-zinc-950 font-bold">Montar Treino</Text>
            </View>
          </GlowingButton>
        </View>

        {/* Share Link Banner */}
        <Card className="bg-lime-400 border-lime-400 p-6 relative overflow-hidden">
          <View className="gap-4 z-10">
            <View>
              <Text className="text-xl font-bold text-zinc-950">Seu link de agendamento</Text>
              <Text className="text-zinc-800 text-sm mt-1">Compartilhe para receber novos alunos</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="bg-zinc-950/10 px-3 py-2.5 rounded-xl flex-1 justify-center">
                <Text className="text-zinc-950 text-sm font-medium" numberOfLines={1}>
                  exp://192.168.0.15:8081/--/personal/{trainer.username}
                </Text>
              </View>
              <Pressable
                onPress={copyLink}
                className="w-10 h-10 rounded-xl bg-zinc-950 items-center justify-center"
              >
                <Copy size={18} color="#a3e635" />
              </Pressable>
            </View>
          </View>
          <View className="absolute -right-6 -bottom-6 opacity-10">
            <Share2 size={120} color="#09090b" />
          </View>
        </Card>

        {/* Stats Grid */}
        <View className="flex-row gap-4">
          <Card className="flex-1 p-5 gap-3">
            <View className="w-10 h-10 rounded-xl bg-blue-500/10 items-center justify-center">
              <Users size={20} color="#3b82f6" />
            </View>
            <View>
              <Text className="text-3xl font-bold text-zinc-100">{activeStudentsCount}</Text>
              <Text className="text-sm text-zinc-400 font-medium mt-1">Alunos Ativos</Text>
            </View>
          </Card>
          <Card className="flex-1 p-5 gap-3">
            <View className="w-10 h-10 rounded-xl bg-lime-400/10 items-center justify-center">
              <Calendar size={20} color="#a3e635" />
            </View>
            <View>
              <Text className="text-3xl font-bold text-zinc-100">{aulasHojeCount}</Text>
              <Text className="text-sm text-zinc-400 font-medium mt-1">Aulas Hoje</Text>
            </View>
          </Card>
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

        {/* Today's Agenda */}
        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-zinc-100">Próximos Atendimentos</Text>
            <Pressable
              onPress={() => onNavigate('TrainerAgenda')}
              className="flex-row items-center gap-1"
            >
              <Text className="text-sm text-lime-400 font-medium">Ver tudo</Text>
              <ArrowRight size={14} color="#a3e635" />
            </Pressable>
          </View>

          <View className="gap-3">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((apt) => (
                <Pressable
                  key={apt.id}
                  onPress={() => onNavigate('TrainerAppointments', { appointmentId: apt.id })}
                >
                  <Card className="p-4 flex-row items-center gap-4 active:border-zinc-700">
                    <View className="flex-col items-center justify-center w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800">
                      <Text className="text-lg font-bold text-lime-400">{apt.time.split(':')[0]}</Text>
                      <Text className="text-[10px] text-zinc-500 uppercase">{apt.time.split(':')[1]}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-bold text-zinc-100">{apt.clientName}</Text>
                        {apt.date !== 'Hoje' && (
                          <Text className="text-[10px] font-bold text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full">
                            {apt.date}
                          </Text>
                        )}
                      </View>
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
                </Pressable>
              ))
            ) : (
              <Card className="p-5 items-center gap-3 border-dashed border-zinc-700">
                <Text className="font-medium text-zinc-500 text-sm">Nenhum atendimento agendado</Text>
              </Card>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
