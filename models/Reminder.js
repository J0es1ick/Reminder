const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../db");

const ReminderModel = sequelize.define("reminder", {
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = ReminderModel;
