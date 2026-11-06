function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ detail: err.message || 'Eroare internă server' });
}

module.exports = errorHandler;
