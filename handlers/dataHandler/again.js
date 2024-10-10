const bot = require("../../bot");
const UserModel = require("../../models/User");

const again = async (user, options) => {
  user.state = 2;
  await user.save();

  return bot.editMessageText(`Введите название напоминания`, {
    chat_id: options.chatId,
    message_id: options.message_id,
    reply_markup: JSON.stringify({
      inline_keyboard: [[{ text: "Отменить", callback_data: "/back" }]],
    }),
  });
};

module.exports = again;
