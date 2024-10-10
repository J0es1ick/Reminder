const { cancelOptions, descOptions, listOptions } = require("./options");

function generateReminderMessage(
  chatId,
  reminders,
  startIndex,
  endIndex,
  data = null
) {
  let helpText = `Список ваших напоминаний: \n`;
  let buttons = [];

  for (let i = startIndex; i < endIndex && i < reminders.length; i++) {
    helpText += `${i + 1}. ${reminders[i].title} | Дата: ${reminders[
      i
    ].date.toLocaleDateString()} в ${reminders[i].date.toLocaleTimeString()}\n`;

    buttons.push({
      text: `${i + 1}`,
      callback_data: `/delete_${i}`,
    });
  }

  let keyboard;

  if (!data) {
    keyboard = listOptions(startIndex, endIndex, reminders);
  } else {
    keyboard = {
      inline_keyboard: [
        buttons.slice(0, 5),
        buttons.slice(5, 10),
        [{ text: "Назад", callback_data: "/backTo" }],
      ],
    };
  }
  return { helpText, keyboard };
}

module.exports = generateReminderMessage;
