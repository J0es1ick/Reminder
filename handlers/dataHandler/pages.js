const bot = require("../../bot");
const generateReminderMessage = require("../../helpers/generateReminderMessage");

const pages = (data, startIndex, endIndex, reminders, options) => {
  const action = data.split(":")[0];
  const index = parseInt(data.split(":")[1]);

  if (action === "prev") {
    startIndex = Math.max(0, index - 10);
    endIndex = index;
  } else if (action === "next") {
    startIndex = index;
    endIndex = Math.min(reminders.length, index + 10);
  }

  const { helpText, keyboard } = generateReminderMessage(
    options.chatId,
    reminders,
    startIndex,
    endIndex
  );

  bot.editMessageText(helpText, {
    chat_id: options.chatId,
    message_id: options.message_id,
    reply_markup: keyboard,
  });

  return [startIndex, endIndex];
};

module.exports = pages;
