import './global.css';
import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import Splash from './src/app/pages/Splash';
import Login from './src/app/pages/Login';
import TrainerLayout from './src/app/pages/TrainerLayout';
import TrainerAssignWorkout from './src/app/pages/TrainerAssignWorkout';
import ClientLayout from './src/app/pages/ClientLayout';
import ClientBookingPage from './src/app/pages/ClientBookingPage';
import ClientSuccessPage from './src/app/pages/ClientSuccessPage';
import { AuthRole } from './src/app/components/native/AuthUI';
import { supabase, isSupabaseConfigured } from './src/app/services/supabase';

type TabType = 'dashboard' | 'agenda' | 'appointments' | 'profile';
type ClientTabType = 'dashboard' | 'workouts' | 'profile';

type ScreenState =
  | { name: 'Splash' }
  | { name: 'Login' }
  | { name: 'TrainerMain'; tab: TabType }
  | { name: 'TrainerAssignWorkout'; studentId?: string }
  | { name: 'ClientMain'; tab: ClientTabType }
  | { name: 'ClientBooking'; username?: string }
  | { name: 'ClientSuccess'; username?: string };

export default function App() {
  const [screen, setScreen] = useState<ScreenState>({ name: 'Splash' });
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Fetch initial session on startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUserRoleAndRedirect(session.user.id);
      }
    });

    // Listen to Auth state events (Login, Logout, Token Renewal)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUserRoleAndRedirect(session.user.id);
      } else {
        setScreen({ name: 'Login' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRoleAndRedirect = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data?.role === 'trainer') {
        setScreen({ name: 'TrainerMain', tab: 'dashboard' });
      } else if (data?.role === 'student') {
        setScreen({ name: 'ClientMain', tab: 'dashboard' });
      } else {
        Alert.alert('Erro', 'Cargo de usuário não identificado.');
        supabase.auth.signOut();
      }
    } catch (e: any) {
      Alert.alert('Erro de Perfil', 'Houve um erro ao buscar o perfil do usuário.');
      supabase.auth.signOut();
    }
  };

  const handleLogin = async (email: string, password: string, role: AuthRole) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Erro de Login', error.message);
      }
    } else {
      // Mock Fallback
      if (role === 'trainer') {
        setScreen({ name: 'TrainerMain', tab: 'dashboard' });
      } else {
        setScreen({ name: 'ClientMain', tab: 'dashboard' });
      }
    }
  };

  const handleRegister = async (name: string, email: string, password: string, role: AuthRole) => {
    if (!isSupabaseConfigured()) {
      Alert.alert(
        'Cadastro (Modo Demo)',
        `Conta criada no modo de demonstração offline!\nNome: ${name}\nCargo: ${role === 'trainer' ? 'Personal' : 'Aluno'}`,
        [{
          text: 'Entrar',
          onPress: () => {
            if (role === 'trainer') {
              setScreen({ name: 'TrainerMain', tab: 'dashboard' });
            } else {
              setScreen({ name: 'ClientMain', tab: 'dashboard' });
            }
          }
        }]
      );
      return;
    }

    try {
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      const user = authData.user;
      if (!user) throw new Error('Não foi possível criar a conta.');

      // 2. Insert profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: name,
          email: email,
          role: role,
        });

      if (profileError) throw profileError;

      // 3. Insert role-specific record
      if (role === 'trainer') {
        const baseUsername = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');
        const usernameSuffix = Math.floor(100 + Math.random() * 900);
        const finalUsername = `${baseUsername}-${usernameSuffix}`;

        const { error: trainerError } = await supabase
          .from('trainers')
          .insert({
            profile_id: user.id,
            username: finalUsername,
            bio: 'Especialista em saúde e boa forma.',
            specialties: ['Hipertrofia'],
            certifications: [],
          });

        if (trainerError) throw trainerError;
      } else {
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            profile_id: user.id,
            objective: 'Condicionamento',
            streak: 0,
            workouts_completed: 0,
          });

        if (studentError) throw studentError;
      }

      if (!authData.session) {
        Alert.alert(
          'Sucesso!',
          'Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de fazer o login.',
          [{ text: 'Ok' }]
        );
      } else {
        Alert.alert(
          'Sucesso!',
          'Cadastro realizado e conectado com sucesso!',
          [{ text: 'Ok' }]
        );
      }

    } catch (e: any) {
      Alert.alert('Erro no Cadastro', e.message);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Recuperar Senha',
      'Fluxo de recuperação de senha ainda não conectado.',
      [{ text: 'Ok' }]
    );
  };

  // Trainer Navigation handlers
  const handleTrainerNavigate = (
    target: 'TrainerAssignWorkout' | 'TrainerAgenda' | 'TrainerAppointments',
    params?: any
  ) => {
    if (target === 'TrainerAssignWorkout') {
      setScreen({
        name: 'TrainerAssignWorkout',
        studentId: params?.studentId,
      });
    } else if (target === 'TrainerAgenda') {
      setScreen({ name: 'TrainerMain', tab: 'agenda' });
    } else if (target === 'TrainerAppointments') {
      setScreen({ name: 'TrainerMain', tab: 'appointments' });
    }
  };

  // Client/Student Navigation handlers
  const handleClientNavigate = (
    target: 'ClientBooking' | 'ClientSuccess' | 'ClientWorkouts',
    params?: any
  ) => {
    if (target === 'ClientBooking') {
      setScreen({
        name: 'ClientBooking',
        username: params?.username,
      });
    } else if (target === 'ClientSuccess') {
      setScreen({
        name: 'ClientSuccess',
        username: params?.username,
      });
    } else if (target === 'ClientWorkouts') {
      setScreen({ name: 'ClientMain', tab: 'workouts' });
    }
  };

  const handleLogout = () => {
    if (isSupabaseConfigured()) {
      supabase.auth.signOut();
    } else {
      setScreen({ name: 'Login' });
    }
  };

  // Render Screens
  switch (screen.name) {
    case 'Splash':
      return <Splash onFinish={() => setScreen({ name: 'Login' })} />;

    case 'Login':
      return (
        <Login
          onForgotPassword={handleForgotPassword}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      );

    case 'TrainerMain':
      return (
        <TrainerLayout
          activeTab={screen.tab}
          setActiveTab={(tab) => setScreen({ name: 'TrainerMain', tab })}
          onNavigate={handleTrainerNavigate}
          onLogout={handleLogout}
        />
      );

    case 'TrainerAssignWorkout':
      return (
        <TrainerAssignWorkout
          studentId={screen.studentId}
          onFinish={() => setScreen({ name: 'TrainerMain', tab: 'dashboard' })}
          onGoBack={() => setScreen({ name: 'TrainerMain', tab: 'dashboard' })}
        />
      );

    case 'ClientMain':
      return (
        <ClientLayout
          activeTab={screen.tab}
          setActiveTab={(tab) => setScreen({ name: 'ClientMain', tab })}
          onNavigate={handleClientNavigate}
          onLogout={handleLogout}
        />
      );

    case 'ClientBooking':
      return (
        <ClientBookingPage
          username={screen.username}
          onNavigate={handleClientNavigate}
          onGoBack={() => setScreen({ name: 'ClientMain', tab: 'dashboard' })}
        />
      );

    case 'ClientSuccess':
      return (
        <ClientSuccessPage
          username={screen.username}
          onFinish={() => setScreen({ name: 'ClientMain', tab: 'dashboard' })}
        />
      );

    default:
      return <Splash onFinish={() => setScreen({ name: 'Login' })} />;
  }
}
