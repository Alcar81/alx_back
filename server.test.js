const express = require("express");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.SERVER_PORT || 7001;

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(PORT, () => {
  logger.info(`✅ Serveur de test lancé sur le port ${PORT}`);
});
