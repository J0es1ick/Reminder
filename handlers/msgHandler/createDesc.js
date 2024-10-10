const bot = require("../../bot");
const {
  cancelOptions,
  descOptions,
  listOptions,
} = require("../../helpers/options");

const createDesc = async (user, commands, options, reminder, text) => {
  if (user.state === 3) {
    let callbackText = commands.map((commands) => commands.command);
    for (let i = 0; i < callbackText.length; i++) {
      if (text === callbackText[i] || text == undefined) {
        return bot.sendMessage(
          options.chatId,
          "Такое описание не поддерживается, попробуйте снова",
          cancelOptions()
        );
      }
    }

    reminder.description = text;
    user.state = 4;
    await user.save();

    return bot.sendMessage(options.chatId, "Введите дату", cancelOptions());
  }
};

module.exports = createDesc;
