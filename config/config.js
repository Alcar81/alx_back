require('dotenv').config(); // Charger les variables depuis .env

const config = {
  port: process.env.SERVER_PORT || 3000,
  env: process.env.NODE_ENV || 'dev',
  database: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT_EXT,
    name: process.env.DB_NAME,
    url: `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT_EXT}/${process.env.DB_NAME}`,
  },
  cors: {
    options: {
      origin: process.env.NODE_ENV === 'prod'
        ? ['https://alxmultimedia.com']
        : ['https://dev.alxmultimedia.com', 'http://localhost:3000'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type'],
    },
  },
  jwtSecret: process.env.JWT_SECRET,
};

module.exports = config;
