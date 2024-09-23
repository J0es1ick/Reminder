const bot = require("../bot");
const generateReminderMessage = require("../generateReminderMessage");
const ReminderModel = require("../models/Reminder");
const UserModel = require("../models/User");

const deleteRem = async (
  data,
  user,
  options,
  startIndex,
  endIndex,
  reminders
) => {
  const reminderIndex = parseInt(data.split("_")[1]);
  const reminderToDelete = reminders[reminderIndex];

  if (reminderToDelete) {
    await ReminderModel.destroy({ where: { id: reminderToDelete.id } });

    const updatedReminders = await ReminderModel.findAll({
      where: { userId: user.id },
    });

    const { helpText, keyboard } = generateReminderMessage(
      options.chatId,
      updatedReminders,
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
  }
};

module.exports = deleteRem;
