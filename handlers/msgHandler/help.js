const bot = require("../../bot");

const helpMsg = (chatId) => {
  return bot.sendMessage(
    chatId,
    "По любым вопросам можете связаться с автором бота",
    {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "Связь с автором", url: "https://t.me/Debilchik89" }],
        ],
      }),
    }
  );
};

module.exports = helpMsg;
