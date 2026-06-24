import React, { createContext, useContext, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-150)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string, toastType: ToastType = 'success') => {
    // Clear existing timeout if any
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMessage(msg);
    setType(toastType);
    setVisible(true);

    // Slide in
    Animated.spring(translateY, {
      toValue: insets.top > 0 ? insets.top + 8 : 20,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();

    // Auto hide after 3.2 seconds
    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, 3200);
  };

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#a3e635" strokeWidth={2.5} />;
      case 'error':
        return <AlertCircle size={18} color="#ef4444" strokeWidth={2.5} />;
      case 'info':
        return <Info size={18} color="#38bdf8" strokeWidth={2.5} />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-lime-500/20';
      case 'error':
        return 'border-red-500/20';
      case 'info':
        return 'border-sky-500/20';
    }
  };

  const getShadowColor = () => {
    switch (type) {
      case 'success':
        return '#a3e635';
      case 'error':
        return '#ef4444';
      case 'info':
        return '#38bdf8';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY }],
              shadowColor: getShadowColor(),
            },
          ]}
          className={`flex-row items-center gap-3 px-5 py-4 bg-zinc-900 border ${getBorderColor()} rounded-2xl mx-4 absolute left-0 right-0 z-[9999]`}
        >
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-7 h-7 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800">
              {getIcon()}
            </View>
            <Text className="text-zinc-100 font-semibold text-xs leading-5 flex-1">{message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
});
