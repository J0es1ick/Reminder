const bot = require("../../bot");

const weatherMsg = async (chatId, user) => {
  user.state = 5;
  await user.save();

  return bot.sendMessage(chatId, "Введите название города");
};

module.exports = weatherMsg;
