import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  AuthBrand,
  AuthContent,
  AuthField,
  AuthRole,
  GlowingButton,
  RoleTabs,
  TextLink,
} from '../../components/auth/AuthUI';

type LoginProps = {
  onForgotPassword?: () => void;
  onLogin?: (email: string, password: string, role: AuthRole) => void;
  onRegister?: (name: string, email: string, password: string, role: AuthRole) => void;
  pendingTrainerUsername?: string | null;
};

const credentialsByRole: Record<AuthRole, { email: string; password: string }> = {
  trainer: {
    email: 'carlos@ipersonal.app',
    password: 'password123',
  },
  student: {
    email: 'ana@email.com',
    password: 'password123',
  },
};

export default function Login({ onForgotPassword, onLogin, onRegister, pendingTrainerUsername }: LoginProps) {
  const [role, setRole] = useState<AuthRole>('trainer');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(credentialsByRole.trainer.email);
  const [password, setPassword] = useState(credentialsByRole.trainer.password);

  const copy = useMemo(
    () =>
      role === 'trainer'
        ? {
            cta: 'Entrar como Personal',
            register: 'Cadastrar como Personal',
          }
        : {
            cta: 'Entrar como Aluno',
            register: 'Cadastrar como Aluno',
          },
    [role],
  );

  const handleRoleChange = (newRole: AuthRole) => {
    setRole(newRole);
    if (!isRegistering) {
      setEmail(credentialsByRole[newRole].email);
      setPassword(credentialsByRole[newRole].password);
    } else {
      setEmail('');
      setPassword('');
    }
  };

  function handleLogin() {
    onLogin?.(email, password, role);
  }

  function handleRegister() {
    if (!name.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, preencha o seu nome completo.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha o e-mail e a senha.');
      return;
    }
    onRegister?.(name, email, password, role);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-zinc-950"
    >
      <ScrollView
        bounces={false}
        className="flex-1"
        contentContainerClassName="min-h-full justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <AuthContent>
          <AuthBrand />

          <RoleTabs value={role} onChange={handleRoleChange} />

          {pendingTrainerUsername && role === 'student' && (
            <View className="bg-lime-400/10 border border-lime-400/20 rounded-2xl p-4 flex-row items-center gap-3">
              <View className="w-2 h-2 rounded-full bg-lime-400" />
              <Text className="text-lime-400 text-xs font-semibold flex-1">
                Você será vinculado ao Personal Trainer: @{pendingTrainerUsername}
              </Text>
            </View>
          )}

          <View key={role} className="gap-6">
            {isRegistering && (
              <AuthField
                autoCapitalize="words"
                autoComplete="name"
                value={name}
                onChangeText={setName}
                label="Nome Completo"
                placeholder="Ana Souza"
              />
            )}

            <AuthField
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              inputMode="email"
              keyboardType="email-address"
              label="E-mail"
              placeholder="nome@exemplo.com"
            />

            <AuthField
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              label="Senha"
              placeholder="password123"
              secureTextEntry
              textContentType="password"
              action={!isRegistering && <TextLink onPress={onForgotPassword}>Esqueceu a senha?</TextLink>}
            />

            <GlowingButton className="mt-0" onPress={isRegistering ? handleRegister : handleLogin}>
              {isRegistering ? 'Criar Conta' : copy.cta}
            </GlowingButton>
          </View>

          <View className="flex-row flex-wrap items-center justify-center gap-1">
            <Text className="text-center text-sm text-zinc-400">
              {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            </Text>
            <Pressable onPress={() => {
              setIsRegistering(!isRegistering);
              setName('');
              if (!isRegistering) {
                setEmail(credentialsByRole[role].email);
                setPassword(credentialsByRole[role].password);
              } else {
                setEmail('');
                setPassword('');
              }
            }}>
              <Text className="text-center text-sm font-medium text-lime-400">
                {isRegistering ? 'Entrar' : copy.register}
              </Text>
            </Pressable>
          </View>
        </AuthContent>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
