// C:\projetChatGPT\backend\models\index.js

'use strict';
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config/config'); // Importer le fichier de configuration

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const configData = config[env];
const db = {};

let sequelize;
if (configData.use_env_variable) {
  sequelize = new Sequelize(process.env[configData.use_env_variable], configData);
} else {
  sequelize = new Sequelize(configData.database, configData.username, configData.password, {
    host: configData.host,
    dialect: configData.dialect,
  });
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
