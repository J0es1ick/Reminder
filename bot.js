const TelegramBot = require("node-telegram-bot-api");

const token = "7280997507:AAFqm189AJXhDKWVtRdcB51sEbq9BrGQEUo";
const bot = new TelegramBot(token, { polling: true });

module.exports = bot;
