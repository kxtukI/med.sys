export const formatDateToDateOnly = (dateString) => {
  if (!dateString) return null;
  
  const [day, month, year] = dateString.split('/');
  if (!day || !month || !year) return dateString;
  
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? dateString : date.toISOString().split('T')[0];
};

export const isValidDateFormat = (dateString) => {
  try {
    formatDateToDateOnly(dateString);
    return true;
  } catch {
    return false;
  }
};

export const formatDateOnlyToDisplay = (dateInput) => {
  if (!dateInput) return null;
  
  let dateString;
  
  if (dateInput instanceof Date) {
    dateString = dateInput.toISOString().split('T')[0];
  } else if (typeof dateInput === 'string') {
    dateString = dateInput;
  } else {
    return null;
  }
  
  if (!dateString.match(/^\d{4}-\d{2}-\d{2}/)) return dateString;
  
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export const formatDateTimeToDisplay = (dateInput) => {
  if (!dateInput) return null;

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return null;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const formatDateFieldsInObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(formatDateFieldsInObject);

  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (key.endsWith('_at') || key.endsWith('_time') || key === 'registration_date') {
      result[key] = formatDateTimeToDisplay(value);
    } else if ((key.endsWith('_date') || key === 'birth_date') && !key.includes('_date_time')) {
      result[key] = formatDateOnlyToDisplay(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = formatDateFieldsInObject(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
};

export const isWithinWorkingHours = (workingHours, appointmentDateTime) => {
  if (!workingHours || !workingHours.trim()) {
    return { isValid: true };
  }

  if (!appointmentDateTime || !(appointmentDateTime instanceof Date) || isNaN(appointmentDateTime.getTime())) {
    return { isValid: false, message: 'Data e hora do agendamento inválidas' };
  }

  const timePattern = /(\d{1,2}):(\d{2})\s*[-ààs]\s*(\d{1,2}):(\d{2})/i;
  const match = workingHours.match(timePattern);

  if (!match) {
    return { isValid: true };
  }

  const startHour = parseInt(match[1], 10);
  const startMinute = parseInt(match[2], 10);
  const endHour = parseInt(match[3], 10);
  const endMinute = parseInt(match[4], 10);

  if (startHour < 0 || startHour > 23 || startMinute < 0 || startMinute > 59 ||
      endHour < 0 || endHour > 23 || endMinute < 0 || endMinute > 59) {
    return { isValid: true };
  }

  const appointmentHour = appointmentDateTime.getHours();
  const appointmentMinute = appointmentDateTime.getMinutes();

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const appointmentMinutes = appointmentHour * 60 + appointmentMinute;

  if (appointmentMinutes >= startMinutes && appointmentMinutes <= endMinutes) {
    return { isValid: true };
  }

  const startTimeStr = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
  const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

  return {
    isValid: false,
    message: `O agendamento deve ser feito entre ${startTimeStr} e ${endTimeStr}`
  };
}; 