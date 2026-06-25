import './global.css';
import React, { useState, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Splash from './src/screens/shared/Splash';
import Login from './src/screens/shared/Login';
import TrainerLayout from './src/screens/trainer/TrainerLayout';
import TrainerAssignWorkout from './src/screens/trainer/TrainerAssignWorkout';
import ClientLayout from './src/screens/client/ClientLayout';
import ClientBookingPage from './src/screens/client/ClientBookingPage';
import ClientSuccessPage from './src/screens/client/ClientSuccessPage';
import ClientWorkoutSuccessPage from './src/screens/client/ClientWorkoutSuccessPage';
import NotificationsScreen from './src/screens/shared/NotificationsScreen';
import { AuthRole } from './src/components/auth/AuthUI';
import { supabase, isSupabaseConfigured } from './src/config/supabase';
import { ToastProvider } from './src/components/common/Toast';

type TabType = 'dashboard' | 'agenda' | 'appointments' | 'profile';
type ClientTabType = 'dashboard' | 'workouts' | 'profile';

type ScreenState =
  | { name: 'Splash' }
  | { name: 'Login' }
  | { name: 'TrainerMain'; tab: TabType }
  | { name: 'TrainerAssignWorkout'; studentId?: string }
  | { name: 'ClientMain'; tab: ClientTabType }
  | { name: 'ClientBooking'; username?: string; appointmentId?: string }
  | { name: 'ClientSuccess'; username?: string }
  | { name: 'ClientWorkoutSuccess' }
  | { name: 'Notifications'; role?: 'student' | 'trainer' };

export default function App() {
  const [screen, setScreen] = useState<ScreenState>({ name: 'Splash' });
  const [session, setSession] = useState<any>(null);
  const [pendingTrainerUsername, setPendingTrainerUsername] = useState<string | null>(null);

  const handlePendingTrainerLink = async (userId: string, trainerUsername: string) => {
    try {
      const { data: trainerData, error: tError } = await supabase
        .from('trainers')
        .select('profile_id, profile:profiles(name)')
        .eq('username', trainerUsername)
        .single();

      if (tError || !trainerData) {

        return;
      }

      const trainerProfile = Array.isArray(trainerData.profile) ? trainerData.profile[0] : trainerData.profile;
      const trainerName = trainerProfile?.name || 'Personal';

      Alert.alert(
        'Vincular Personal',
        `Deseja se vincular ao Personal Trainer ${trainerName} (@${trainerUsername})?`,
        [
          { text: 'Não', style: 'cancel', onPress: () => setPendingTrainerUsername(null) },
          {
            text: 'Sim',
            onPress: async () => {
              const { error } = await supabase
                .from('students')
                .update({ trainer_id: trainerData.profile_id })
                .eq('profile_id', userId);
              
              setPendingTrainerUsername(null);
              if (error) {
                Alert.alert('Erro', 'Não foi possível vincular ao Personal.');
              } else {
                Alert.alert('Sucesso', `Você agora é aluno de ${trainerName}!`);
                setScreen({ name: 'ClientMain', tab: 'dashboard' });
              }
            }
          }
        ]
      );
    } catch (err) {

    }
  };

  const parseAndApplyUrl = async (url: string, currentSession: any) => {

    const regex = /(?:personal\/|invite\?personal=)([^/?#]+)/i;
    const match = url.match(regex);
    if (match && match[1]) {
      const username = match[1];

      
      const loggedInUserId = currentSession?.user?.id;
      if (loggedInUserId) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', loggedInUserId)
            .single();
          
          if (profile?.role === 'student') {
            handlePendingTrainerLink(loggedInUserId, username);
          } else if (profile?.role === 'trainer') {
            Alert.alert('Aviso', 'Você está conectado com uma conta de Personal Trainer. Apenas contas do tipo Aluno podem se vincular a um Personal.');
          }
        } catch (err) {

        }
      } else {
        setPendingTrainerUsername(username);
        Alert.alert(
          'Personal Encontrado',
          `Vínculo com o personal @${username} será aplicado após você entrar ou criar sua conta de aluno.`
        );
      }
    }
  };

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

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const subscription = Linking.addEventListener('url', (event) => {
      parseAndApplyUrl(event.url, session);
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        parseAndApplyUrl(url, session);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [session]);

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
        if (pendingTrainerUsername) {
          setTimeout(() => {
            handlePendingTrainerLink(userId, pendingTrainerUsername);
          }, 550);
        }
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
        let trainerId: string | null = null;
        if (pendingTrainerUsername) {
          try {
            const { data: trainerData } = await supabase
              .from('trainers')
              .select('profile_id')
              .eq('username', pendingTrainerUsername)
              .single();
            
            if (trainerData?.profile_id) {
              trainerId = trainerData.profile_id;
            }
          } catch (err) {

          }
        }

        const { error: studentError } = await supabase
          .from('students')
          .insert({
            profile_id: user.id,
            objective: 'Condicionamento',
            streak: 0,
            workouts_completed: 0,
            trainer_id: trainerId,
          });

        if (studentError) throw studentError;
        setPendingTrainerUsername(null);
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
    target: 'TrainerAssignWorkout' | 'TrainerAgenda' | 'TrainerAppointments' | 'Notifications',
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
    } else if (target === 'Notifications') {
      setScreen({ name: 'Notifications', role: 'trainer' });
    }
  };

  const handleClientNavigate = (
    target: 'ClientBooking' | 'ClientSuccess' | 'ClientWorkouts' | 'ClientWorkoutSuccess' | 'Notifications',
    params?: any
  ) => {
    if (target === 'ClientBooking') {
      setScreen({
        name: 'ClientBooking',
        username: params?.username,
        appointmentId: params?.appointmentId,
      });
    } else if (target === 'ClientSuccess') {
      setScreen({
        name: 'ClientSuccess',
        username: params?.username,
      });
    } else if (target === 'ClientWorkouts') {
      setScreen({ name: 'ClientMain', tab: 'workouts' });
    } else if (target === 'ClientWorkoutSuccess') {
      setScreen({ name: 'ClientWorkoutSuccess' });
    } else if (target === 'Notifications') {
      setScreen({ name: 'Notifications', role: 'student' });
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
  const renderScreen = () => {
    switch (screen.name) {
      case 'Splash':
        return <Splash onFinish={() => setScreen({ name: 'Login' })} />;

      case 'Login':
        return (
          <Login
            onForgotPassword={handleForgotPassword}
            onLogin={handleLogin}
            onRegister={handleRegister}
            pendingTrainerUsername={pendingTrainerUsername}
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
            appointmentId={screen.appointmentId}
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

      case 'ClientWorkoutSuccess':
        return (
          <ClientWorkoutSuccessPage
            onFinish={() => setScreen({ name: 'ClientMain', tab: 'workouts' })}
          />
        );

      case 'Notifications':
        return (
          <NotificationsScreen
            onGoBack={() => {
              if (screen.name === 'Notifications' && screen.role === 'trainer') {
                setScreen({ name: 'TrainerMain', tab: 'dashboard' });
              } else {
                setScreen({ name: 'ClientMain', tab: 'dashboard' });
              }
            }}
          />
        );

      default:
        return <Splash onFinish={() => setScreen({ name: 'Login' })} />;
    }
  };

  return (
    <SafeAreaProvider>
      <ToastProvider>
        {renderScreen()}
      </ToastProvider>
    </SafeAreaProvider>
  );
}
