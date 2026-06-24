const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/screens/client/ClientDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
content = content.replace(
  "import {\n  ArrowRight,\n  Calendar,",
  "import {\n  ArrowRight,\n  Calendar,\n  Bell,"
);

content = content.replace(
  "import {\n  getNextAppointment,\n  checkInAppointment,\n  subscribeToAppointments,\n  parseAppointmentDateTime,\n} from '../../services/appointments';",
  "import {\n  getNextAppointment,\n  checkInAppointment,\n  subscribeToAppointments,\n  parseAppointmentDateTime,\n} from '../../services/appointments';\nimport { getUserNotifications, subscribeToNotifications, Notification } from '../../services/notificationService';"
);

content = content.replace(
  "type ClientDashboardProps = {\n  onNavigate: (screen: 'ClientBooking' | 'ClientSuccess' | 'ClientWorkouts' | 'ClientWorkoutSuccess', params?: any) => void;\n};",
  "type ClientDashboardProps = {\n  onNavigate: (screen: 'ClientBooking' | 'ClientSuccess' | 'ClientWorkouts' | 'ClientWorkoutSuccess' | 'Notifications', params?: any) => void;\n};"
);

// 2. Add state
content = content.replace(
  "const [client, setClient] = useState({",
  "const [notifications, setNotifications] = useState<Notification[]>([]);\n  const [unreadCount, setUnreadCount] = useState(0);\n\n  const [client, setClient] = useState({"
);

// 3. Add to loadData
content = content.replace(
  "const nextApt = await getNextAppointment(user.id);",
  "const nextApt = await getNextAppointment(user.id);\n      const notifs = await getUserNotifications(user.id);\n      setNotifications(notifs.slice(0, 5));\n      setUnreadCount(notifs.filter(n => !n.read).length);"
);

// 4. Add to setupRealtime
content = content.replace(
  "let activeChannel: any = null;\n    let workoutsChannel: any = null;\n    let studentsChannel: any = null;",
  "let activeChannel: any = null;\n    let workoutsChannel: any = null;\n    let studentsChannel: any = null;\n    let notifsChannel: any = null;"
);

content = content.replace(
  "studentsChannel = supabase\n        .channel(`client-students-${user.id}`)",
  "notifsChannel = subscribeToNotifications(user.id, async () => {\n        const notifs = await getUserNotifications(user.id);\n        setNotifications(notifs.slice(0, 5));\n        setUnreadCount(notifs.filter(n => !n.read).length);\n      });\n\n      studentsChannel = supabase\n        .channel(`client-students-${user.id}`)"
);

content = content.replace(
  "if (studentsChannel) {\n        supabase.removeChannel(studentsChannel);\n      }",
  "if (studentsChannel) {\n        supabase.removeChannel(studentsChannel);\n      }\n      if (notifsChannel) {\n        supabase.removeChannel(notifsChannel);\n      }"
);

// 5. Update header icon
content = content.replace(
  `          <Pressable
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center"
            onPress={() => Alert.alert('Notificações', 'Sem novas notificações.')}
          >
            <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-lime-400" />
            <Calendar size={18} color="#71717a" />
          </Pressable>`,
  `          <Pressable
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center"
            onPress={() => onNavigate('Notifications')}
          >
            {unreadCount > 0 && (
              <View className="absolute top-1 right-1 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1 z-10">
                <Text className="text-[9px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
            <Bell size={18} color={unreadCount > 0 ? "#a3e635" : "#71717a"} />
          </Pressable>`
);

// 6. Add Notificações Recentes section
content = content.replace(
  "        {/* Today's Workout */}",
  `        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-zinc-100">Notificações Recentes</Text>
              <Pressable onPress={() => onNavigate('Notifications')}>
                <Text className="text-lime-400 text-sm font-semibold">Ver todas</Text>
              </Pressable>
            </View>
            <View className="gap-2">
              {notifications.map(n => (
                <Pressable key={n.id} onPress={() => onNavigate('Notifications')}>
                  <Card className={\`flex-row items-center justify-between p-3 \${n.read ? 'opacity-70' : 'border-lime-400/30 bg-lime-400/5'}\`}>
                    <View className="flex-1 pr-4">
                      <Text className={\`font-bold text-sm \${n.read ? 'text-zinc-300' : 'text-zinc-100'}\`}>{n.title}</Text>
                      <Text className="text-xs text-zinc-400" numberOfLines={1}>{n.message}</Text>
                    </View>
                    <Text className="text-[10px] text-zinc-500">
                      {new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Today's Workout */}`
);

fs.writeFileSync(filePath, content);
console.log('Done');
