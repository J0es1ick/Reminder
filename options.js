const cancelOptions = () => {
  return {
    reply_markup: JSON.stringify({
      inline_keyboard: [[{ text: "Отменить", callback_data: "/back" }]],
    }),
  };
};
const descOptions = () => {
  return {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: "Пропустить", callback_data: "/skip" }],
        [{ text: "Отменить", callback_data: "/back" }],
      ],
    }),
  };
};
const listOptions = (startIndex, endIndex, reminders) => {
  return {
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
};

module.exports = { cancelOptions, descOptions, listOptions };
