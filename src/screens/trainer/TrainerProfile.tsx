import React, { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { Avatar, Card, Input, Label } from '../../components/common/UI';
import { GlowingButton } from '../../components/auth/AuthUI';
import { MOCK_TRAINER } from '../../data/mockData';
import { Camera, LogOut, Save } from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '../../services/supabase';

type TrainerProfileProps = {
  onLogout: () => void;
};

export default function TrainerProfile({ onLogout }: TrainerProfileProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(MOCK_TRAINER.name);
  const [username, setUsername] = useState(MOCK_TRAINER.username);
  const [bio, setBio] = useState(MOCK_TRAINER.bio);
  const [specialties, setSpecialties] = useState(MOCK_TRAINER.specialties.join(', '));
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!isSupabaseConfigured()) {
        setAvatar(MOCK_TRAINER.avatar);
        return;
      }

      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch profile details
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileErr) throw profileErr;

        // 2. Fetch trainer details
        const { data: trainerData, error: trainerErr } = await supabase
          .from('trainers')
          .select('username, bio, specialties')
          .eq('profile_id', user.id)
          .single();

        if (profileData) {
          setName(profileData.name || '');
          setAvatar(profileData.avatar_url || null);
        }

        if (trainerData) {
          setUsername(trainerData.username || '');
          setBio(trainerData.bio || '');
          if (trainerData.specialties) {
            setSpecialties(Array.isArray(trainerData.specialties) ? trainerData.specialties.join(', ') : trainerData.specialties);
          }
        }
      } catch (err) {
        console.error('Error loading trainer profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!isSupabaseConfigured()) {
      Alert.alert('Sucesso', 'Alterações salvas com sucesso!');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erro', 'Não foi possível encontrar o usuário autenticado.');
        return;
      }

      // 1. Update profiles table
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ name: name })
        .eq('id', user.id);

      if (profileErr) throw profileErr;

      // Convert specialties from comma separated string to array
      const specialtiesArray = specialties.split(',').map(s => s.trim()).filter(Boolean);

      // 2. Update trainers table
      const { error: trainerErr } = await supabase
        .from('trainers')
        .update({
          username: username.toLowerCase().replace(/[^a-z0-9-_]/g, ''),
          bio: bio,
          specialties: specialtiesArray,
        })
        .eq('profile_id', user.id);

      if (trainerErr) throw trainerErr;

      Alert.alert('Sucesso', 'Alterações salvas com sucesso!');
    } catch (err: any) {
      console.error('Error saving trainer profile:', err);
      Alert.alert('Erro', 'Não foi possível salvar as alterações: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraPress = () => {
    Alert.alert('Foto de Perfil', 'Funcionalidade de câmera ainda não conectada.');
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
            <Avatar src={avatar} name={name} size="xl" className="ring-4 ring-zinc-900" />
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
            className="flex-row items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 active:bg-red-500/10 active:border-red-500/20"
          >
            <LogOut size={18} color="#ef4444" />
            <Text className="text-red-500 font-bold text-sm">Sair do Perfil</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
