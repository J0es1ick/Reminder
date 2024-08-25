const User = require("./User");
const Reminder = require("./Reminder");

module.exports.func = function () {
  User.hasMany(Reminder);
  Reminder.belongsTo(User, {
    foreignKey: "userId",
  });
};
