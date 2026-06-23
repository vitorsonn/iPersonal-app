import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
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

type ClientDashboardProps = {
  onNavigate: (screen: 'ClientBooking' | 'ClientSuccess' | 'ClientWorkouts', params?: any) => void;
};

export default function ClientDashboard({ onNavigate }: ClientDashboardProps) {
  const { upcomingClasses, trainer, stats } = MOCK_CLIENT;
  const nextClass = upcomingClasses[0];

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
            <Avatar src={MOCK_CLIENT.avatar} size="md" alt={MOCK_CLIENT.name} />
            <View>
              <Text className="text-zinc-400 text-sm">Pronta pro treino,</Text>
              <Text className="text-xl font-bold text-zinc-100">{MOCK_CLIENT.name.split(' ')[0]}?</Text>
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
              <Text className="text-xl font-bold text-zinc-100">{stats.streak}</Text>
              <Text className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">Dias seguidos</Text>
            </View>
          </Card>
          <Card className="flex-1 p-4 flex-row items-center gap-3 bg-zinc-900/50 border-zinc-800/50">
            <View className="w-10 h-10 rounded-xl bg-lime-400/10 items-center justify-center">
              <Target size={20} color="#a3e635" />
            </View>
            <View>
              <Text className="text-xl font-bold text-zinc-100">{stats.workoutsCompleted}</Text>
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
                <Text className="font-bold text-zinc-100 text-base">{MOCK_CLIENT.workouts[0].title}</Text>
                <Text className="text-sm text-zinc-400 mt-1">
                  {MOCK_CLIENT.workouts[0].exercises.length} exercícios • {MOCK_CLIENT.workouts[0].duration}
                </Text>
              </View>
            </Card>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}