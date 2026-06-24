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
import { MOCK_TRAINER, MOCK_APPOINTMENTS } from '../../data/mockData';
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
import { supabase, isSupabaseConfigured } from '../../services/supabase';

type TrainerDashboardProps = {
  onNavigate: (screen: 'TrainerAssignWorkout' | 'TrainerAgenda' | 'TrainerAppointments', params?: any) => void;
};

export default function TrainerDashboard({ onNavigate }: TrainerDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [trainer, setTrainer] = useState({
    name: MOCK_TRAINER.name,
    avatar: MOCK_TRAINER.avatar,
    username: MOCK_TRAINER.username,
  });
  const [activeStudentsCount, setActiveStudentsCount] = useState(24);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [aulasHojeCount, setAulasHojeCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      if (!isSupabaseConfigured()) {
        const mockToday = MOCK_APPOINTMENTS.filter(a => a.date === 'Hoje');
        setTodayAppointments(mockToday);
        setAulasHojeCount(mockToday.length);
        return;
      }

      try {
        setLoading(true);
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          const mockToday = MOCK_APPOINTMENTS.filter(a => a.date === 'Hoje');
          setTodayAppointments(mockToday);
          setAulasHojeCount(mockToday.length);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single();

        const { data: trainerData } = await supabase
          .from('trainers')
          .select('username')
          .eq('profile_id', user.id)
          .single();

        if (profile) {
          setTrainer({
            name: profile.name || MOCK_TRAINER.name,
            avatar: profile.avatar_url || null,
            username: trainerData?.username || MOCK_TRAINER.username,
          });
        }

        const { data: workouts } = await supabase
          .from('workouts')
          .select('student_id')
          .eq('trainer_id', user.id);

        const { data: appointments } = await supabase
          .from('appointments')
          .select('student_id')
          .eq('trainer_id', user.id);

        const { data: linkedStudents } = await supabase
          .from('students')
          .select('profile_id')
          .eq('trainer_id', user.id);

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
          .eq('trainer_id', user.id);

        if (apptsData) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // 1. Calculate count for "Aulas Hoje"
          const todayAppointmentsFiltered = apptsData.filter((apt: any) => {
            if (apt.date === 'Hoje') return true;
            if (apt.date === 'Amanhã') return false;
            const parts = apt.date.split('-');
            if (parts.length === 3) {
              const aptDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
              aptDate.setHours(0, 0, 0, 0);
              return aptDate.getTime() === today.getTime();
            }
            return false;
          });
          setAulasHojeCount(todayAppointmentsFiltered.length);

          // 2. Format and sort upcoming appointments
          const formatted = apptsData
            .map((apt: any) => {
              let aptDate: Date;
              if (apt.date === 'Hoje') {
                aptDate = new Date();
              } else if (apt.date === 'Amanhã') {
                aptDate = new Date();
                aptDate.setDate(aptDate.getDate() + 1);
              } else {
                const parts = apt.date.split('-');
                if (parts.length === 3) {
                  aptDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                } else {
                  aptDate = new Date(apt.date);
                }
              }
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
        console.error('Error loading trainer dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    let activeChannel: any = null;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      activeChannel = supabase
        .channel(`trainer-dashboard-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `trainer_id=eq.${user.id}` }, () => {
          loadData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts', filter: `trainer_id=eq.${user.id}` }, () => {
          loadData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `trainer_id=eq.${user.id}` }, () => {
          loadData();
        })
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, []);

  const copyLink = async () => {
    await Clipboard.setStringAsync(`ipersonal.app/personal/${trainer.username}`);
    Alert.alert('Link Copiado', `O link ipersonal.app/personal/${trainer.username} foi copiado para a área de transferência.`);
  };

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
            <Avatar src={trainer.avatar} name={trainer.name} size="md" alt={trainer.name} />
            <View>
              <Text className="text-zinc-400 text-sm">Olá,</Text>
              <Text className="text-xl font-bold text-zinc-100">{trainer.name.split(' ')[0]}</Text>
            </View>
          </View>
          <Pressable
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center relative"
            onPress={() => Alert.alert('Notificações', 'Sem novas notificações no momento.')}
          >
            <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-lime-400" />
            <View className="opacity-70">
              {/* Notification Bell Icon */}
              <Calendar size={18} color="#71717a" />
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
                  ipersonal.app/personal/{trainer.username}
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
                    <View className={`w-2 h-2 rounded-full ${apt.status === 'confirmed' ? 'bg-lime-400' : 'bg-amber-400'}`} />
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
