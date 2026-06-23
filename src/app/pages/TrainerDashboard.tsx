import React, { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { MOCK_TRAINER, MOCK_APPOINTMENTS } from '../mockData';
import { Avatar, Card } from '../components/native/UI';
import { GlowingButton } from '../components/native/AuthUI';
import {
  ArrowRight,
  Calendar,
  Copy,
  Plus,
  Share2,
  Users,
} from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '../services/supabase';

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

  useEffect(() => {
    async function loadData() {
      if (!isSupabaseConfigured()) {
        const mockToday = MOCK_APPOINTMENTS.filter(a => a.date === 'Hoje');
        setTodayAppointments(mockToday);
        return;
      }

      try {
        setLoading(true);
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          const mockToday = MOCK_APPOINTMENTS.filter(a => a.date === 'Hoje');
          setTodayAppointments(mockToday);
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
            avatar: profile.avatar_url || MOCK_TRAINER.avatar,
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

        const studentIds = new Set([
          ...(workouts || []).map(w => w.student_id),
          ...(appointments || []).map(a => a.student_id)
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
              profile:profiles (
                name
              )
            )
          `)
          .eq('trainer_id', user.id)
          .eq('date', 'Hoje');

        if (apptsData) {
          const formatted = apptsData.map((apt: any) => ({
            id: apt.id,
            time: apt.time,
            clientName: apt.student?.profile?.name || 'Aluno',
            objective: apt.student?.objective || 'Treino',
            status: apt.status,
          }));
          setTodayAppointments(formatted);
        } else {
          setTodayAppointments([]);
        }

      } catch (err) {
        console.error('Error loading trainer dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const copyLink = () => {
    Alert.alert('Link Copiado', `ipersonal.app/personal/${trainer.username}`);
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
            <Avatar src={trainer.avatar} size="md" alt={trainer.name} />
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
        <Card className="bg-gradient-to-br from-lime-400 to-emerald-500 p-6 relative overflow-hidden">
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
              <Text className="text-3xl font-bold text-zinc-100">{todayAppointments.length}</Text>
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
            {todayAppointments.map((apt) => (
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
                    <Text className="font-bold text-zinc-100">{apt.clientName}</Text>
                    <Text className="text-sm text-zinc-400 mt-0.5">{apt.objective}</Text>
                  </View>
                  <View className={`w-2 h-2 rounded-full ${apt.status === 'confirmed' ? 'bg-lime-400' : 'bg-amber-400'}`} />
                </Card>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
