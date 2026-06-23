import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Card, Input } from '../components/native/UI';
import { GlowingButton } from '../components/native/AuthUI';
import { MOCK_STUDENTS } from '../mockData';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react-native';

const WORKOUT_TEMPLATES = [
  { id: 't1', name: 'Treino A - Peito e Tríceps', type: 'Hipertrofia', duration: '45 min', color: 'bg-blue-500/10 text-blue-400' },
  { id: 't2', name: 'Treino B - Costas e Bíceps', type: 'Hipertrofia', duration: '50 min', color: 'bg-indigo-500/10 text-indigo-400' },
  { id: 't3', name: 'Treino C - Pernas Completo', type: 'Hipertrofia', duration: '60 min', color: 'bg-orange-500/10 text-orange-400' },
  { id: 't4', name: 'HIIT - Queima Total', type: 'Emagrecimento', duration: '30 min', color: 'bg-red-500/10 text-red-400' },
  { id: 't5', name: 'Full Body Funcional', type: 'Condicionamento', duration: '40 min', color: 'bg-teal-500/10 text-teal-400' }
];

type TrainerAssignWorkoutProps = {
  studentId?: string;
  onFinish: () => void;
  onGoBack: () => void;
};

export default function TrainerAssignWorkout({ studentId, onFinish, onGoBack }: TrainerAssignWorkoutProps) {
  const [step, setStep] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<typeof MOCK_STUDENTS[0] | null>(
    MOCK_STUDENTS.find(s => s.id === studentId) || null
  );
  const [selectedDate, setSelectedDate] = useState('Amanhã, 18:00');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof WORKOUT_TEMPLATES[0] | null>(null);

  const handleFinish = () => {
    if (!selectedStudent || !selectedTemplate) return;

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
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onGoBack();
    }
  };

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
              {MOCK_STUDENTS.map(student => {
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
                      <Text className="text-sm text-zinc-550 mt-0.5">{student.objective}</Text>
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

                <View className="flex-row items-start gap-3">
                  <Calendar size={20} color="#71717a" style={{ marginTop: 2 }} />
                  <View className="flex-1">
                    <Text className="text-xs text-zinc-500 font-medium mb-1">Data da Próxima Aula</Text>
                    <Input
                      value={selectedDate}
                      onChangeText={setSelectedDate}
                      className="bg-zinc-950/50 border-zinc-800"
                    />
                  </View>
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
