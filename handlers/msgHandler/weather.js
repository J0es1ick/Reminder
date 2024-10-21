const bot = require("../../bot");
const getWeather = require("../../helpers/getWeather");

const weatherMsg = async (chatId) => {
  const helpMsg = await getWeather();
  return bot.sendMessage(chatId, helpMsg);
};

module.exports = weatherMsg;
