const bot = require("../../bot");
const {
  cancelOptions,
  descOptions,
  listOptions,
} = require("../../helpers/options");

const createTitle = async (user, commands, options, reminder, text) => {
  if (user.state === 2) {
    let callbackText = commands.map((commands) => commands.command);
    for (let i = 0; i < callbackText.length; i++) {
      if (text === callbackText[i] || text == undefined) {
        return bot.sendMessage(
          options.chatId,
          "Такое название не поддерживается, попробуйте снова",
          cancelOptions()
        );
      }
    }

    reminder.userId = user.id;
    reminder.title = text;

    user.state = 3;
    await user.save();

    return bot.sendMessage(
      options.chatId,
      "Введите описание (необязательно)",
      descOptions()
    );
  }
};

module.exports = createTitle;
