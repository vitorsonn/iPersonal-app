import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Avatar, Card, Input, Label } from '../components/native/UI';
import { GlowingButton } from '../components/native/AuthUI';
import { MOCK_TRAINER } from '../mockData';
import { Camera, LogOut, Save } from 'lucide-react-native';

type TrainerProfileProps = {
  onLogout: () => void;
};

export default function TrainerProfile({ onLogout }: TrainerProfileProps) {
  const [name, setName] = useState(MOCK_TRAINER.name);
  const [username, setUsername] = useState(MOCK_TRAINER.username);
  const [bio, setBio] = useState(MOCK_TRAINER.bio);
  const [specialties, setSpecialties] = useState(MOCK_TRAINER.specialties.join(', '));

  const handleSave = () => {
    Alert.alert('Sucesso', 'Alterações salvas com sucesso!');
  };

  const handleCameraPress = () => {
    Alert.alert('Foto de Perfil', 'Funcionalidade de câmera ainda não conectada.');
  };

  return (
    <ScrollView
      className="flex-1 bg-zinc-950"
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="p-6 gap-6">
        {/* Header */}
        <View className="pt-4">
          <Text className="text-2xl font-bold text-zinc-100">Meu Perfil</Text>
        </View>

        {/* Avatar Profile */}
        <View className="items-center justify-center py-2">
          <View className="relative">
            <Avatar src={MOCK_TRAINER.avatar} size="xl" className="ring-4 ring-zinc-900" />
            <Pressable
              onPress={handleCameraPress}
              className="absolute bottom-0 right-0 w-8 h-8 bg-lime-400 rounded-full items-center justify-center border-2 border-zinc-950 active:scale-95"
            >
              <Camera size={14} color="#09090b" />
            </Pressable>
          </View>
        </View>

        {/* Form Fields */}
        <View className="gap-5">
          <Text className="text-lg font-semibold text-lime-400">Dados Básicos</Text>

          <View className="gap-2">
            <Label>Nome de Exibição</Label>
            <Input value={name} onChangeText={setName} />
          </View>

          <View className="gap-2">
            <Label>Link Personalizado (@usuario)</Label>
            <View className="flex-row">
              <View className="h-14 items-center justify-center px-4 rounded-l-2xl border border-zinc-800 bg-zinc-900 border-r-0">
                <Text className="text-zinc-500 text-sm">ipersonal.app/</Text>
              </View>
              <Input
                className="flex-1 rounded-l-none"
                value={username}
                onChangeText={setUsername}
              />
            </View>
          </View>

          <View className="gap-2">
            <Label>Bio Curta</Label>
            <TextInput
              multiline
              numberOfLines={4}
              value={bio}
              onChangeText={setBio}
              placeholderTextColor="#71717a"
              selectionColor="#a3e635"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 min-h-[100] text-left"
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          <Text className="text-lg font-semibold text-lime-400 mt-2">Especialidades</Text>

          <View className="gap-2">
            <Label>Especialidades</Label>
            <Input
              value={specialties}
              onChangeText={setSpecialties}
              placeholder="Separadas por vírgula"
            />
          </View>

          {/* Save Button */}
          <GlowingButton className="mt-4" onPress={handleSave}>
            <View className="flex-row items-center justify-center gap-2">
              <Save size={18} color="#09090b" />
              <Text className="text-zinc-950 font-bold">Salvar Alterações</Text>
            </View>
          </GlowingButton>
        </View>

        {/* Logout Area */}
        <View className="pt-2">
          <Pressable
            onPress={onLogout}
            className="flex-row items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-zinc-900 border border-zinc-850 active:bg-red-500/10 active:border-red-500/20"
          >
            <LogOut size={18} color="#ef4444" />
            <Text className="text-red-500 font-bold text-sm">Sair do Perfil</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
