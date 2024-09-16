function generateReminderMessage(chatId, reminders, startIndex, endIndex) {
  let helpText = `Список ваших напоминаний: \n`;
  for (let i = startIndex; i < endIndex && i < reminders.length; i++) {
    helpText += `${i + 1}. ${reminders[i].title} | Дата: ${reminders[
      i
    ].date.toLocaleDateString()} в ${reminders[i].date.toLocaleTimeString()}\n`;
  }

  const keyboard = {
    inline_keyboard: [
      startIndex > 0
        ? [{ text: "Назад", callback_data: `prev:${startIndex}` }]
        : [],
      endIndex < reminders.length
        ? [{ text: "Вперёд", callback_data: `next:${endIndex}` }]
        : [],
      [{ text: "Удалить по номеру", callback_data: "/delete" }],
    ],
  };

  return { helpText, keyboard };
}

module.exports = generateReminderMessage;
