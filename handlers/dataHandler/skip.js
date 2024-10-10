const bot = require("../../bot");
const UserModel = require("../../models/User");

const skip = async (user, options) => {
  user.state = 4;
  await user.save();

  bot.editMessageText("Введите дату", {
    chat_id: options.chatId,
    message_id: options.message_id,
    reply_markup: JSON.stringify({
      inline_keyboard: [[{ text: "Отменить", callback_data: "/back" }]],
    }),
  });
};

module.exports = skip;
