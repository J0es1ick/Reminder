const bot = require("../bot");
const UserModel = require("../models/User");

const skip = async (user, options) => {
  user.state = 4;
  await user.save();

  bot.editMessageText("Введите дату в формате DD-MM-YYYY HH:MM", {
    chat_id: options.chatId,
    message_id: options.message_id,
    reply_markup: JSON.stringify({
      inline_keyboard: [[{ text: "Отменить", callback_data: "/back" }]],
    }),
  });
};

module.exports = skip;
