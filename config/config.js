// C:\projetChatGPT\backend\config.js

require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DEV,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, // Ajouter cette ligne
    dialect: 'mysql',
  },
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_TEST,
    host: process.env.DB_HOST,
    dialect: 'mysql',
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_PRO,
    host: process.env.DB_HOST,
    dialect: 'mysql',
  },
};
