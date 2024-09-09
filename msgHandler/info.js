const bot = require("../bot");

const infoMsg = (options, commands) => {
  let helpText = `Список доступных команд: \n`;
  helpText += commands
    .map((command) => `${command.command} - ${command.description}`)
    .join(`\n`);
  return bot.sendMessage(options.chatId, helpText);
};

module.exports = infoMsg;
