import React, { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { Card } from '../../components/common/UI';
import { MOCK_APPOINTMENTS, MOCK_STUDENTS } from '../../data/mockData';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Search,
  XCircle,
} from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '../../services/supabase';

const objectiveColors: Record<string, string> = {
  'Hipertrofia': 'bg-blue-500/15 text-blue-400',
  'Emagrecimento': 'bg-orange-500/15 text-orange-400',
  'Condicionamento': 'bg-purple-500/15 text-purple-400',
  'Funcional': 'bg-teal-500/15 text-teal-400',
};

type TrainerAppointmentsProps = {
  onNavigate: (screen: 'TrainerAssignWorkout' | 'TrainerAgenda' | 'TrainerAppointments', params?: any) => void;
};

export default function TrainerAppointments({ onNavigate }: TrainerAppointmentsProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'appointments'>('students');
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const loadData = async () => {
    if (!isSupabaseConfigured()) {
      setStudents(MOCK_STUDENTS);
      setAppointments(MOCK_APPOINTMENTS);
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch appointments
      const { data: apptsData } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          student_id,
          student:student_id (
            objective,
            streak,
            profile:profiles!students_profile_id_fkey (
              name,
              email,
              created_at
            )
          )
        `)
        .eq('trainer_id', user.id);

      // 2. Fetch workouts
      const { data: workoutsData } = await supabase
        .from('workouts')
        .select(`
          student_id,
          student:student_id (
            objective,
            streak,
            profile:profiles!students_profile_id_fkey (
              name,
              email,
              created_at
            )
          )
        `)
        .eq('trainer_id', user.id);

      // 3. Fetch direct students linked by trainer_id
      const { data: directStudentsData } = await supabase
        .from('students')
        .select(`
          profile_id,
          objective,
          streak,
          profile:profiles!students_profile_id_fkey (
            name,
            email,
            created_at
          )
        `)
        .eq('trainer_id', user.id);

      // Formulate unique student list
      const studentsMap = new Map<string, any>();
      const processStudent = (s: any) => {
        if (s && s.profile && !studentsMap.has(s.profile_id || s.profile.id || s.profile.name)) {
          const profile = s.profile as any;
          const studentId = s.profile_id || profile.id;
          const nameParts = (profile?.name || 'Aluno').split(' ');
          const initials = nameParts.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
          
          let since = 'Jun 2026';
          if (profile?.created_at) {
            const date = new Date(profile.created_at);
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            since = `${months[date.getMonth()]} ${date.getFullYear()}`;
          }

          studentsMap.set(studentId, {
            id: studentId,
            name: profile?.name || 'Aluno',
            email: profile?.email || '',
            objective: s.objective || 'Treino',
            streak: s.streak || 0,
            initials,
            nextClass: 'A agendar',
            since,
          });
        }
      };

      directStudentsData?.forEach((s: any) => {
        processStudent(s);
      });

      workoutsData?.forEach((w: any) => {
        const student = w.student;
        if (student) {
          const studentWithId = Array.isArray(student)
            ? { ...student[0], profile_id: w.student_id }
            : { ...student, profile_id: w.student_id };
          processStudent(studentWithId);
        }
      });

      apptsData?.forEach((a: any) => {
        const student = a.student;
        if (student) {
          const studentWithId = Array.isArray(student)
            ? { ...student[0], profile_id: a.student_id }
            : { ...student, profile_id: a.student_id };
          processStudent(studentWithId);
        }
      });

      const uniqueStudents = Array.from(studentsMap.values());

      const formattedAppts = apptsData ? apptsData.map((apt: any) => {
        const studentProfile = Array.isArray(apt.student) ? apt.student[0]?.profile : apt.student?.profile;
        const studentObj = Array.isArray(apt.student) ? apt.student[0] : apt.student;
        const clientName = studentProfile?.name || 'Aluno';
        
        let displayDate = apt.date;
        if (apt.date && apt.date.includes('-')) {
          const parts = apt.date.split('-');
          if (parts.length === 3) {
            displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }

        const studentInMap = studentsMap.get(apt.student_id);
        if (studentInMap && (studentInMap.nextClass === 'A agendar' || apt.status === 'confirmed')) {
          studentInMap.nextClass = `${displayDate}, ${apt.time}`;
        }

        return {
          id: apt.id,
          clientName,
          objective: studentObj?.objective || 'Treino',
          status: apt.status,
          date: displayDate,
          time: apt.time,
        };
      }) : [];

      setStudents(uniqueStudents);
      setAppointments(formattedAppts);

    } catch (err) {
      console.error('Error loading appointments screen data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!isSupabaseConfigured()) return;

    let activeChannel: any = null;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      activeChannel = supabase
        .channel(`trainer-appointments-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `trainer_id=eq.${user.id}` }, () => {
          loadData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts', filter: `trainer_id=eq.${user.id}` }, () => {
          loadData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `trainer_id=eq.${user.id}` }, () => {
          loadData();
        })
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, []);

  const handleAcceptAppointment = async (aptId: string, clientName: string) => {
    if (!isSupabaseConfigured()) {
      Alert.alert('Sucesso', `Agendamento de ${clientName} confirmado!`);
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', aptId);

      if (error) throw error;
      Alert.alert('Sucesso', `Agendamento de ${clientName} confirmado!`);
      await loadData();
    } catch (e: any) {
      Alert.alert('Erro', 'Não foi possível confirmar o agendamento.');
    }
  };

  const handleDeclineAppointment = async (aptId: string, clientName: string) => {
    if (!isSupabaseConfigured()) {
      Alert.alert('Recusado', `Agendamento de ${clientName} recusado.`);
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', aptId);

      if (error) throw error;
      Alert.alert('Recusado', `Agendamento de ${clientName} recusado.`);
      await loadData();
    } catch (e: any) {
      Alert.alert('Erro', 'Não foi possível recusar o agendamento.');
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.objective.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#a3e635" />
      </View>
    );
  }

  if (selectedStudent) {
    return (
      <ScrollView className="flex-1 bg-zinc-950" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="p-6 gap-6">
          <View className="pt-4 flex-row items-center gap-3">
            <Pressable
              onPress={() => setSelectedStudent(null)}
              className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center"
            >
              <ChevronLeft size={20} color="#71717a" />
            </Pressable>
            <Text className="text-xl font-bold text-zinc-100">Detalhes do Aluno</Text>
          </View>

          <View className="items-center gap-4 py-4">
            <View className="w-20 h-20 rounded-full bg-lime-400 items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.2)]">
              <Text className="text-zinc-950 text-2xl font-bold">{selectedStudent.initials}</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold text-zinc-100 text-center">{selectedStudent.name}</Text>
              <Text className="text-zinc-400 text-sm text-center mt-1">{selectedStudent.email}</Text>
              <View className="mt-3">
                <View className={`px-3 py-1 rounded-full ${objectiveColors[selectedStudent.objective] || 'bg-zinc-800 text-zinc-400'}`}>
                  <Text className="text-xs font-semibold text-center">{selectedStudent.objective}</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <Card className="flex-1 p-4 items-center">
              <Flame size={20} color="#fb923c" />
              <Text className="text-2xl font-bold text-zinc-100 mt-2">{selectedStudent.streak}</Text>
              <Text className="text-xs text-zinc-500 mt-1">dias seguidos</Text>
            </Card>
            <Card className="flex-1 p-4 items-center">
              <CalendarDays size={20} color="#a3e635" />
              <Text className="text-sm font-bold text-zinc-100 mt-2 text-center" numberOfLines={1}>
                {selectedStudent.nextClass}
              </Text>
              <Text className="text-xs text-zinc-500 mt-1">próxima aula</Text>
            </Card>
          </View>

          <Pressable
            onPress={() => onNavigate('TrainerAssignWorkout', { studentId: selectedStudent.id })}
            className="w-full h-14 rounded-2xl bg-lime-400 items-center justify-center font-bold shadow-[0_0_20px_rgba(163,230,53,0.3)] active:scale-95"
          >
            <View className="flex-row items-center gap-2">
              <DumbbellIcon size={20} />
              <Text className="text-zinc-950 font-bold text-base">Atribuir Novo Treino</Text>
            </View>
          </Pressable>

          <Card className="p-4 gap-3">
            <Text className="font-semibold text-zinc-300">Informações</Text>
            <View className="flex-row justify-between text-sm py-1 border-b border-zinc-800/40">
              <Text className="text-zinc-500">Aluno desde</Text>
              <Text className="font-medium text-zinc-300">{selectedStudent.since}</Text>
            </View>
            <View className="flex-row justify-between text-sm py-1 border-b border-zinc-800/40">
              <Text className="text-zinc-500">Status</Text>
              <View className="flex-row items-center gap-1.5">
                <View className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                <Text className="text-lime-400 font-medium">Ativo</Text>
              </View>
            </View>
            <View className="flex-row justify-between text-sm py-1">
              <Text className="text-zinc-500">Objetivo</Text>
              <Text className="font-medium text-zinc-300">{selectedStudent.objective}</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-zinc-950" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="p-6 gap-6">
        <View className="pt-4 gap-1">
          <Text className="text-2xl font-bold text-zinc-100">Alunos</Text>
          <Text className="text-zinc-400 text-sm">{students.length} alunos ativos</Text>
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-zinc-900 p-1 rounded-2xl">
          <Pressable
            onPress={() => setActiveTab('students')}
            className={`flex-1 py-3 items-center justify-center rounded-xl ${
              activeTab === 'students' ? 'bg-zinc-800' : 'bg-transparent'
            }`}
          >
            <Text className={`text-sm font-medium ${activeTab === 'students' ? 'text-white' : 'text-zinc-500'}`}>
              Todos os Alunos
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('appointments')}
            className={`flex-1 py-3 items-center justify-center rounded-xl ${
              activeTab === 'appointments' ? 'bg-zinc-800' : 'bg-transparent'
            }`}
          >
            <Text className={`text-sm font-medium ${activeTab === 'appointments' ? 'text-white' : 'text-zinc-500'}`}>
              Agendamentos
            </Text>
          </Pressable>
        </View>

        {/* Tab Contents */}
        {activeTab === 'students' && (
          <View className="gap-4">
            <View className="relative flex-row items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 h-14">
              <Search size={18} color="#71717a" />
              <TextInput
                className="flex-1 ml-3 text-zinc-100 text-sm"
                placeholder="Buscar por nome ou objetivo..."
                placeholderTextColor="#71717a"
                selectionColor="#a3e635"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <View className="gap-2">
              {filteredStudents.map(student => (
                <Pressable
                  key={student.id}
                  onPress={() => setSelectedStudent(student)}
                >
                  <Card className="p-4 flex-row items-center gap-3 active:border-zinc-700">
                    <View className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center shrink-0">
                      <Text className="text-sm font-bold text-zinc-300">{student.initials}</Text>
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="font-semibold text-zinc-100 truncate">{student.name}</Text>
                      <Text className="text-xs text-zinc-500 truncate mt-0.5">{student.nextClass}</Text>
                    </View>
                    <View className="flex-row items-center gap-2 shrink-0">
                      <View className={`px-2 py-0.5 rounded-full ${objectiveColors[student.objective] || 'bg-zinc-800 text-zinc-400'}`}>
                        <Text className="text-[10px] font-semibold">{student.objective}</Text>
                      </View>
                      <View className="flex-row items-center gap-0.5">
                        <Flame size={12} color="#fb923c" />
                        <Text className="text-xs font-bold text-orange-400">{student.streak}</Text>
                      </View>
                      <ChevronRight size={16} color="#27272a" />
                    </View>
                  </Card>
                </Pressable>
              ))}

              {filteredStudents.length === 0 && (
                <View className="items-center py-12">
                  <Search size={32} color="#71717a" style={{ opacity: 0.3 }} />
                  <Text className="text-zinc-500 mt-3 text-sm">Nenhum aluno encontrado</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'appointments' && (
          <View className="gap-3">
            {appointments.map(apt => (
              <Card key={apt.id} className="p-0 overflow-hidden">
                <View className="p-4 flex-row items-center justify-between border-b border-zinc-800/50">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center">
                      <Text className="font-bold text-zinc-400 text-sm">
                        {apt.clientName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </Text>
                    </View>
                    <View>
                      <Text className="font-bold text-zinc-100">{apt.clientName}</Text>
                      <Text className="text-xs text-zinc-500 mt-0.5">{apt.objective}</Text>
                    </View>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${apt.status === 'confirmed' ? 'bg-lime-400/10' : 'bg-amber-400/10'}`}>
                    <Text className={`text-[10px] font-semibold ${apt.status === 'confirmed' ? 'text-lime-400' : 'text-amber-400'}`}>
                      {apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                    </Text>
                  </View>
                </View>
                <View className="bg-zinc-950/50 px-4 py-3 flex-row items-center justify-between">
                  <View className="flex-row items-center text-sm">
                    <Text className="text-zinc-400 text-xs">{apt.date}</Text>
                    <Text className="text-zinc-650 mx-2 text-xs">·</Text>
                    <Text className="font-semibold text-lime-400 text-xs">{apt.time}</Text>
                  </View>
                  {apt.status === 'pending' && (
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleDeclineAppointment(apt.id, apt.clientName)}
                        className="w-8 h-8 rounded-full bg-red-500/10 items-center justify-center active:scale-95"
                      >
                        <XCircle size={16} color="#ef4444" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleAcceptAppointment(apt.id, apt.clientName)}
                        className="w-8 h-8 rounded-full bg-lime-400/10 items-center justify-center active:scale-95"
                      >
                        <CheckCircle2 size={16} color="#a3e635" />
                      </Pressable>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Custom simple Dumbbell icon
function DumbbellIcon({ size }: { size: number }) {
  return (
    <View className="rotate-45" style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View className="w-1.5 h-full bg-zinc-950 rounded" />
      <View className="absolute left-0 w-3 h-3 rounded-full bg-zinc-950" />
      <View className="absolute right-0 w-3 h-3 rounded-full bg-zinc-950" />
    </View>
  );
}
