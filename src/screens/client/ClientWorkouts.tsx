import React, { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';

import { Card } from '../../components/common/UI';
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Play,
  Dumbbell,
} from 'lucide-react-native';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';

type ClientWorkoutsProps = {
  onNavigate: (screen: 'ClientBooking' | 'ClientSuccess' | 'ClientWorkouts' | 'ClientWorkoutSuccess', params?: any) => void;
};

export default function ClientWorkouts({ onNavigate }: ClientWorkoutsProps) {
  const { user, loading: authLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(false);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [objective, setObjective] = useState<string>('');
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) return;
    
    async function loadWorkouts() {
      try {
        setDataLoading(true);

        // Fetch student objective
        const { data: studentData } = await supabase
          .from('students')
          .select('objective')
          .eq('profile_id', user.id)
          .single();

        if (studentData) {
          setObjective(studentData.objective || '');
        }

        // Fetch workouts with exercises
        const { data: workoutsData, error } = await supabase
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

        if (workoutsData) {
          // Sort exercises by sequence_order
          const formatted = workoutsData.map((w: any) => ({
            ...w,
            exercises: (w.exercises || []).sort((a: any, b: any) => (a.sequence_order || 0) - (b.sequence_order || 0))
          }));
          setWorkouts(formatted);
        }
      } catch (err) {

      } finally {
        setDataLoading(false);
      }
    }

    loadWorkouts();

    let activeChannel: any = null;

    async function setupRealtime() {
      activeChannel = supabase
        .channel(`client-workouts-${user!.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts', filter: `student_id=eq.${user!.id}` }, () => {
          loadWorkouts();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'exercises' }, () => {
          loadWorkouts();
        })
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, [user]);

  const handleStart = (id: string) => {
    setActiveWorkout(id);
    setCompletedExercises(new Set());
  };

  const toggleExercise = (index: number) => {
    const newSet = new Set(completedExercises);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setCompletedExercises(newSet);
  };

  const handleFinishWorkout = () => {
    setActiveWorkout(null);
    onNavigate('ClientWorkoutSuccess');
  };

  if (activeWorkout) {
    const workout = workouts.find(w => w.id === activeWorkout);
    if (!workout) return null;
    const numExercises = workout.exercises ? workout.exercises.length : 0;
    const progress = numExercises > 0 ? (completedExercises.size / numExercises) * 100 : 0;

    return (
      <View className="flex-1 bg-zinc-950">
        {/* Header */}
        <View className="px-6 pt-12 pb-4 flex-row items-center gap-4 border-b border-zinc-900 bg-zinc-950/80">
          <Pressable
            onPress={() => setActiveWorkout(null)}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center"
          >
            <ChevronLeft size={20} color="#71717a" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-zinc-100" numberOfLines={1}>
              {workout.title}
            </Text>
            <Text className="text-sm text-lime-400 font-semibold mt-0.5">Em andamento</Text>
          </View>
        </View>

        {/* Scrollable Exercises */}
        <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="gap-6">
            {/* Progress Bar */}
            <View className="gap-2">
              <View className="flex-row justify-between text-sm">
                <Text className="text-zinc-400">Progresso</Text>
                <Text className="font-bold text-lime-400">{Math.round(progress)}%</Text>
              </View>
              <View className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                <View
                  className="h-full bg-lime-400 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </View>

            {/* Exercises Cards */}
            <View className="gap-3">
              {workout.exercises.map((exercise, index) => {
                const isDone = completedExercises.has(index);
                return (
                  <Pressable
                    key={index}
                    onPress={() => toggleExercise(index)}
                  >
                    <Card
                      className={`p-4 flex-row items-center gap-4 border ${
                        isDone ? 'border-lime-500/50 bg-lime-400/5' : 'border-zinc-800'
                      }`}
                    >
                      <View
                        className={`w-12 h-12 rounded-xl items-center justify-center border ${
                          isDone
                            ? 'bg-lime-400 border-lime-400'
                            : 'bg-zinc-950 border-zinc-800'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 size={24} color="#09090b" />
                        ) : (
                          <Text className="font-bold text-zinc-500">{index + 1}</Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className={`font-bold text-base ${isDone ? 'text-lime-400' : 'text-zinc-200'}`}>
                          {exercise.name}
                        </Text>
                        <Text className="text-sm text-zinc-500 mt-0.5">
                          {exercise.sets} séries • {exercise.reps} reps
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Floating Complete Button */}
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pb-8">
          <Pressable
            disabled={numExercises === 0 || completedExercises.size !== numExercises}
            onPress={handleFinishWorkout}
            className={`w-full h-14 rounded-2xl items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.3)] ${
              (numExercises === 0 || completedExercises.size !== numExercises) ? 'bg-zinc-800 opacity-55' : 'bg-lime-400'
            }`}
          >
            <Text className={`text-center font-bold text-base ${(numExercises === 0 || completedExercises.size !== numExercises) ? 'text-zinc-500' : 'text-zinc-950'}`}>
              Finalizar Treino
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="p-6 gap-6">
        {/* Header */}
        <View className="pt-4 gap-1">
          <Text className="text-2xl font-bold text-zinc-100">Seu Plano</Text>
          <View className="flex-row items-center gap-1 mt-0.5">
            <Text className="text-zinc-400 text-sm">Focado em </Text>
            <Text className="text-lime-400 font-semibold text-sm">{objective || 'Condicionamento'}</Text>
          </View>
        </View>

        {/* Workouts Plan List */}
        <View className="gap-6">
          {workouts.length > 0 ? (
            workouts.map((workout) => (
              <View key={workout.id} className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-zinc-100">{workout.title}</Text>
                  <View className="flex-row items-center gap-1.5 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                    <Clock size={12} color="#71717a" />
                    <Text className="text-xs font-semibold text-zinc-500">{workout.duration}</Text>
                  </View>
                </View>

                <Card className="p-0 overflow-hidden border-zinc-800">
                  <View className="divide-y divide-zinc-800">
                    {(workout.exercises || []).map((exercise: any, index: number) => (
                      <View key={index} className="p-4 flex-row items-center gap-4">
                        <View className="w-10 h-10 rounded-xl bg-zinc-950 items-center justify-center border border-zinc-800">
                          <Text className="font-bold text-zinc-500 text-sm">{index + 1}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-semibold text-zinc-200">{exercise.name}</Text>
                          <Text className="text-sm text-zinc-500 mt-0.5">
                            {exercise.sets} séries • {exercise.reps} reps
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                  <View className="p-4 bg-zinc-900/40 border-t border-zinc-800 flex-row justify-end">
                    <Pressable
                      onPress={() => handleStart(workout.id)}
                      className="flex-row items-center gap-2 active:scale-95"
                    >
                      <Play size={16} color="#a3e635" />
                      <Text className="font-semibold text-lime-400 text-sm">Iniciar Treino</Text>
                    </Pressable>
                  </View>
                </Card>
              </View>
            ))
          ) : (
            <Card className="p-6 items-center gap-4 border-dashed border-zinc-700">
              <View className="w-12 h-12 rounded-full bg-zinc-900/60 items-center justify-center border border-zinc-800">
                <Dumbbell size={22} color="#71717a" />
              </View>
              <View className="items-center">
                <Text className="font-semibold text-zinc-300">Nenhum treino montado</Text>
                <Text className="text-sm text-zinc-500 mt-1 text-center">
                  Seu personal ainda não montou uma rotina de treinos para você.
                </Text>
              </View>
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
  );
}