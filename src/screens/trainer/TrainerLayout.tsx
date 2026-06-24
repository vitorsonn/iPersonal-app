import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, Home, User, Users } from 'lucide-react-native';
import TrainerDashboard from './TrainerDashboard';
import TrainerAgenda from './TrainerAgenda';
import TrainerAppointments from './TrainerAppointments';
import TrainerProfile from './TrainerProfile';

type TabType = 'dashboard' | 'agenda' | 'appointments' | 'profile';

type TrainerLayoutProps = {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onNavigate: (screen: 'TrainerAssignWorkout' | 'TrainerAgenda' | 'TrainerAppointments', params?: any) => void;
  onLogout: () => void;
};

export default function TrainerLayout({
  activeTab,
  setActiveTab,
  onNavigate,
  onLogout,
}: TrainerLayoutProps) {
  const insets = useSafeAreaInsets();
  const navItems = [
    { id: 'dashboard' as const, icon: Home, label: 'Início' },
    { id: 'agenda' as const, icon: CalendarDays, label: 'Agenda' },
    { id: 'appointments' as const, icon: Users, label: 'Alunos' },
    { id: 'profile' as const, icon: User, label: 'Perfil' },
  ];

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TrainerDashboard onNavigate={onNavigate} />;
      case 'agenda':
        return <TrainerAgenda />;
      case 'appointments':
        return <TrainerAppointments onNavigate={onNavigate} />;
      case 'profile':
        return <TrainerProfile onLogout={onLogout} />;
      default:
        return <TrainerDashboard onNavigate={onNavigate} />;
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Active screen content */}
      <View className="flex-1">
        {renderActiveScreen()}
      </View>

      {/* Tab bar navigation */}
      <View 
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        className="absolute bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-900 px-6 flex-row items-center justify-around pt-3"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <Pressable
              key={item.id}
              onPress={() => setActiveTab(item.id)}
              className="items-center justify-center flex-col gap-1 p-2 flex-1 active:opacity-75"
            >
              <Icon
                size={22}
                color={isActive ? '#a3e635' : '#71717a'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text className={`text-[10px] font-semibold mt-1 ${isActive ? 'text-lime-400' : 'text-zinc-500'}`}>
                {item.label}
              </Text>
              {isActive && (
                <View className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-lime-400" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
