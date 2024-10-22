const bot = require("../../bot");

const findAgain = async (options, user) => {
  user.state = 5;
  await user.save();

  return bot.editMessageText("Введите название города", {
    chat_id: options.chatId,
    message_id: options.message_id,
  });
};

module.exports = findAgain;
