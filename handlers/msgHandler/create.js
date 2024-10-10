const bot = require("../../bot");
const {
  cancelOptions,
  descOptions,
  listOptions,
} = require("../../helpers/options");

const create = async (user, options) => {
  if (user.state === 1) {
    user.state = 2;
    await user.save();

    return bot.sendMessage(
      options.chatId,
      `Введите название напоминания`,
      cancelOptions()
    );
  }
};

module.exports = create;
