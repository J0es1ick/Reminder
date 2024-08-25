const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../db");

const UserModel = sequelize.define("user", {
  id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  chatId: {
    type: DataTypes.BIGINT,
    unique: true,
    allowNull: false,
  },
  tgId: {
    type: DataTypes.BIGINT,
    unique: true,
    allowNull: false,
  },
});

module.exports = UserModel;
