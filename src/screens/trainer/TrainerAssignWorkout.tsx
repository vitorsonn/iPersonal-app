import React, { useState, useEffect, useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { Card } from '../../components/common/UI';
import { GlowingButton } from '../../components/auth/AuthUI';

import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';

const WORKOUT_TEMPLATES = [
  { id: 't1', name: 'Treino A - Peito e Tríceps', type: 'Hipertrofia', duration: '45 min', color: 'bg-blue-500/10 text-blue-400' },
  { id: 't2', name: 'Treino B - Costas e Bíceps', type: 'Hipertrofia', duration: '50 min', color: 'bg-indigo-500/10 text-indigo-400' },
  { id: 't3', name: 'Treino C - Pernas Completo', type: 'Hipertrofia', duration: '60 min', color: 'bg-orange-500/10 text-orange-400' },
  { id: 't4', name: 'HIIT - Queima Total', type: 'Emagrecimento', duration: '30 min', color: 'bg-red-500/10 text-red-400' },
  { id: 't5', name: 'Full Body Funcional', type: 'Condicionamento', duration: '40 min', color: 'bg-teal-500/10 text-teal-400' }
];

const getExercisesForTemplate = (templateId: string) => {
  switch (templateId) {
    case 't1':
      return [
        { name: 'Supino Reto', sets: 4, reps: '10-12' },
        { name: 'Fly Inclinado', sets: 3, reps: '12' },
        { name: 'Tríceps Corda', sets: 3, reps: '15' }
      ];
    case 't2':
      return [
        { name: 'Puxada Alta', sets: 4, reps: '10-12' },
        { name: 'Remada Baixa', sets: 3, reps: '12' },
        { name: 'Rosca Direta', sets: 3, reps: '12' }
      ];
    case 't3':
      return [
        { name: 'Agachamento Livre', sets: 4, reps: '10' },
        { name: 'Leg Press 45', sets: 3, reps: '12' },
        { name: 'Cadeira Flexora', sets: 3, reps: '15' }
      ];
    case 't4':
      return [
        { name: 'Polichinelo', sets: 4, reps: '45s' },
        { name: 'Burpees', sets: 4, reps: '30s' },
        { name: 'Corrida no Lugar', sets: 4, reps: '1m' }
      ];
    case 't5':
      return [
        { name: 'Flexão de Braço', sets: 3, reps: '15' },
        { name: 'Avanço/Passada', sets: 3, reps: '12' },
        { name: 'Prancha Abdominal', sets: 3, reps: '1m' }
      ];
    default:
      return [
        { name: 'Exercício Padrão', sets: 3, reps: '10' }
      ];
  }
};

type TrainerAssignWorkoutProps = {
  studentId?: string;
  onFinish: () => void;
  onGoBack: () => void;
};

export default function TrainerAssignWorkout({ studentId, onFinish, onGoBack }: TrainerAssignWorkoutProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof WORKOUT_TEMPLATES[0] | null>(null);

  // Custom Inline Date & Time Picker states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedClassDate, setSelectedClassDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [selectedClassTime, setSelectedClassTime] = useState('18:00');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const TIME_OPTIONS = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00'
  ];

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [currentMonth]);

  const formatDisplayDate = (date: Date, time: string) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year} às ${time}`;
  };

  useEffect(() => {
    async function loadStudents() {


      try {
        setLoading(true);
        if (!user) return;

        const { data, error } = await supabase
          .from('students')
          .select(`
            profile_id,
            objective,
            streak,
            profile:profiles!students_profile_id_fkey (
              name,
              email
            )
          `)
          .eq('trainer_id', user.id);

        if (error) throw error;

        if (data) {
          const formatted = data.map((s: any) => {
            const profile = s.profile;
            const nameParts = (profile?.name || 'Aluno').split(' ');
            const initials = nameParts.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
            return {
              id: s.profile_id,
              name: profile?.name || 'Aluno',
              email: profile?.email || '',
              objective: s.objective || 'Treino',
              streak: s.streak || 0,
              initials,
            };
          });
          setStudentsList(formatted);
          const initialStudent = formatted.find(s => s.id === studentId);
          if (initialStudent) {
            setSelectedStudent(initialStudent);
          }
        }
      } catch (err) {

      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadStudents();
    }
  }, [studentId, user]);

  const handleFinish = async () => {
    if (!selectedStudent || !selectedTemplate) return;



    try {
      setLoading(true);
      if (!user) {
        Alert.alert('Erro', 'Não foi possível encontrar o usuário autenticado.');
        return;
      }

      // 1. Insert workout
      const { data: workoutData, error: wError } = await supabase
        .from('workouts')
        .insert({
          student_id: selectedStudent.id,
          trainer_id: user.id,
          title: selectedTemplate.name,
          duration: selectedTemplate.duration,
          level: 'Intermediário',
        })
        .select()
        .single();

      if (wError) throw wError;

      // 2. Insert exercises
      const exercisesList = getExercisesForTemplate(selectedTemplate.id);
      const exercisesToInsert = exercisesList.map((ex, index) => ({
        workout_id: workoutData.id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        sequence_order: index + 1,
      }));

      const { error: exError } = await supabase
        .from('exercises')
        .insert(exercisesToInsert);

      if (exError) throw exError;

      // 3. Insert appointment
      const dateStr = `${selectedClassDate.getFullYear()}-${String(selectedClassDate.getMonth() + 1).padStart(2, '0')}-${String(selectedClassDate.getDate()).padStart(2, '0')}`;
      const timeStr = selectedClassTime;

      const { error: aptError } = await supabase
        .from('appointments')
        .insert({
          trainer_id: user.id,
          student_id: selectedStudent.id,
          date: dateStr,
          time: timeStr,
          status: 'scheduled',
        });

      if (aptError) {
        Alert.alert('Erro', 'Não foi possível agendar o treino.');
        return;
      }

      Alert.alert(
        'Treino Atribuído! 🎉',
        `Treino "${selectedTemplate.name}" atribuído com sucesso para ${selectedStudent.name}!`,
        [
          {
            text: 'Ok',
            onPress: onFinish,
          },
        ]
      );
    } catch (err: any) {

      Alert.alert('Erro', 'Houve um erro ao atribuir o treino: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onGoBack();
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#a3e635" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Header */}
      <View className="px-6 pt-12 pb-4 flex-row items-center gap-4 border-b border-zinc-900 bg-zinc-950/80">
        <Pressable
          onPress={handleBack}
          className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center"
        >
          <ChevronLeft size={20} color="#71717a" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-zinc-100">Montar Treino</Text>
          <View className="flex-row gap-1.5 mt-2">
            <View className={`h-1 w-8 rounded-full ${step >= 1 ? 'bg-lime-400' : 'bg-zinc-800'}`} />
            <View className={`h-1 w-8 rounded-full ${step >= 2 ? 'bg-lime-400' : 'bg-zinc-800'}`} />
            <View className={`h-1 w-8 rounded-full ${step >= 3 ? 'bg-lime-400' : 'bg-zinc-800'}`} />
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 120 }}>
        {step === 1 && (
          <View className="gap-6">
            <View>
              <Text className="text-2xl font-bold text-zinc-100">Para quem é o treino?</Text>
              <Text className="text-zinc-400 text-sm mt-1">Selecione o aluno que irá realizar o treino.</Text>
            </View>

            <View className="gap-3">
              {studentsList.map(student => {
                const isSelected = selectedStudent?.id === student.id;
                return (
                  <Pressable
                    key={student.id}
                    onPress={() => {
                      setSelectedStudent(student);
                      setStep(2);
                    }}
                    className={`rounded-2xl p-4 flex-row items-center gap-4 border ${
                      isSelected
                        ? 'bg-lime-400/10 border-lime-400'
                        : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <View className="w-12 h-12 rounded-full bg-zinc-800 items-center justify-center">
                      <Text className="font-bold text-zinc-400 text-lg">{student.initials}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className={`font-bold text-base ${isSelected ? 'text-lime-400' : 'text-zinc-100'}`}>
                        {student.name}
                      </Text>
                      <Text className="text-sm text-zinc-500 mt-0.5">{student.objective}</Text>
                    </View>
                    {isSelected && (
                      <View className="w-6 h-6 rounded-full bg-lime-400 items-center justify-center">
                        <Check size={14} color="#09090b" strokeWidth={3} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 2 && (
          <View className="gap-6">
            <View>
              <Text className="text-2xl font-bold text-zinc-100">Escolha o Template</Text>
              <Text className="text-zinc-400 text-sm mt-1">Selecione uma ficha de treino predefinida.</Text>
            </View>

            <View className="gap-3">
              {WORKOUT_TEMPLATES.map(template => {
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <Pressable
                    key={template.id}
                    onPress={() => {
                      setSelectedTemplate(template);
                      setStep(3);
                    }}
                    className={`rounded-2xl p-4 border ${
                      isSelected
                        ? 'bg-lime-400/10 border-lime-400'
                        : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className={`font-bold text-base flex-1 pr-2 ${isSelected ? 'text-lime-400' : 'text-zinc-100'}`}>
                        {template.name}
                      </Text>
                      {isSelected && (
                        <View className="w-6 h-6 rounded-full bg-lime-400 items-center justify-center shrink-0">
                          <Check size={14} color="#09090b" strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View className={`px-2 py-0.5 rounded-md ${template.color}`}>
                        <Text className="text-xs font-semibold">{template.type}</Text>
                      </View>
                      <Text className="text-zinc-500 text-xs">
                        ⏱️ {template.duration}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 3 && (
          <View className="gap-6">
            <View>
              <Text className="text-2xl font-bold text-zinc-100">Resumo do Agendamento</Text>
              <Text className="text-zinc-400 text-sm mt-1">Confirme os dados para a próxima aula.</Text>
            </View>

            <Card className="p-0 overflow-hidden border border-lime-400/30">
              <View className="bg-lime-400/10 p-4 border-b border-lime-400/20 flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-full bg-lime-400 items-center justify-center">
                  <Text className="text-zinc-950 font-bold text-xl">{selectedStudent?.initials}</Text>
                </View>
                <View>
                  <Text className="text-xs text-lime-400 font-semibold">Aluno Selecionado</Text>
                  <Text className="font-bold text-lg text-zinc-100">{selectedStudent?.name}</Text>
                </View>
              </View>

              <View className="p-4 gap-4">
                <View className="flex-row items-start gap-3">
                  <Text className="text-lg mt-0.5">🏋️</Text>
                  <View>
                    <Text className="text-xs text-zinc-500 font-medium">Treino</Text>
                    <Text className="font-bold text-zinc-100 mt-0.5">{selectedTemplate?.name}</Text>
                    <Text className="text-sm text-zinc-400 mt-0.5">{selectedTemplate?.type} • {selectedTemplate?.duration}</Text>
                  </View>
                </View>

                <View className="gap-2">
                  <Text className="text-xs text-zinc-550 font-medium">Data da Próxima Aula</Text>
                  
                  {/* Selector Trigger Button */}
                  <Pressable
                    onPress={() => setShowDatePicker(!showDatePicker)}
                    className="flex-row items-center justify-between h-14 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 active:bg-zinc-900"
                  >
                    <View className="flex-row items-center gap-3">
                      <Calendar size={20} color="#a3e635" />
                      <Text className="text-sm font-semibold text-zinc-100">
                        {formatDisplayDate(selectedClassDate, selectedClassTime)}
                      </Text>
                    </View>
                    <Text className="text-xs text-lime-400 font-bold">
                      {showDatePicker ? 'Fechar' : 'Alterar'}
                    </Text>
                  </Pressable>

                  {/* Expandable Picker Body */}
                  {showDatePicker && (
                    <View className="mt-2 bg-zinc-950 border border-zinc-850 rounded-3xl p-4 gap-4">
                      {/* Month Swapper */}
                      <View className="flex-row justify-between items-center mb-1 px-2">
                        <Text className="text-zinc-100 font-bold text-base">
                          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </Text>
                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={handlePrevMonth}
                            className="p-2 rounded-lg bg-zinc-900 active:scale-95"
                          >
                            <ChevronLeft size={16} color="#e4e4e7" />
                          </Pressable>
                          <Pressable
                            onPress={handleNextMonth}
                            className="p-2 rounded-lg bg-zinc-900 active:scale-95"
                          >
                            <ChevronRight size={16} color="#e4e4e7" />
                          </Pressable>
                        </View>
                      </View>

                      {/* Weekday headers */}
                      <View className="flex-row">
                        {weekdays.map((wd, index) => (
                          <View key={index} className="flex-1 items-center py-1">
                            <Text className="text-[10px] font-semibold text-zinc-500">{wd}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Days grid */}
                      <View className="flex-row flex-wrap">
                        {calendarDays.map((day, idx) => {
                          if (day === null) {
                            return <View key={`empty-${idx}`} className="w-[14.28%] aspect-square" />;
                          }

                          const isSelected = isSameDay(day, selectedClassDate);
                          const isToday = isSameDay(day, new Date());

                          return (
                            <Pressable
                              key={day.toISOString()}
                              onPress={() => setSelectedClassDate(day)}
                              className="w-[14.28%] aspect-square items-center justify-center p-1"
                            >
                              <View
                                className={`w-9 h-9 items-center justify-center rounded-xl ${
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
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Horizontal Time Slots Selector */}
                      <View className="border-t border-zinc-800/80 pt-4 gap-2">
                        <Text className="text-xs text-zinc-500 font-semibold px-2">Selecione o Horário</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerClassName="px-2 py-1 gap-2"
                        >
                          {TIME_OPTIONS.map(time => {
                            const isTimeSelected = selectedClassTime === time;
                            return (
                              <Pressable
                                key={time}
                                onPress={() => setSelectedClassTime(time)}
                                className={`px-4 py-2.5 rounded-xl border ${
                                  isTimeSelected
                                    ? 'bg-lime-400 border-lime-400'
                                    : 'bg-zinc-900 border-zinc-800 active:bg-zinc-850'
                                }`}
                              >
                                <Text
                                  className={`text-sm font-bold ${
                                    isTimeSelected ? 'text-zinc-950' : 'text-zinc-300'
                                  }`}
                                >
                                  {time}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </Card>

            <Pressable
              onPress={() => Alert.alert('Observação', 'Campo de observações ainda não conectado.')}
              className="bg-zinc-900 rounded-2xl p-4 flex-row items-center justify-between border border-zinc-800"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center">
                  <Plus size={20} color="#71717a" />
                </View>
                <View>
                  <Text className="font-medium text-sm text-zinc-200">Adicionar observação</Text>
                  <Text className="text-xs text-zinc-500 mt-0.5">Opcional</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#71717a" />
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Area */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pb-8">
        {step < 3 ? (
          <GlowingButton
            disabled={step === 1 ? !selectedStudent : !selectedTemplate}
            onPress={() => setStep(step + 1)}
          >
            Continuar
          </GlowingButton>
        ) : (
          <GlowingButton
            onPress={handleFinish}
          >
            Confirmar Treino
          </GlowingButton>
        )}
      </View>
    </View>
  );
}
