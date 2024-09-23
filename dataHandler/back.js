const bot = require("../bot");
const UserModel = require("../models/User");

const back = async (user, options) => {
  user.state = 1;
  await user.save();

  bot.editMessageText("Вы отменили действие", {
    chat_id: user.chatId,
    message_id: options.message_id,
  });
};

module.exports = back;
