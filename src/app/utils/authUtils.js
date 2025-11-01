import Patient from '../models/Patients.js';
import Professional from '../models/Professionals.js';
import User from '../models/Users.js';

const getResourceId = async (req, model) => {
  if (!req.userId) return null;
  const record = await model.findOne({ where: { user_id: req.userId } });
  return record?.id || null;
};

export const injectUserResourceId = async (req, data, customFieldName = null) => {
  console.log('[injectUserResourceId] Iniciando...', { userId: req.userId, userType: req.currentUser?.user_type });
  
  if (!req.userId) {
    console.log('[injectUserResourceId] Sem userId, retornando data');
    return data;
  }

  let userType = req.currentUser?.user_type;
  if (!userType) {
    console.log('[injectUserResourceId] userType não disponível, buscando User...');
    const user = await User.findByPk(req.userId);
    if (!user) {
      console.log('[injectUserResourceId] User não encontrado');
      return data;
    }
    userType = user.user_type;
    console.log('[injectUserResourceId] User encontrado:', { userId: user.id, userType });
  }
  
  if (userType === 'patient') {
    console.log('[injectUserResourceId] Buscando patient para user_id:', req.userId);
    const patientId = await getResourceId(req, Patient);
    console.log('[injectUserResourceId] Patient encontrado:', patientId);
    if (!patientId) {
      console.log('[injectUserResourceId] Paciente não encontrado, retornando data sem injeção');
      return data;
    }
    console.log('[injectUserResourceId] Injetando patient_id:', patientId);
    return { ...data, patient_id: patientId };
  }

  if (userType === 'professional') {
    console.log('[injectUserResourceId] Buscando professional para user_id:', req.userId);
    const professionalId = await getResourceId(req, Professional);
    if (professionalId) {
      const fieldName = customFieldName || 'professional_id';
      console.log('[injectUserResourceId] Injetando', fieldName, ':', professionalId);
      return { ...data, [fieldName]: professionalId };
    }
  }

  console.log('[injectUserResourceId] Nenhuma injeção realizada');
  return data;
};

export const getPatientIdFromAuth = (req) => 
  getResourceId(req, Patient);

export const getProfessionalIdFromAuth = (req) => 
  getResourceId(req, Professional);
