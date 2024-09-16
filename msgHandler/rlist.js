const bot = require("../bot");
const ReminderModel = require("../models/Reminder");
const generateReminderMessage = require("../generateReminderMessage");

const rlistMsg = async (user, chatId) => {
  const reminders = await ReminderModel.findAll({
    where: {
      userId: user.id,
    },
  });

  if (reminders.length === 0) {
    return bot.sendMessage(chatId, "У вас ещё нет ни одного напоминания");
  } else {
    let startIndex = 0;
    let endIndex = 10;
    const { helpText, keyboard } = generateReminderMessage(
      chatId,
      reminders,
      startIndex,
      endIndex
    );

    return bot.sendMessage(chatId, helpText, {
      reply_markup: keyboard,
    });
  }
};

module.exports = rlistMsg;
