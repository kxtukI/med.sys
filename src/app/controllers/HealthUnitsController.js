import { Op } from 'sequelize';
import * as Yup from 'yup';
import HealthUnit from '../models/HealthUnits.js';
import Patient from '../models/Patients.js';
import User from '../models/Users.js';
import { calculateDistance, geocodeAddress } from '../utils/geolocationUtils.js';

class HealthUnitsController {
  async index(req, res) {
    const { name, city, state, latitude, longitude, zip_code, address } = req.query;
    const { limit, offset } = req.pagination;

    const where = {};
    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (state) where.state = { [Op.iLike]: `%${state}%` };

    let userLat = null;
    let userLon = null;

    if (latitude && longitude) {
      userLat = parseFloat(latitude);
      userLon = parseFloat(longitude);
    }
    else if (req.userId) {
      try {
        const user = await User.findByPk(req.userId);
        if (user && user.user_type === 'patient') {
          const patient = await Patient.findOne({ where: { user_id: user.id } });
          if (patient) {
            if (patient.zip_code) {
              const coords = await geocodeAddress(null, null, null, patient.zip_code);
              if (coords) {
                userLat = coords.latitude;
                userLon = coords.longitude;
              }
            } else if (patient.address && patient.city && patient.state) {
              const coords = await geocodeAddress(patient.address, patient.city, patient.state, null);
              if (coords) {
                userLat = coords.latitude;
                userLon = coords.longitude;
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar localização do paciente:', error);
      }
    }
    
    if (!userLat || !userLon) {
      if (zip_code) {
        const coords = await geocodeAddress(null, null, null, zip_code);
        if (coords) {
          userLat = coords.latitude;
          userLon = coords.longitude;
        }
      } else if (address && city && state) {
        const coords = await geocodeAddress(address, city, state, null);
        if (coords) {
          userLat = coords.latitude;
          userLon = coords.longitude;
        }
      }
    }

    const data = await HealthUnit.findAndCountAll({
      where,
      limit,
      offset,
      attributes: ['id', 'name', 'address', 'city', 'state', 'zip_code', 'phone', 'working_hours', 'photo_url', 'latitude', 'longitude'],
    });

    let unitsWithDistance = data.rows.map((unit) => {
      const unitData = unit.toJSON();
      
      if (userLat !== null && userLon !== null && unit.latitude !== null && unit.longitude !== null) {
        try {
          const distance = calculateDistance(
            userLat,
            userLon,
            parseFloat(unit.latitude),
            parseFloat(unit.longitude)
          );
          unitData.distance_km = distance.distanceKm;
          unitData.distance_meters = distance.distanceMeters;
          unitData.has_distance = true;
        } catch (error) {
          unitData.distance_km = null;
          unitData.distance_meters = null;
          unitData.has_distance = false;
        }
      } else {
        unitData.distance_km = null;
        unitData.distance_meters = null;
        unitData.has_distance = false;
      }

      return unitData;
    });

    if (userLat !== null && userLon !== null) {
      unitsWithDistance.sort((a, b) => {
        if (a.has_distance && b.has_distance) {
          return a.distance_km - b.distance_km;
        }
        if (a.has_distance && !b.has_distance) {
          return -1;
        }
        if (!a.has_distance && b.has_distance) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });
    } else {
      unitsWithDistance.sort((a, b) => a.name.localeCompare(b.name));
    }

    return res.json({
      data: unitsWithDistance,
      total: data.count,
      limit,
      page: offset / limit + 1,
      pages: Math.ceil(data.count / limit),
    });
  }

  async show(req, res) {
    const { id } = req.params;
    const healthUnit = await HealthUnit.findByPk(id);
    if (!healthUnit) {
      return res.status(404).json({ error: 'Unidade de Saúde não encontrada' });
    }
    return res.json({ healthUnit });
  }

  async create(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required('Nome é obrigatório'),
      address: Yup.string().required('Endereço é obrigatório'),
      city: Yup.string().required('Cidade é obrigatória'),
      state: Yup.string().required('Estado é obrigatório').length(2, 'A sigla do estado  deve ter 2 caracteres'),
      zip_code: Yup.string().required('CEP é obrigatório').matches(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
      phone: Yup.string().nullable().matches(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
      working_hours: Yup.string().nullable(),
      latitude: Yup.number()
        .nullable()
        .min(-90, 'Latitude deve estar entre -90 e 90')
        .max(90, 'Latitude deve estar entre -90 e 90')
        .test('requires-longitude', 'Longitude é obrigatória quando latitude é fornecida', function (value) {
          const { longitude } = this.parent;
          if (value !== null && value !== undefined) {
            return longitude !== null && longitude !== undefined;
          }
          return true;
        }),
      longitude: Yup.number()
        .nullable()
        .min(-180, 'Longitude deve estar entre -180 e 180')
        .max(180, 'Longitude deve estar entre -180 e 180')
        .test('requires-latitude', 'Latitude é obrigatória quando longitude é fornecida', function (value) {
          const { latitude } = this.parent;
          if (value !== null && value !== undefined) {
            return latitude !== null && latitude !== undefined;
          }
          return true;
        }),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const healthUnitData = { ...req.body };

    if (req.file && req.file.cloudinaryUrl) {
      healthUnitData.photo_url = req.file.cloudinaryUrl;
    }

    const healthUnit = await HealthUnit.create(healthUnitData);

    return res.json({ healthUnit });
  }


  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().optional(),
      address: Yup.string().optional(),
      city: Yup.string().optional(),
      state: Yup.string().optional().length(2, 'A sigla do estado deve ter 2 caracteres'),
      zip_code: Yup.string().optional().matches(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
      phone: Yup.string().optional().matches(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
      working_hours: Yup.string().optional(),
      latitude: Yup.number()
        .nullable()
        .optional()
        .min(-90, 'Latitude deve estar entre -90 e 90')
        .max(90, 'Latitude deve estar entre -90 e 90')
        .test('requires-longitude', 'Longitude é obrigatória quando latitude é fornecida', function (value) {
          const { longitude } = this.parent;
          if (value !== null && value !== undefined) {
            return longitude !== null && longitude !== undefined;
          }
          return true;
        }),
      longitude: Yup.number()
        .nullable()
        .optional()
        .min(-180, 'Longitude deve estar entre -180 e 180')
        .max(180, 'Longitude deve estar entre -180 e 180')
        .test('requires-latitude', 'Latitude é obrigatória quando longitude é fornecida', function (value) {
          const { latitude } = this.parent;
          if (value !== null && value !== undefined) {
            return latitude !== null && latitude !== undefined;
          }
          return true;
        }),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { id } = req.params;
    const healthUnit = await HealthUnit.findByPk(id);
    if (!healthUnit) {
      return res.status(404).json({ error: 'Unidade de Saúde não encontrada' });
    }

    const updateData = { ...req.body };

    if (req.file && req.file.cloudinaryUrl) {
      updateData.photo_url = req.file.cloudinaryUrl;
    }

    await healthUnit.update(updateData);
    return res.json({ healthUnit });
  }

  async delete(req, res) {
    const { id } = req.params;
    const healthUnit = await HealthUnit.findByPk(id);
    if (!healthUnit) {
      return res.status(404).json({ error: 'Unidade de Saúde não encontrada' });
    }
    await healthUnit.destroy();
    return res.json({ message: 'Unidade de Saúde removida com sucesso' });
  }
}

export default new HealthUnitsController();
