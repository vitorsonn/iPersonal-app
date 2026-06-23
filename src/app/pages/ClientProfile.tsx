import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { MOCK_CLIENT } from '../mockData';
import { Avatar, Card, Input, Label } from '../components/native/UI';
import { GlowingButton } from '../components/native/AuthUI';
import { HeartPulse, LogOut, Ruler, Settings } from 'lucide-react-native';

type ClientProfileProps = {
  onLogout: () => void;
};

export default function ClientProfile({ onLogout }: ClientProfileProps) {
  const [name, setName] = useState(MOCK_CLIENT.name);
  const [objective, setObjective] = useState(MOCK_CLIENT.objective);

  const handleSave = () => {
    Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
  };

  const handleObjectivePress = () => {
    Alert.alert(
      'Selecionar Objetivo',
      'Escolha seu objetivo principal:',
      [
        { text: 'Emagrecimento', onPress: () => setObjective('Emagrecimento') },
        { text: 'Hipertrofia', onPress: () => setObjective('Hipertrofia') },
        { text: 'Condicionamento Físico', onPress: () => setObjective('Condicionamento Físico') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-zinc-950"
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="p-6 gap-6">
        {/* Header */}
        <View className="pt-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-zinc-100">Perfil</Text>
          <Pressable
            onPress={() => Alert.alert('Configurações', 'Menu de configurações ainda não conectado.')}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center active:scale-95"
          >
            <Settings size={20} color="#71717a" />
          </Pressable>
        </View>

        {/* Profile Details */}
        <View className="items-center gap-4">
          <View className="relative">
            <Avatar src={MOCK_CLIENT.avatar} size="xl" className="ring-4 ring-zinc-950 shadow-xl" />
            <Pressable
              onPress={() => Alert.alert('Foto de Perfil', 'Câmera ainda não conectada.')}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-lime-400 items-center justify-center border-2 border-zinc-950 active:scale-95"
            >
              <Settings size={14} color="#09090b" />
            </Pressable>
          </View>
          <View className="items-center">
            <Text className="text-xl font-bold text-zinc-100">{MOCK_CLIENT.name}</Text>
            <Text className="text-lime-400 font-semibold text-sm mt-1">Aluno Ativo</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-4">
          <Card className="flex-1 p-4 flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-850 items-center justify-center">
              <Ruler size={20} color="#71717a" />
            </View>
            <View>
              <Text className="text-xs text-zinc-400 font-medium">Peso</Text>
              <Text className="font-bold text-zinc-100 mt-0.5">68 kg</Text>
            </View>
          </Card>
          <Card className="flex-1 p-4 flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-850 items-center justify-center">
              <HeartPulse size={20} color="#71717a" />
            </View>
            <View>
              <Text className="text-xs text-zinc-400 font-medium">Altura</Text>
              <Text className="font-bold text-zinc-100 mt-0.5">1.65 m</Text>
            </View>
          </Card>
        </View>

        {/* Form Fields */}
        <View className="gap-4">
          <Text className="font-bold text-lg text-zinc-100">Informações Pessoais</Text>
          <Card className="p-5 gap-4">
            <View className="gap-2">
              <Label>Nome Completo</Label>
              <Input value={name} onChangeText={setName} />
            </View>

            <View className="gap-2">
              <Label>Objetivo Principal</Label>
              <Pressable
                onPress={handleObjectivePress}
                className="h-14 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 justify-center"
              >
                <Text className="text-zinc-100 text-sm">{objective}</Text>
              </Pressable>
            </View>

            <GlowingButton className="mt-2" onPress={handleSave}>
              <Text className="text-zinc-950 font-bold">Salvar Alterações</Text>
            </GlowingButton>
          </Card>
        </View>

        {/* Logout area */}
        <View className="pt-2">
          <Pressable
            onPress={onLogout}
            className="flex-row items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-zinc-900 border border-zinc-850 active:bg-red-500/10 active:border-red-500/20"
          >
            <LogOut size={18} color="#ef4444" />
            <Text className="text-red-500 font-bold text-sm">Sair do Aplicativo</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}