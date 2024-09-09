const bot = require("../bot");
const ReminderModel = require("../models/Reminder");

const rlistMsg = async (user, chatId) => {
  const reminders = await ReminderModel.findAll({
    where: {
      userId: user.id,
    },
  });
  let countOfRem = 0;

  if (reminders.length === 0) {
    return bot.sendMessage(chatId, "У вас ещё нет ни одного напоминания");
  } else {
    let helpText = `Список ваших напоминаний: \n`;
    reminders.forEach((reminder, index) => {
      helpText += `${index + 1}. ${
        reminder.title
      } | Дата: ${reminder.date.toLocaleDateString()} в ${reminder.date.toLocaleTimeString()}\n`;
    });

    return bot.sendMessage(chatId, helpText, {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "Удалить по номеру", callback_data: "/delete" }],
        ],
      }),
    });
  }
};

module.exports = rlistMsg;
