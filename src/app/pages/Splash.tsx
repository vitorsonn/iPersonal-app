import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Text,
  View,
} from 'react-native';
import { Activity } from 'lucide-react-native';

type SplashProps = {
  onFinish: () => void;
};

export default function Splash({ onFinish }: SplashProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center relative">
      {/* Background glow visual element */}
      <View
        className="absolute w-[300] h-[300] bg-lime-400 opacity-20 rounded-full blur-[100px]"
        style={{
          shadowColor: '#a3e635',
          shadowOpacity: 0.35,
          shadowRadius: 150,
        }}
      />

      <View className="items-center z-10 gap-6">
        <View
          className="w-24 h-24 rounded-3xl bg-lime-400 items-center justify-center"
          style={{
            shadowColor: '#a3e635',
            shadowOpacity: 0.5,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 0 },
            elevation: 15,
          }}
        >
          <Activity size={48} color="#09090b" strokeWidth={2.5} />
        </View>
        <View className="items-center">
          <Text className="text-4xl font-bold text-white tracking-tight">iPersonal</Text>
          <Text className="text-lime-400 mt-2 font-bold tracking-widest uppercase text-xs">Pro</Text>
        </View>
      </View>

      {/* Loading Indicator at the bottom */}
      <View className="absolute bottom-16">
        <ActivityIndicator size="small" color="#a3e635" />
      </View>
    </View>
  );
}
