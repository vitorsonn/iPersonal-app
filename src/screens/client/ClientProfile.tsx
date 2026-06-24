import React, { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { MOCK_CLIENT } from '../../data/mockData';
import { Avatar, Card, Input, Label } from '../../components/common/UI';
import { GlowingButton } from '../../components/auth/AuthUI';
import { HeartPulse, LogOut, Ruler, Settings } from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '../../services/supabase';

type ClientProfileProps = {
  onLogout: () => void;
};

export default function ClientProfile({ onLogout }: ClientProfileProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!isSupabaseConfigured()) {
        setName(MOCK_CLIENT.name);
        setObjective(MOCK_CLIENT.objective);
        setAvatar(MOCK_CLIENT.avatar);
        setWeight('68');
        setHeight('1.65');
        return;
      }
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single();

        const { data: studentData } = await supabase
          .from('students')
          .select('objective, weight, height')
          .eq('profile_id', user.id)
          .single();

        if (profileData) {
          setName(profileData.name || '');
          setAvatar(profileData.avatar_url || null);
        }
        if (studentData) {
          setObjective(studentData.objective || '');
          setWeight(studentData.weight ? String(studentData.weight) : '');
          setHeight(studentData.height ? String(studentData.height) : '');
        }
      } catch (err) {
        console.error('Error loading client profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome não pode estar em branco.');
      return;
    }

    if (!isSupabaseConfigured()) {
      Alert.alert('Sucesso (Modo Demo)', 'Perfil atualizado com sucesso!');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user.id);

      const parsedWeight = weight.trim() ? parseFloat(weight.replace(',', '.')) : null;
      const parsedHeight = height.trim() ? parseFloat(height.replace(',', '.')) : null;

      const { error: studentErr } = await supabase
        .from('students')
        .update({
          objective,
          weight: parsedWeight,
          height: parsedHeight,
        })
        .eq('profile_id', user.id);

      if (profileErr || studentErr) {
        throw new Error('Falha ao atualizar dados.');
      }

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (err: any) {
      Alert.alert('Erro ao Salvar', err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
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
            <Avatar src={avatar} name={name} size="xl" className="ring-4 ring-zinc-950 shadow-xl" />
            <Pressable
              onPress={() => Alert.alert('Foto de Perfil', 'Câmera ainda não conectada.')}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-lime-400 items-center justify-center border-2 border-zinc-950 active:scale-95"
            >
              <Settings size={14} color="#09090b" />
            </Pressable>
          </View>
          <View className="items-center">
            <Text className="text-xl font-bold text-zinc-100">{name || 'Aluno'}</Text>
            <Text className="text-lime-400 font-semibold text-sm mt-1">Aluno Ativo</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-4">
          <Card className="flex-1 p-4 flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 items-center justify-center">
              <Ruler size={20} color="#71717a" />
            </View>
            <View>
              <Text className="text-xs text-zinc-400 font-medium">Peso</Text>
              <Text className="font-bold text-zinc-100 mt-0.5">{weight ? `${weight} kg` : '--'}</Text>
            </View>
          </Card>
          <Card className="flex-1 p-4 flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 items-center justify-center">
              <HeartPulse size={20} color="#71717a" />
            </View>
            <View>
              <Text className="text-xs text-zinc-400 font-medium">Altura</Text>
              <Text className="font-bold text-zinc-100 mt-0.5">{height ? `${height} m` : '--'}</Text>
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

            <View className="flex-row gap-4">
              <View className="flex-1 gap-2">
                <Label>Peso (kg)</Label>
                <Input
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="Ex: 70"
                />
              </View>

              <View className="flex-1 gap-2">
                <Label>Altura (m)</Label>
                <Input
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="Ex: 1.75"
                />
              </View>
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
            className="flex-row items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 active:bg-red-500/10 active:border-red-500/20"
          >
            <LogOut size={18} color="#ef4444" />
            <Text className="text-red-500 font-bold text-sm">Sair do Aplicativo</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}