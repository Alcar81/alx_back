// C:\projetChatGPT\backend\models\User.js

'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { isEmail } = require('validator');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
    }
  }

  User.init({
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 30],
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 30],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 100],
      },
    },
  }, {
    sequelize,
    modelName: 'User',
  });

  // Hachage du mot de passe avant la création
  User.beforeCreate(async (user) => {
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  });

  // Validation de l'email
  User.beforeValidate((user) => {
    if (!isEmail(user.email)) {
      throw new Error('Email invalide.');
    }
  });

  // Méthode pour comparer le mot de passe
  User.prototype.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  return User;
};
