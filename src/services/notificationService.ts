import { supabase } from './supabase';

export type NotificationType =
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'NO_SHOW';

export interface Notification {
  id: string;
  recipient_type: 'student' | 'trainer';
  recipient_id: string;
  appointment_id?: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  read: boolean;
  created_at: string;
}

export async function createNotification(
  recipient_type: 'student' | 'trainer',
  recipient_id: string,
  title: string,
  message: string,
  notification_type: NotificationType,
  appointment_id?: string
): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    recipient_type,
    recipient_id,
    title,
    message,
    notification_type,
    appointment_id,
  });

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function createAppointmentNotification(
  studentId: string,
  trainerId: string,
  studentName: string,
  dateStr: string,
  timeStr: string,
  appointmentId?: string
) {
  // Notificação para o aluno
  await createNotification(
    'student',
    studentId,
    'Agendamento confirmado',
    `Seu treino foi agendado com sucesso para ${dateStr} às ${timeStr}.`,
    'APPOINTMENT_CREATED',
    appointmentId
  );

  // Notificação para o personal
  await createNotification(
    'trainer',
    trainerId,
    'Novo agendamento',
    `${studentName} agendou um treino para ${dateStr} às ${timeStr}.`,
    'APPOINTMENT_CREATED',
    appointmentId
  );
}

export async function createRescheduleNotification(
  studentId: string,
  trainerId: string,
  studentName: string,
  dateStr: string,
  timeStr: string,
  appointmentId?: string
) {
  // Notificação para o aluno
  await createNotification(
    'student',
    studentId,
    'Treino reagendado',
    `Seu treino foi reagendado para ${dateStr} às ${timeStr}.`,
    'APPOINTMENT_RESCHEDULED',
    appointmentId
  );

  // Notificação para o personal
  await createNotification(
    'trainer',
    trainerId,
    'Agendamento alterado',
    `O treino de ${studentName} foi reagendado para ${dateStr} às ${timeStr}.`,
    'APPOINTMENT_RESCHEDULED',
    appointmentId
  );
}

export async function createNoShowNotification(
  studentId: string,
  trainerId: string,
  studentName: string,
  appointmentId?: string
) {
  // Notificação para o aluno
  await createNotification(
    'student',
    studentId,
    'Treino perdido',
    'Seu agendamento foi marcado como não comparecimento.',
    'NO_SHOW',
    appointmentId
  );

  // Notificação para o personal
  await createNotification(
    'trainer',
    trainerId,
    'Aluno ausente',
    `${studentName} não realizou o check-in e foi marcado como NO_SHOW.`,
    'NO_SHOW',
    appointmentId
  );
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return data as Notification[];
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export function subscribeToNotifications(userId: string, callback: () => void) {
  return supabase
    .channel(`notifications-sub-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      },
      () => {
        callback();
      }
    )
    .subscribe();
}
