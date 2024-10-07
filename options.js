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
      endIndex < reminders.length
        ? [{ text: ">>", callback_data: `next:${endIndex}` }]
        : [],
      startIndex > 0
        ? [{ text: "<<", callback_data: `prev:${startIndex}` }]
        : [],
      [{ text: "Удалить по номеру", callback_data: "/delete" }],
    ],
  };
};

module.exports = { cancelOptions, descOptions, listOptions };
