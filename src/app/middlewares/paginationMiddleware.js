const paginationMiddleware = (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  
  req.pagination = {
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  };

  next();
};

export default paginationMiddleware;