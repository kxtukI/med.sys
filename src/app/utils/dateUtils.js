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