const bot = require("../../bot");
const getWeather = require("../../helpers/getWeather");
const {
  cancelOptions,
  descOptions,
  listOptions,
} = require("../../helpers/options");

const weatherInfoMsg = async (chatId, user, text, commands) => {
  if (user.state === 5) {
    let callbackText = commands.map((commands) => commands.command);
    for (let i = 0; i < callbackText.length; i++) {
      if (text === callbackText[i] || text == undefined) {
        return bot.sendMessage(
          chatId,
          "Такое название не поддерживается, попробуйте снова",
          cancelOptions()
        );
      }
    }

    const helpMsg = await getWeather(text);
    if (helpMsg === undefined) {
      return bot.sendMessage(
        chatId,
        "Город не найден (возможны проблемы со стороны апи, попробуйте снова)",
        {
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: "Попробовать снова", callback_data: "/findAgain" }],
            ],
          }),
        }
      );
    }
    user.state = 1;
    await user.save();
    return bot.sendMessage(chatId, helpMsg);
  }
};

module.exports = weatherInfoMsg;
