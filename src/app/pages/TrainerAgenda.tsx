import React, { useState, useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Card } from '../components/native/UI';
import { MOCK_APPOINTMENTS } from '../mockData';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react-native';

export default function TrainerAgenda() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'availability'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 22)); // Default to one of mock dates: June 22, 2026
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 5, 1)); // June 2026

  const bookedDates = useMemo(() => [
    new Date(2026, 5, 16),
    new Date(2026, 5, 17),
    new Date(2026, 5, 18),
    new Date(2026, 5, 22),
    new Date(2026, 5, 23),
  ], []);

  // Helper to determine if dates are the same day
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Filter appointments for the selected day
  const selectedDayAppointments = useMemo(() => {
    return MOCK_APPOINTMENTS.filter(apt => {
      // For simplicity, match today's date in mock to June 22, 2026, and Tomorrow's to June 23, 2026
      if (apt.date === 'Hoje' && isSameDay(selectedDate, new Date(2026, 5, 22))) return true;
      if (apt.date === 'Amanhã' && isSameDay(selectedDate, new Date(2026, 5, 23))) return true;
      return false;
    });
  }, [selectedDate]);

  // Generate calendar grid days for currentMonth
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];

    // Padding for days before start of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Days of the month
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [currentMonth]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleRemoveSlot = (day: string) => {
    Alert.alert('Sucesso', `Horário removido de ${day}`);
  };

  const handleAddSlot = () => {
    Alert.alert('Sucesso', 'Novo horário adicionado na agenda padrão');
  };

  const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <ScrollView
      className="flex-1 bg-zinc-950"
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="p-6 gap-6">
        {/* Header */}
        <View className="pt-4">
          <Text className="text-2xl font-bold text-zinc-100">Agenda</Text>
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-zinc-900 p-1 rounded-2xl">
          <Pressable
            onPress={() => setActiveTab('calendar')}
            className={`flex-1 py-3 items-center justify-center rounded-xl ${
              activeTab === 'calendar' ? 'bg-zinc-800' : 'bg-transparent'
            }`}
          >
            <Text className={`text-sm font-medium ${activeTab === 'calendar' ? 'text-white' : 'text-zinc-500'}`}>
              Calendário
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('availability')}
            className={`flex-1 py-3 items-center justify-center rounded-xl ${
              activeTab === 'availability' ? 'bg-zinc-800' : 'bg-transparent'
            }`}
          >
            <Text className={`text-sm font-medium ${activeTab === 'availability' ? 'text-white' : 'text-zinc-500'}`}>
              Disponibilidade
            </Text>
          </Pressable>
        </View>

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <View className="gap-5">
            {/* Custom Interactive Calendar */}
            <Card className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl">
              {/* Calendar Header */}
              <View className="flex-row justify-between items-center mb-4 px-2">
                <Text className="text-zinc-100 font-bold text-base">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={handlePrevMonth}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95"
                  >
                    <ChevronLeft size={16} color="#e4e4e7" />
                  </Pressable>
                  <Pressable
                    onPress={handleNextMonth}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95"
                  >
                    <ChevronRight size={16} color="#e4e4e7" />
                  </Pressable>
                </View>
              </View>

              {/* Weekday headers */}
              <View className="flex-row mb-2">
                {weekdays.map((wd, index) => (
                  <View key={index} className="flex-1 items-center py-1">
                    <Text className="text-[11px] font-semibold text-zinc-500">{wd}</Text>
                  </View>
                ))}
              </View>

              {/* Days grid */}
              <View className="flex-row flex-wrap">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <View key={`empty-${idx}`} className="w-[14.28%] aspect-square" />;
                  }

                  const isSelected = isSameDay(day, selectedDate);
                  const isBooked = bookedDates.some(bd => isSameDay(bd, day));
                  const isToday = isSameDay(day, new Date(2026, 5, 22)); // Mock "today"

                  return (
                    <Pressable
                      key={day.toISOString()}
                      onPress={() => setSelectedDate(day)}
                      className="w-[14.28%] aspect-square items-center justify-center p-1"
                    >
                      <View
                        className={`w-9 h-9 items-center justify-center rounded-xl relative ${
                          isSelected
                            ? 'bg-lime-400'
                            : isToday
                            ? 'border border-lime-400'
                            : 'bg-transparent'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            isSelected
                              ? 'text-zinc-950 font-bold'
                              : isToday
                              ? 'text-lime-400 font-bold'
                              : 'text-zinc-200'
                          }`}
                        >
                          {day.getDate()}
                        </Text>

                        {/* Dot Indicator for Booked dates */}
                        {isBooked && !isSelected && (
                          <View className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-lime-400" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            {/* Selected Date Appointments */}
            <View className="gap-3">
              <Text className="font-semibold text-zinc-300">
                {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
              </Text>

              {selectedDayAppointments.length > 0 ? (
                selectedDayAppointments.map((apt) => (
                  <Card key={apt.id} className="p-4 flex-row items-center gap-4">
                    <View className="flex-col items-center justify-center w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800">
                      <Text className="text-lg font-bold text-lime-400">{apt.time.split(':')[0]}</Text>
                      <Text className="text-[10px] text-zinc-500 uppercase">{apt.time.split(':')[1]}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-zinc-100">{apt.clientName}</Text>
                      <Text className="text-sm text-zinc-400 mt-0.5">{apt.objective}</Text>
                    </View>
                    <View className={`w-2 h-2 rounded-full ${apt.status === 'confirmed' ? 'bg-lime-400' : 'bg-amber-400'}`} />
                  </Card>
                ))
              ) : (
                <View className="items-center py-10">
                  <Text className="text-sm text-zinc-500 font-medium">Nenhum atendimento neste dia</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Availability View */}
        {activeTab === 'availability' && (
          <View className="gap-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-zinc-100">Horários Padrão</Text>
              <Pressable
                onPress={handleAddSlot}
                className="p-2 bg-lime-400/10 rounded-full active:scale-95"
              >
                <Plus size={20} color="#a3e635" />
              </Pressable>
            </View>

            <View className="gap-4">
              {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((day) => (
                <Card key={day} className="p-4 gap-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-zinc-100">{day}</Text>
                    <Pressable
                      onPress={() => Alert.alert('Configurações', 'Disponibilidade alterada')}
                      className="w-12 h-6 bg-lime-400 rounded-full justify-center px-1"
                    >
                      <View className="w-4 h-4 bg-zinc-950 rounded-full self-end" />
                    </Pressable>
                  </View>
                  <View className="flex-row gap-2 pt-3 border-t border-zinc-800/80">
                    <View className="flex-1 flex-row items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                      <View className="flex-row items-center gap-2">
                        <Clock size={14} color="#71717a" />
                        <Text className="text-sm text-zinc-300">08:00 - 12:00</Text>
                      </View>
                      <Pressable onPress={() => handleRemoveSlot(day)} className="p-1">
                        <Trash2 size={14} color="#ef4444" />
                      </Pressable>
                    </View>
                    <View className="flex-1 flex-row items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                      <View className="flex-row items-center gap-2">
                        <Clock size={14} color="#71717a" />
                        <Text className="text-sm text-zinc-300">14:00 - 18:00</Text>
                      </View>
                      <Pressable onPress={() => handleRemoveSlot(day)} className="p-1">
                        <Trash2 size={14} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
