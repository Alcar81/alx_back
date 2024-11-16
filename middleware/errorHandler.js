// \backend\middleware\errorHandler.js

const errorHandler = (err, req, res, next) => {
    console.error('Erreur :', err.message || err);
    res.status(err.status || 500).json({
      error: true,
      message: err.message || 'Une erreur est survenue.',
    });
  };
  
  module.exports = errorHandler;
  