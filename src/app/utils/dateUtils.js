export const formatDateToDateOnly = (dateString) => {
  if (!dateString) {
    throw new Error('Data não fornecida');
  }

  const [day, month, year] = dateString.split('/');
  
  if (!day || !month || !year) {
    throw new Error('Formato de data inválido. Use DD/MM/AAAA');
  }

  const date = new Date(year, month - 1, day);
  
  if (isNaN(date.getTime())) {
    throw new Error('Data inválida');
  }

  return date.toISOString().split('T')[0];
};

export const isValidDateFormat = (dateString) => {
  try {
    formatDateToDateOnly(dateString);
    return true;
  } catch (error) {
    return false;
  }
};

export const formatDateOnlyToDisplay = (dateInput) => {
  if (!dateInput) return null;
  
  let dateString;
  
  if (dateInput instanceof Date) {
    dateString = dateInput.toISOString().split('T')[0];
  }

  else if (typeof dateInput === 'string') {
    dateString = dateInput;
  }
  else {
    dateString = String(dateInput);
  }
  
  if (!dateString.includes('-') || dateString.split('-').length !== 3) {
    return dateString; 
  }
  
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}; 