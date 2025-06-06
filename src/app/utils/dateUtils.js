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

export const formatDateOnlyToDisplay = (dateOnlyString) => {
  if (!dateOnlyString) return null;
  
  const [year, month, day] = dateOnlyString.split('-');
  return `${day}/${month}/${year}`;
}; 