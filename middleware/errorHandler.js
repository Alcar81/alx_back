// 📌 backend/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  const isJson = req.headers["content-type"] === "application/json";
  const code = err.status || 500;
  const message = err.message || "Erreur interne du serveur";

  console.error(`❌ [${req.method}] ${req.url} - ${message}`);

  if (isJson) {
    res.status(code).json({ error: true, message });
  } else {
    res.status(code).send(`<h1>Erreur ${code}</h1><p>${message}</p>`);
  }
};
