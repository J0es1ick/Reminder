const bot = require("../bot");

const startMsg = (chatId) => {
  return bot.sendMessage(
    chatId,
    `Добро пожаловать в телеграм бот Reminder, напишите /create для создания напоминания`
  );
};

module.exports = startMsg;
