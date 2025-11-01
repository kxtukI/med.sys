import { formatDateFieldsInObject } from '../utils/dateUtils.js';

export default (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    return originalJson.call(this, formatDateFieldsInObject(data));
  };

  next();
};
