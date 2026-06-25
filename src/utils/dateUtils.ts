/**
 * Utilitários centralizados para manipulação de datas e horas no app.
 */

export const getFriendlyDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
      if (dateStr.toLowerCase() === 'hoje') return 'Hoje';
      if (dateStr.toLowerCase() === 'amanhã') return 'Amanhã';
      return dateStr;
    }
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const isToday = today.getFullYear() === date.getFullYear() && today.getMonth() === date.getMonth() && today.getDate() === date.getDate();
    const isTomorrow = tomorrow.getFullYear() === date.getFullYear() && tomorrow.getMonth() === date.getMonth() && tomorrow.getDate() === date.getDate();
    
    const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weekdayName = weekdays[date.getDay()];
    const formattedDate = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`;
    
    if (isToday) return `Hoje (${formattedDate})`;
    if (isTomorrow) return `Amanhã (${formattedDate})`;
    return `${weekdayName}, ${formattedDate}`;
  } catch (e) {
    return dateStr;
  }
};

export const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
};

export const isTodayStr = (dateStr: string): boolean => {
  if (!dateStr) return false;
  if (dateStr.toLowerCase() === 'hoje') return true;
  if (dateStr.toLowerCase() === 'amanhã') return false;
  
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const aptDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      aptDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime();
    }
  } catch (e) {
    return false;
  }
  return false;
};

export const parseDateFromString = (dateStr: string, timeStr?: string): Date => {
  const classDate = new Date();
  const cleanDate = (dateStr || '').trim().toLowerCase();

  if (cleanDate.includes('hoje')) {
    // keep today's date
  } else if (cleanDate.includes('amanhã')) {
    classDate.setDate(classDate.getDate() + 1);
  } else if (cleanDate.startsWith('dia ') || /^\\d+$/.test(cleanDate)) {
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

  if (timeStr) {
    const timeParts = timeStr.split(':');
    if (timeParts.length >= 2) {
      classDate.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
    }
  }

  return classDate;
};
