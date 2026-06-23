import React, { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { MOCK_CLIENT } from '../mockData';
import { Avatar, Card } from '../components/native/UI';
import { GlowingButton } from '../components/native/AuthUI';
import {
  ArrowRight,
  Calendar,
  Flame,
  Play,
  Target,
} from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '../services/supabase';

type ClientDashboardProps = {
  onNavigate: (screen: 'ClientBooking' | 'ClientSuccess' | 'ClientWorkouts', params?: any) => void;
};

export default function ClientDashboard({ onNavigate }: ClientDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState({
    name: MOCK_CLIENT.name,
    avatar: MOCK_CLIENT.avatar,
    streak: MOCK_CLIENT.stats.streak,
    workoutsCompleted: MOCK_CLIENT.stats.workoutsCompleted,
    trainer: {
      name: MOCK_CLIENT.trainer.name,
      username: MOCK_CLIENT.trainer.username,
    },
    upcomingClasses: MOCK_CLIENT.upcomingClasses,
    workouts: MOCK_CLIENT.workouts,
  });

  useEffect(() => {
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
            profile:profile_id (
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

        const { data: apptsData } = await supabase
          .from('appointments')
          .select(`
            id,
            date,
            time,
            status,
            trainer:trainer_id (
              username,
              profile:profiles (
                name,
                avatar_url
              )
            )
          `)
          .eq('student_id', user.id);

        let trainerInfo = {
          name: MOCK_CLIENT.trainer.name,
          username: MOCK_CLIENT.trainer.username,
        };

        if (apptsData && apptsData.length > 0 && apptsData[0].trainer) {
          const trainerObj = apptsData[0].trainer as any;
          const tProfile = Array.isArray(trainerObj)
            ? (Array.isArray(trainerObj[0]?.profile) ? trainerObj[0].profile[0] : trainerObj[0]?.profile)
            : (Array.isArray(trainerObj.profile) ? trainerObj.profile[0] : trainerObj.profile);
          const tUsername = Array.isArray(trainerObj) ? trainerObj[0]?.username : trainerObj.username;
          trainerInfo = {
            name: tProfile?.name || MOCK_CLIENT.trainer.name,
            username: tUsername || MOCK_CLIENT.trainer.username,
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
              name: tProfile?.name || MOCK_CLIENT.trainer.name,
              username: trainerObj.username || MOCK_CLIENT.trainer.username,
            };
          }
        }

        const formattedUpcoming = apptsData ? apptsData.map((apt: any) => {
          const aptTrainer = apt.trainer as any;
          const tProfile = Array.isArray(aptTrainer)
            ? (Array.isArray(aptTrainer[0]?.profile) ? aptTrainer[0].profile[0] : aptTrainer[0]?.profile)
            : (Array.isArray(aptTrainer?.profile) ? aptTrainer.profile[0] : aptTrainer?.profile);
          return {
            id: apt.id,
            date: apt.date,
            time: apt.time,
            status: apt.status,
            trainerName: tProfile?.name || 'Personal',
          };
        }) : [];

        const studentProfile = studentData.profile as any;

        setClient({
          name: studentProfile?.name || MOCK_CLIENT.name,
          avatar: studentProfile?.avatar_url || MOCK_CLIENT.avatar,
          streak: studentData.streak ?? 0,
          workoutsCompleted: studentData.workouts_completed ?? 0,
          trainer: trainerInfo,
          upcomingClasses: formattedUpcoming,
          workouts: workoutsData && workoutsData.length > 0 ? workoutsData : MOCK_CLIENT.workouts,
        });

      } catch (err) {
        console.error('Error loading client dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const { upcomingClasses, trainer, streak, workoutsCompleted, workouts } = client;
  const nextClass = upcomingClasses[0];

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
            onPress={() => Alert.alert('Notificações', 'Sem novas notificações.')}
          >
            <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-lime-400" />
            <Calendar size={18} color="#71717a" />
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
          {nextClass ? (
            <Card className="bg-gradient-to-br from-lime-400 to-emerald-500 p-6 relative overflow-hidden">
              <View className="flex-row items-center justify-between z-10">
                <View className="flex-1 pr-2">
                  <Text className="text-zinc-900 font-semibold mb-1">
                    {nextClass.date} às {nextClass.time}
                  </Text>
                  <Text className="text-2xl font-bold text-zinc-950 tracking-tight" numberOfLines={1}>
                    Com {nextClass.trainerName}
                  </Text>
                </View>
                <View className="w-12 h-12 rounded-full bg-zinc-950 items-center justify-center">
                  <Calendar size={22} color="#a3e635" />
                </View>
              </View>

              <View className="mt-6 flex-row gap-3 z-10">
                <Pressable
                  onPress={() => onNavigate('ClientBooking', { username: trainer.username })}
                  className="flex-1 py-3.5 rounded-xl bg-zinc-950 items-center justify-center"
                >
                  <Text className="text-white font-bold text-sm">Reagendar</Text>
                </Pressable>
              </View>
            </Card>
          ) : (
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
        </View>
      </View>
    </ScrollView>
  );
}