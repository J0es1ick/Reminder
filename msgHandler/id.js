const bot = require("../bot");

const idMsg = (chatId, tgId) => {
  return bot.sendMessage(chatId, "Это твой айди - " + tgId);
};

module.exports = idMsg;
