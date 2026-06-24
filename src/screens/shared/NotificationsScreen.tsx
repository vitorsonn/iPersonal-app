import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { ChevronLeft, Bell, BellDot, Check } from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { getUserNotifications, markAsRead, subscribeToNotifications, Notification } from '../../services/notificationService';
import { Card } from '../../components/common/UI';

interface NotificationsScreenProps {
  onGoBack: () => void;
}

export default function NotificationsScreen({ onGoBack }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activeChannel: any = null;

    const fetchNotifications = async () => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const data = await getUserNotifications(user.id);
          setNotifications(data);
          
          activeChannel = subscribeToNotifications(user.id, async () => {
            const newData = await getUserNotifications(user.id);
            setNotifications(newData);
          });
        }
      } catch (err) {
        console.error('Error loading notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, []);

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read && isSupabaseConfigured()) {
      try {
        await markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
  };

  const getNotificationIcon = (type: string, read: boolean) => {
    const color = read ? '#71717a' : '#a3e635'; // zinc-500 or lime-400
    if (!read) return <BellDot size={24} color={color} />;
    return <Bell size={24} color={color} />;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#a3e635" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <View className="px-6 pt-12 pb-4 flex-row items-center gap-4 border-b border-zinc-900 bg-zinc-950/80">
        <Pressable
          onPress={onGoBack}
          className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center active:scale-95"
        >
          <ChevronLeft size={20} color="#71717a" />
        </Pressable>
        <Text className="text-xl font-bold text-zinc-100">Notificações</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, gap: 16 }}>
        {notifications.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Bell size={48} color="#27272a" />
            <Text className="text-zinc-500 mt-4 text-center">
              Você não tem nenhuma notificação no momento.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <Pressable key={notification.id} onPress={() => handleNotificationPress(notification)}>
              <Card className={`flex-row gap-4 p-4 ${notification.read ? 'opacity-70' : 'border-lime-400/30 bg-lime-400/5'}`}>
                <View className="pt-1">
                  {getNotificationIcon(notification.notification_type, notification.read)}
                </View>
                <View className="flex-1 gap-1">
                  <View className="flex-row items-start justify-between">
                    <Text className={`font-bold ${notification.read ? 'text-zinc-300' : 'text-zinc-100'} flex-1 mr-2`}>
                      {notification.title}
                    </Text>
                    {notification.read && <Check size={16} color="#71717a" />}
                  </View>
                  <Text className="text-sm text-zinc-400 leading-relaxed">
                    {notification.message}
                  </Text>
                  <Text className="text-xs text-zinc-500 mt-1">
                    {formatDate(notification.created_at)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
