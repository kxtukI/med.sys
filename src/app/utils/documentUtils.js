const cleanNumber = (value) => {
    if (!value) return '';
    return value.replace(/\D/g, '');
  };
  
  const calculateCPFDigit = (cpf, factor) => {
    let sum = 0;
    for (let i = 0; i < cpf.length; i++) {
      sum += parseInt(cpf[i]) * (factor - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 || remainder === 11 ? 0 : remainder;
  };

  export const isValidCPF = (cpf) => {
    const cleanCPF = cleanNumber(cpf);

    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    const firstDigit = calculateCPFDigit(cleanCPF.slice(0, 9), 10);
    if (firstDigit !== parseInt(cleanCPF[9])) return false;

    const secondDigit = calculateCPFDigit(cleanCPF.slice(0, 10), 11);
    if (secondDigit !== parseInt(cleanCPF[10])) return false;
  
    return true;
  };

  