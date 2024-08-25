const util = require("util");
const TelegramBot = require("node-telegram-bot-api");
const schedule = require("node-schedule");
const UserModel = require("./models/User");
const ReminderModel = require("./models/Reminder");
const assotiations = require("./models/assotiations");
const sequelize = require("./db");

const token = "7280997507:AAFqm189AJXhDKWVtRdcB51sEbq9BrGQEUo";
assotiations.func();

const bot = new TelegramBot(token, { polling: true });
const statesByChatId = [];

const commands = [
  { command: "/start", description: "Начальное приветствие" },
  {
    command: "/info",
    description: "Получить информацию обо всех доступных командах",
  },
  { command: "/create", description: "Создать напоминание" },
  { command: "/id", description: "Узнать свой айди" },
];

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  bot.setMyCommands([
    { command: "/start", description: "Начальное приветствие" },
    {
      command: "/info",
      description: "Получить информацию обо всех доступных командах",
    },
    { command: "/create", description: "Создать напоминание" },
    { command: "/id", description: "Узнать свой айди" },
    { command: "/delete", description: "Удалить напоминание" },
  ]);

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const tgId = msg.from.id;
    const text = msg.text;
    let state = statesByChatId.find((val) => {
      if (val.chatId === chatId) {
        return true;
      }
    });
    if (state === undefined) {
      state = { chatId, state: 1 };
      statesByChatId.push(state);
    }

    console.log(util.inspect(statesByChatId, false, null, true));

    let user = await UserModel.findOne({
      where: {
        chatId: chatId,
        tgId: tgId,
      },
      include: [ReminderModel],
    });
    if (user === null) {
      user = await UserModel.create(
        { chatId, tgId },
        { returning: true, include: [ReminderModel] }
      );
    }

    try {
      if (text === "/start") {
        return bot.sendMessage(
          chatId,
          "Добро пожаловать в телеграм бот Reminder, напишите /create для создания напоминания"
        );
      }

      if (text === "/id") {
        return bot.sendMessage(chatId, "Это твой айди - " + tgId);
      }

      if (text === "/info") {
        let helpText = `Список доступных команд: \n`;
        helpText += commands
          .map((command) => `${command.command} - ${command.description}`)
          .join(`\n`);
        return bot.sendMessage(chatId, helpText);
      }

      if (text === "/create") {
        if (state.state === 1) {
          state.state = 2;
          return bot.sendMessage(chatId, `Введите название напоминания`);
        }
      }

      if (state.state === 2) {
        await ReminderModel.create({
          userId: user.id,
          title: text,
        });

        state.state = 3;

        return bot.sendMessage(
          chatId,
          "Введите дату в формате DD-MM-YYYY HH:MM"
        );
      }

      if (state.state === 3) {
        if (
          !text.match(
            /(0[1-9]|[12][0-9]|3[01])(-)(0[1-9]|1[1,2])(-)(19|20)\d{2} ([0-1]?[0-9]|2[0-3]):([0-5][0-9])/g
          )
        ) {
          return bot.sendMessage(
            chatId,
            "Некорректный вывод даты и времени, попробуйте ещё раз"
          );
        }

        state.state = 1;
        const data = text.split(" "); // [DD-MM-YYYY, HH:MM]
        const DMY = data[0].split("-"); // [DD, MM, YYYY]
        const time = data[1].split(":"); // [HH, MM]

        const date = new Date(
          DMY[2],
          Number(DMY[1]) - 1,
          DMY[0],
          time[0],
          time[1]
        );

        const reminder = await ReminderModel.findOne({
          where: {
            userId: user.id,
          },
          order: [["createdAt", "DESC"]],
        });

        reminder.date = date;

        await reminder.save();

        schedule.scheduleJob(date, function () {
          bot.sendMessage(chatId, reminder.title);
          ReminderModel.destroy({
            where: {
              userId: reminder.userId,
              title: reminder.title,
              date: reminder.date,
            },
          });
        });

        return bot.sendMessage(chatId, "Напоминание создано!");
      }

      if (text === "/delete") {
        const reminders = await ReminderModel.findAll({
          where: {
            userId: user.id,
          },
        });
        let helpText = `Список ваших напоминаний: \n`;
        helpText += reminders
          .map((reminders) => `${reminders.title} - ${reminders.date}`)
          .join(`\n`);
        bot.sendMessage(chatId, helpText);
      }

      return chatId, "Я тебя не понимаю, попробуй команду из списка";
    } catch (e) {
      return bot.sendMessage("Произошла ошибка!");
    }
  });
};

start();
