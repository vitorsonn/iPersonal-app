import React, { useMemo, useState } from 'react';
import {
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
} from '../components/native/AuthUI';

type LoginProps = {
  onForgotPassword?: () => void;
  onLogin?: (email: string, password: string, role: AuthRole) => void;
  onRegister?: (role: AuthRole) => void;
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

export default function Login({ onForgotPassword, onLogin, onRegister }: LoginProps) {
  const [role, setRole] = useState<AuthRole>('trainer');
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
    setEmail(credentialsByRole[newRole].email);
    setPassword(credentialsByRole[newRole].password);
  };

  function handleLogin() {
    onLogin?.(email, password, role);
  }

  function handleRegister() {
    onRegister?.(role);
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

          <View key={role} className="gap-6">
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
              action={<TextLink onPress={onForgotPassword}>Esqueceu a senha?</TextLink>}
            />

            <GlowingButton className="mt-0" onPress={handleLogin}>
              {copy.cta}
            </GlowingButton>
          </View>

          <View className="flex-row flex-wrap items-center justify-center gap-1">
            <Text className="text-center text-sm text-zinc-400">Não tem uma conta?</Text>
            <Pressable onPress={handleRegister}>
              <Text className="text-center text-sm font-medium text-lime-400">{copy.register}</Text>
            </Pressable>
          </View>
        </AuthContent>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
