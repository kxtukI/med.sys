export const maskCpf = (cpf) => {
  if (!cpf) return '';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
};

export const maskSus = (susNumber) => {
  if (!susNumber) return '';
  return susNumber
    .replace(/\D/g, '') 
    .replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4')
    .replace(/(\d{3}) (\d{4}) (\d{4}) (\d{4})/, '$1 **** **** $4');
};