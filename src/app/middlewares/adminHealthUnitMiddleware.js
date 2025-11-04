export async function checkHealthUnitAccess(req, res, next) {
  const user = req.currentUser;
  const { health_unit_id } = req.body || req.query || req.params;

  if (user.user_type !== 'admin') {
    return next();
  }

  if (!user.health_unit_id) {
    return next();
  }

  if (req.path.includes('/health_units') && (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE')) {
    return res.status(403).json({
      error: 'Acesso negado',
      details: 'Apenas super administradores podem criar, editar ou deletar unidades de saúde',
    });
  }

  if (health_unit_id && parseInt(health_unit_id) !== user.health_unit_id) {
    return res.status(403).json({
      error: 'Acesso negado',
      details: 'Você só tem acesso à sua unidade de saúde atribuída',
    });
  }

  if (!health_unit_id && user.health_unit_id) {
    req.userHealthUnitId = user.health_unit_id;
  }

  next();
}

export default checkHealthUnitAccess;
