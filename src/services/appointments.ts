import { supabase } from '../config/supabase';

export type AppointmentStatus =
  | 'AGUARDANDO'
  | 'PENDENTE'
  | 'CHECKED_IN'
  | 'NO_SHOW'
  | 'CONCLUIDA';

export interface Appointment {
  id: string;
  student_id: string;
  trainer_id: string;
  date: string;
  time: string;
  status: string;
  checked_in_at: string | null;
  created_at: string;
  trainer?: {
    username: string;
    profile: {
      name: string;
      avatar_url: string | null;
    };
  };
}

/**
 * Maps database lowercase status to application uppercase status.
 */
export function mapStatusFromDb(status: string): AppointmentStatus {
  const s = (status || '').toLowerCase();
  if (s === 'pending') return 'AGUARDANDO';
  if (s === 'scheduled') return 'PENDENTE';
  if (s === 'confirmed') return 'CHECKED_IN';
  if (s === 'no_show') return 'NO_SHOW';
  if (s === 'concluded' || s === 'completed') return 'CONCLUIDA';
  return 'AGUARDANDO';
}

/**
 * Maps application uppercase status to database lowercase status.
 */
export function mapStatusToDb(status: AppointmentStatus | string): string {
  const s = (status || '').toUpperCase();
  if (s === 'AGUARDANDO') return 'pending';
  if (s === 'PENDENTE') return 'scheduled';
  if (s === 'CHECKED_IN') return 'confirmed';
  if (s === 'NO_SHOW') return 'no_show';
  if (s === 'CONCLUIDA') return 'confirmed'; // fallback to confirmed
  return 'pending';
}

/**
 * Parses appointment date and time strings into a standard Date object.
 * Handles formats like 'Hoje', 'Amanhã', 'Dia X', 'X', 'YYYY-MM-DD', 'DD/MM/YYYY'.
 */
export function parseAppointmentDateTime(dateStr: string, timeStr: string): Date {
  const classDate = new Date();
  const cleanDate = dateStr.trim().toLowerCase();

  if (cleanDate.includes('hoje')) {
    // keep today's date
  } else if (cleanDate.includes('amanhã')) {
    classDate.setDate(classDate.getDate() + 1);
  } else if (cleanDate.startsWith('dia ') || /^\d+$/.test(cleanDate)) {
    const dayNum = parseInt(cleanDate.replace('dia ', ''), 10);
    if (!isNaN(dayNum)) {
      classDate.setDate(dayNum);
    }
  } else if (cleanDate.includes('/')) {
    const parts = cleanDate.split('/');
    if (parts.length === 3) {
      classDate.setFullYear(parseInt(parts[2], 10));
      classDate.setMonth(parseInt(parts[1], 10) - 1);
      classDate.setDate(parseInt(parts[0], 10));
    }
  } else if (cleanDate.includes('-')) {
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      classDate.setFullYear(parseInt(parts[0], 10));
      classDate.setMonth(parseInt(parts[1], 10) - 1);
      classDate.setDate(parseInt(parts[2], 10));
    }
  }

  const timeParts = timeStr.split(':');
  classDate.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
  return classDate;
}

/**
 * Automatically sets an appointment status to 'no_show' in Supabase.
 */
export async function markAsNoShow(appointmentId: string): Promise<void> {
  const { data: apt, error: fetchError } = await supabase
    .from('appointments')
    .select(`
      student_id,
      trainer_id,
      student:student_id ( profile:profiles!students_profile_id_fkey ( name ) )
    `)
    .eq('id', appointmentId)
    .single();

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'no_show' })
    .eq('id', appointmentId);
  if (error) throw error;

  if (apt && !fetchError) {
    const student = apt.student as any;
    const studentProfile = Array.isArray(student) ? student[0]?.profile : student?.profile;
    const studentName = studentProfile?.name || 'Aluno';
    import('./notificationService').then(service => {
      service.createNoShowNotification(
        apt.student_id,
        apt.trainer_id,
        studentName,
        appointmentId
);
    });
  }
}

/**
 * Performs a check-in for a given appointment, updating its status to 'confirmed' (mapped to CHECKED_IN)
 * and setting checked_in_at to the current date and time.
 */
export async function checkInAppointment(appointmentId: string): Promise<any> {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'confirmed',
      checked_in_at: new Date().toISOString()
    })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Manually marks a checked-in appointment as completed.
 */
export async function markAsCompleted(appointmentId: string): Promise<any> {
  // 1. Fetch the appointment to verify its date and time
  const { data: apt, error: fetchError } = await supabase
    .from('appointments')
    .select('date, time')
    .eq('id', appointmentId)
    .single();

  if (fetchError) throw fetchError;
  if (!apt) throw new Error('Agendamento não encontrado');

  const aptDate = parseAppointmentDateTime(apt.date, apt.time);
  const now = new Date();

  // 2. Prevent finishing the workout before its start time
  if (now.getTime() < aptDate.getTime()) {
    throw new Error('TOO_EARLY');
  }

  // 3. Mark as completed
  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'completed'
    })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetches the next active appointment for the student based on:
 * - Status !== 'CONCLUIDA' and Status !== 'NO_SHOW' (after database value mapping)
 * - Date/time closest to current time
 *
 * It also performs the automatic verification for No-Show:
 * - If mapped status is 'PENDENTE' and time left is less than 2 hours,
 *   it updates the status to 'no_show' in Supabase and filters it out.
 * - If mapped status is 'CHECKED_IN' and it's been more than 4 hours past start,
 *   it updates the status to 'concluded' in Supabase and filters it out.
 */
export async function getNextAppointment(studentId: string): Promise<any | null> {
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      student_id,
      trainer_id,
      date,
      time,
      status,
      checked_in_at,
      created_at,
      trainer:trainer_id (
        username,
        profile:profiles (
          name,
          avatar_url
        )
      )
    `)
    .eq('student_id', studentId);

  if (error) throw error;
  if (!appointments || appointments.length === 0) return null;

  const now = new Date();

  // Process automatic No-Show check for scheduled (trainer-confirmed) appointments only.
  // AGUARDANDO appointments (pending trainer confirmation) are not subject to auto no-show.
  for (const apt of appointments) {
    const statusMapped = mapStatusFromDb(apt.status);
    if (statusMapped === 'PENDENTE') {
      const aptDate = parseAppointmentDateTime(apt.date, apt.time);
      const diffHours = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours < 2) {
        try {
          await markAsNoShow(apt.id);
          apt.status = 'no_show';
        } catch (err) {
        }
      }
    } else if (statusMapped === 'CHECKED_IN') {
      const aptDate = parseAppointmentDateTime(apt.date, apt.time);
      const diffHours = (now.getTime() - aptDate.getTime()) / (1000 * 60 * 60);
      // Auto-complete if checked in and 4+ hours past start
      if (diffHours >= 4) {
        try {
          await markAsCompleted(apt.id);
          apt.status = 'completed';
        } catch (err) {
        }
      }
    }
  }

  // Filter valid next appointments (not CONCLUIDA, not NO_SHOW)
  // Also filter out old CHECKED_IN appointments that happened more than 4 hours ago
  // so the user sees the actual next upcoming appointment.
  const validAppointments = appointments.filter((apt) => {
    const statusMapped = mapStatusFromDb(apt.status);
    if (statusMapped === 'CONCLUIDA' || statusMapped === 'NO_SHOW') return false;
    
    const aptDate = parseAppointmentDateTime(apt.date, apt.time);
    const diffHours = (now.getTime() - aptDate.getTime()) / (1000 * 60 * 60);
    
    // If it's more than 4 hours in the past, don't consider it the "next" appointment.
    if (diffHours > 4) {
      return false;
    }
    
    return true;
  });

  if (validAppointments.length === 0) return null;

  // Map and sort by closest date/time going forward
  const sorted = validAppointments.map((apt) => {
    const aptDate = parseAppointmentDateTime(apt.date, apt.time);
    return {
      ...apt,
      status: mapStatusFromDb(apt.status), // expose as mapped application status
      parsedDate: aptDate,
    };
  });

  // Sort ascending by date so the earliest upcoming class is first
  sorted.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  return sorted[0];
}

/**
 * Reschedules an existing appointment by updating its date and time.
 * Frees the old slot and marks the new slot as booked.
 * This is an atomic UPDATE — no new appointment is created, preventing duplication.
 */
export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string,
  newSlotId: string,
): Promise<void> {
  // 1. Fetch old appointment to know which slot to free
  const { data: oldApt, error: fetchError } = await supabase
    .from('appointments')
    .select(`
      trainer_id, 
      date, 
      time, 
      student_id,
      student:student_id ( profile:profiles!students_profile_id_fkey ( name ) )
    `)
    .eq('id', appointmentId)
    .single();

  if (fetchError) throw fetchError;

  // 2. Free the old slot
  if (oldApt) {
    await supabase
      .from('available_slots')
      .update({ is_booked: false })
      .eq('trainer_id', oldApt.trainer_id)
      .eq('date', oldApt.date)
      .eq('time', oldApt.time);
  }

  // 3. Update the appointment with new date/time (atomic UPDATE, no duplication)
  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      date: newDate,
      time: newTime,
      status: 'pending',
      checked_in_at: null,
    })
    .eq('id', appointmentId);

  if (updateError) throw updateError;

  // 4. Mark the new slot as booked
  const { error: slotError } = await supabase
    .from('available_slots')
    .update({ is_booked: true })
    .eq('id', newSlotId);

  if (slotError) {
  }

  // 5. Create notification
  if (oldApt) {
    const student = oldApt.student as any;
    const studentProfile = Array.isArray(student) ? student[0]?.profile : student?.profile;
    const studentName = studentProfile?.name || 'Aluno';
    import('./notificationService').then(service => {
      service.createRescheduleNotification(
        oldApt.student_id,
        oldApt.trainer_id,
        studentName,
        newDate,
        newTime,
        appointmentId
);
    });
  }
}

/**
 * Subscribes to appointments table changes in realtime.
 */
export function subscribeToAppointments(
  filterField: 'student_id' | 'trainer_id',
  filterValue: string,
  callback: () => void
) {
  return supabase
    .channel(`appointments-realtime-sub-${filterField}-${filterValue}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `${filterField}=eq.${filterValue}`
      },
      () => {
        callback();
      }
    )
    .subscribe();
}
