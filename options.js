const cancelOptions = () => {
  return {
    reply_markup: JSON.stringify({
      inline_keyboard: [[{ text: "Отменить", callback_data: "/back" }]],
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
        [{ text: "Отменить", callback_data: "/back" }],
      ],
    }),
  };
};
const listOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Удалить по номеру", callback_data: "/delete" }],
    ],
  }),
};

module.exports = { cancelOptions, heplOptions, descOptions, listOptions };
