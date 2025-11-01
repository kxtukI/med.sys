import { formatDateFieldsInObject } from '../utils/dateUtils.js';

const deepClone = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (obj.toJSON && typeof obj.toJSON === 'function') {
    return deepClone(obj.toJSON());
  }

  if (Array.isArray(obj)) {
    return obj.map(deepClone);
  }

  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deepClone(obj[key]);
    }
  }
  return result;
};

export default (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    const clean = deepClone(data);
    const formatted = formatDateFieldsInObject(clean);
    return originalJson.call(this, formatted);
  };

  next();
};
