const bot = require("../bot");
const { cancelOptions, descOptions, listOptions } = require("../options");

const backTo = (startIndex, endIndex, reminders, options) => {
  const keyboard = listOptions(startIndex, endIndex, reminders);
  bot.editMessageReplyMarkup(JSON.stringify(keyboard), {
    chat_id: options.chatId,
    message_id: options.message_id,
  });
};

module.exports = backTo;
