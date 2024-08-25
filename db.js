const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("ReminderDB", "postgres", "12345", {
  host: "localhost",
  dialect: "postgres",
  port: 5000,
});

module.exports = sequelize;
