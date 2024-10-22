const bot = require("./bot");
const associations = require("./models/assotiations");
const sequelize = require("./db");
const { handleMessage, handleCallbackQuery } = require("./handlers/handlers");

associations.func();

const commands = [
  { command: "/start", description: "Начальное приветствие" },
  {
    command: "/info",
    description: "Получить информацию обо всех доступных командах",
  },
  { command: "/create", description: "Создать напоминание" },
  { command: "/id", description: "Узнать свой айди" },
  { command: "/rlist", description: "Узнать все свои напоминания" },
  { command: "/help", description: "Обратная связь с автором" },
  { command: "/weather", description: "Узнать погоду" },
];

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  bot.setMyCommands(commands);

  bot.on("message", (msg) => {
    handleMessage(msg, bot, commands);
  });

  bot.on("callback_query", (msg) => {
    handleCallbackQuery(msg);
  });
};

start();
