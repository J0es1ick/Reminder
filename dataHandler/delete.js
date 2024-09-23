const bot = require("../bot");
const generateReminderMessage = require("../generateReminderMessage");

const deleteBtn = async (options, reminders, startIndex, endIndex, data) => {
  const { helpText, keyboard } = generateReminderMessage(
    options.chatId,
    reminders,
    startIndex,
    endIndex,
    data
  );

  const optionsForBtn = {
    chat_id: options.chatId,
    message_id: options.message_id,
    reply_markup: JSON.stringify({
      ...keyboard,
    }),
  };

  bot.editMessageText(helpText, optionsForBtn);
};

module.exports = deleteBtn;
