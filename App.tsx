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

  const handleRegister = (role: AuthRole) => {
    Alert.alert(
      'Cadastro',
      isSupabaseConfigured()
        ? 'Para cadastro, crie uma conta no console do Supabase ou crie a lógica de inserção na tabela "profiles".'
        : 'Fluxo de cadastro de conta ainda não conectado no protótipo.',
      [{ text: 'Ok' }]
    );
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
