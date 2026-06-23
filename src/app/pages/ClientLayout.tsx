import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Home, Dumbbell, User } from 'lucide-react-native';
import ClientDashboard from './ClientDashboard';
import ClientWorkouts from './ClientWorkouts';
import ClientProfile from './ClientProfile';

type ClientTabType = 'dashboard' | 'workouts' | 'profile';

type ClientLayoutProps = {
  activeTab: ClientTabType;
  setActiveTab: (tab: ClientTabType) => void;
  onNavigate: (screen: 'ClientBooking' | 'ClientSuccess' | 'ClientWorkouts', params?: any) => void;
  onLogout: () => void;
};

export default function ClientLayout({
  activeTab,
  setActiveTab,
  onNavigate,
  onLogout,
}: ClientLayoutProps) {
  const navItems = [
    { id: 'dashboard' as const, icon: Home, label: 'Início' },
    { id: 'workouts' as const, icon: Dumbbell, label: 'Treinos' },
    { id: 'profile' as const, icon: User, label: 'Perfil' },
  ];

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ClientDashboard onNavigate={onNavigate} />;
      case 'workouts':
        return <ClientWorkouts />;
      case 'profile':
        return <ClientProfile onLogout={onLogout} />;
      default:
        return <ClientDashboard onNavigate={onNavigate} />;
    }
  };

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Active screen content */}
      <View className="flex-1">
        {renderActiveScreen()}
      </View>

      {/* Tab bar navigation */}
      <View className="absolute bottom-0 left-0 right-0 h-22 bg-zinc-950 border-t border-zinc-900 px-6 flex-row items-center justify-around pb-6">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <Pressable
              key={item.id}
              onPress={() => setActiveTab(item.id)}
              className="items-center justify-center flex-col gap-1 p-2 flex-1"
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
                <View className="absolute bottom-0 w-1 h-1 rounded-full bg-lime-400" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}