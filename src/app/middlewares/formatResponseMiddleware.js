import { formatDateFieldsInObject } from '../utils/dateUtils.js';

const toPlainObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (obj.toJSON) return obj.toJSON();
  if (Array.isArray(obj)) return obj.map(toPlainObject);
  return obj;
};

export default (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    const plain = toPlainObject(data);
    const formatted = formatDateFieldsInObject(plain);
    return originalJson.call(this, formatted);
  };

  next();
};
