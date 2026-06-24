import React from 'react';
import {
  Pressable,
  Text,
  View,
} from 'react-native';
import { Card } from '../../components/common/UI';
import {
  CheckCircle2,
  Dumbbell,
  Flame,
  Award,
} from 'lucide-react-native';

type ClientWorkoutSuccessPageProps = {
  onFinish: () => void;
};

export default function ClientWorkoutSuccessPage({ onFinish }: ClientWorkoutSuccessPageProps) {
  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center p-6">
      <View className="w-full max-w-sm gap-8 items-center">
        {/* Animated Check Bubble */}
        <View className="w-24 h-24 rounded-full bg-lime-400/20 items-center justify-center relative">
          <View className="absolute inset-0 rounded-full border-2 border-lime-400 border-dashed" />
          <Dumbbell size={48} color="#a3e635" />
        </View>

        {/* Text Headers */}
        <View className="items-center gap-1">
          <Text className="text-3xl font-bold text-zinc-100">Treino Concluído!</Text>
          <Text className="text-zinc-400 text-sm text-center">Mandou muito bem, continue no foco.</Text>
        </View>

        {/* Info Card */}
        <Card className="w-full gap-4 p-5 bg-zinc-900 border-zinc-800">
          <View className="gap-3">
            <View className="flex-row items-center gap-3">
              <CheckCircle2 size={18} color="#a3e635" />
              <Text className="text-sm font-semibold text-zinc-200">Todos os exercícios concluídos</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Flame size={18} color="#f97316" />
              <Text className="text-sm font-semibold text-zinc-200">Mais um passo para o seu objetivo</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Award size={18} color="#eab308" />
              <Text className="text-sm font-semibold text-zinc-200">Dedicação registrada</Text>
            </View>
          </View>
        </Card>

        {/* Footer Subtitle */}
        <Text className="text-xs text-zinc-500 text-center leading-relaxed px-4">
          Seu personal foi notificado sobre a conclusão do seu treino.
        </Text>

        {/* Back Button */}
        <Pressable
          onPress={onFinish}
          className="w-full h-14 rounded-2xl bg-lime-400 items-center justify-center active:scale-95 mt-4 shadow-[0_0_20px_rgba(163,230,53,0.3)]"
        >
          <Text className="text-zinc-950 font-bold text-sm">Voltar aos Treinos</Text>
        </Pressable>
      </View>
    </View>
  );
}
