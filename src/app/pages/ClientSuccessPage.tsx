import React from 'react';
import {
  Pressable,
  Text,
  View,
} from 'react-native';
import { Card } from '../components/native/UI';
import { MOCK_TRAINER } from '../mockData';
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
} from 'lucide-react-native';

type ClientSuccessPageProps = {
  username?: string;
  onFinish: () => void;
};

export default function ClientSuccessPage({ username, onFinish }: ClientSuccessPageProps) {
  const trainer = MOCK_TRAINER;

  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center p-6">
      <View className="w-full max-w-sm gap-8 items-center">
        {/* Animated Check Bubble */}
        <View className="w-24 h-24 rounded-full bg-lime-400/20 items-center justify-center relative">
          <View className="absolute inset-0 rounded-full border-2 border-lime-400 border-dashed" />
          <CheckCircle2 size={48} color="#a3e635" />
        </View>

        {/* Text Headers */}
        <View className="items-center gap-1">
          <Text className="text-3xl font-bold text-zinc-100">Tudo Certo!</Text>
          <Text className="text-zinc-400 text-sm text-center">Seu agendamento foi confirmado.</Text>
        </View>

        {/* Info Card */}
        <Card className="w-full gap-4">
          <View className="flex-row items-center gap-4 pb-4 border-b border-zinc-800">
            <View className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800">
              <AvatarImage src={trainer.avatar} />
            </View>
            <View>
              <Text className="font-bold text-base text-zinc-100">{trainer.name}</Text>
              <Text className="text-xs text-lime-400 font-semibold mt-0.5">Personal Trainer</Text>
            </View>
          </View>

          <View className="gap-3 pt-2">
            <View className="flex-row items-center gap-3">
              <Calendar size={16} color="#71717a" />
              <Text className="text-sm text-zinc-300">Segunda, 15 de Junho de 2026</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Clock size={16} color="#71717a" />
              <Text className="text-sm text-zinc-300">08:00 - 09:00</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <MapPin size={16} color="#71717a" />
              <Text className="text-sm text-zinc-300">Academia Smart (A Combinar)</Text>
            </View>
          </View>
        </Card>

        {/* Footer Subtitle */}
        <Text className="text-xs text-zinc-550 text-center leading-relaxed px-4">
          Enviamos os detalhes para o seu WhatsApp e E-mail.
        </Text>

        {/* Back Button */}
        <Pressable
          onPress={onFinish}
          className="w-full h-14 rounded-2xl bg-zinc-900 border border-zinc-800 items-center justify-center active:scale-95 mt-4"
        >
          <Text className="text-zinc-100 font-bold text-sm">Voltar ao Painel</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Simple internal helper to render image
import { Image } from 'react-native';
function AvatarImage({ src }: { src: string }) {
  return <Image source={{ uri: src }} className="w-full h-full" />;
}
