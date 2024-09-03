const cancelOptions = () => {
  return {
    reply_markup: JSON.stringify({
      inline_keyboard: [[{ text: "Вернуться", callback_data: "/back" }]],
    }),
  };
};
const heplOptions = () => {
  return {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: "Связь с автором", url: "https://t.me/Debilchik89" }],
      ],
    }),
  };
};
const descOptions = () => {
  return {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: "Пропустить", callback_data: "/skip" }],
        [{ text: "Вернуться", callback_data: "/back" }],
      ],
    }),
  };
};
const listOptions = () => {
  return {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [
          { text: ">", callback_data: "/next" },
          { text: ">>", callback_data: "/last" },
        ],
        [{ text: "Удалить по номеру", callback_data: "/delete" }],
      ],
    }),
  };
};

module.exports = { cancelOptions, heplOptions, descOptions, listOptions };
