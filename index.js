const TelegramBot = require("node-telegram-bot-api");
const schedule = require("node-schedule");
const UserModel = require("./models/User");
const ReminderModel = require("./models/Reminder");
const assotiations = require("./models/assotiations");
const sequelize = require("./db");

assotiations.func();

const token = "7280997507:AAFqm189AJXhDKWVtRdcB51sEbq9BrGQEUo";
const bot = new TelegramBot(token, { polling: true });

const commands = [
  { command: "/start", description: "Начальное приветствие" },
  {
    command: "/info",
    description: "Получить информацию обо всех доступных командах",
  },
  { command: "/create", description: "Создать напоминание" },
  { command: "/id", description: "Узнать свой айди" },
  { command: "/rlist", description: "Узнать все свои напоминания" },
  { command: "/cancel", description: "Отменяет выполнение команды" },
];
const reminder = [];
const cancelOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [[{ text: "Вернуться", callback_data: "/cancel" }]],
  }),
};

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
    { command: "/rlist", description: "Узнать все свои напоминания" },
    { command: "/cancel", description: "Отменяет выполнение команды" },
  ]);

  /*  bot.onText(/^\/start$/, function (msg) {
    const opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        keyboard: [["Level 1"]],
      },
    };

    bot.sendMessage(msg.chat.id, "I'm a test robot", opts);
  });
*/

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const tgId = msg.from.id;
    const text = msg.text;
    const msgId = msg.message_id;

    let user = await UserModel.findOne({
      where: {
        chatId: chatId,
        tgId: tgId,
      },
      include: [ReminderModel],
    });
    if (user === null) {
      user = await UserModel.create(
        { chatId: chatId, tgId: tgId, state: 1 },
        { returning: true, include: [ReminderModel] }
      );
    }

    try {
      if (text === "/create") {
        if (user.state === 1) {
          user.state = 2;
          await user.save();
          return bot.sendMessage(
            chatId,
            `Введите название напоминания`,
            cancelOptions
          );
        }
      }

      if (user.state === 2) {
        let callbackText = commands.map((commands) => commands.command);
        for (let i = 0; i < callbackText.length; i++) {
          if (text === callbackText[i] || text == undefined) {
            return bot.sendMessage(
              chatId,
              "Такое название не поддерживается, попробуйте снова"
            );
          }
        }

        reminder.userId = user.id;
        reminder.title = text;

        user.state = 3;
        await user.save();

        return bot.sendMessage(
          chatId,
          "Введите дату в формате DD-MM-YYYY HH:MM",
          cancelOptions
        );
      }

      if (user.state === 3) {
        if (
          text === undefined ||
          !text.match(
            /(0[1-9]|[12][0-9]|3[01])(-)(0[1-9]|1[1,2])(-)(19|20)\d{2} ([0-1]?[0-9]|2[0-3]):([0-5][0-9])/g
          )
        ) {
          return bot.sendMessage(
            chatId,
            "Некорректный вывод даты и времени, попробуйте ещё раз"
          );
        }

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

        let now = new Date();
        now.setHours(0, 0, 0, 0);

        if (date < now) {
          return bot.sendMessage(
            chatId,
            "Данная дата уже прошла, попробуйте другую"
          );
        }

        user.state = 1;
        await user.save();

        reminder.date = date;

        let latestReminder = await ReminderModel.create(
          {
            userId: reminder.userId,
            title: reminder.title,
            date: reminder.date,
          },
          { returning: true }
        );

        schedule.scheduleJob(date, function () {
          bot.sendMessage(chatId, latestReminder.title);
          ReminderModel.destroy({
            where: {
              userId: latestReminder.userId,
              title: latestReminder.title,
              date: latestReminder.date,
            },
          });
        });

        return bot.sendMessage(chatId, "Напоминание создано!");
      }

      if (text === "/start") {
        return bot.sendMessage(
          chatId,
          `Добро пожаловать в телеграм бот Reminder, напишите /create для создания напоминания`
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
        return bot.sendMessage(chatId, helpText, cancelOptions);
      }

      if (text === "/rlist") {
        const reminders = await ReminderModel.findAll({
          where: {
            userId: user.id,
          },
        });

        if (reminders == null) {
          return bot.sendMessage(
            chatId,
            "У вас ещё нет ни одного напоминания",
            cancelOptions
          );
        } else {
          let helpText = `Список ваших напоминаний: \n`;
          helpText += reminders
            .map(
              (reminders) =>
                `Напоминание: ${
                  reminders.title
                } | Дата: ${reminders.date.getDate()} ${
                  reminders.date.getMonth() + 1
                } ${reminders.date.getFullYear()} в ${reminders.date.getHours()} час. ${reminders.date.getMinutes()} мин. (По МСК)`
            )
            .join(`\n`);
          return bot.sendMessage(chatId, helpText, cancelOptions);
        }
      }

      let callbackText = commands.map((commands) => commands.command);
      for (let i = 0; i < callbackText.length; i++) {
        if (text !== callbackText[i] || text == undefined) {
          return bot.sendMessage(
            chatId,
            "Я тебя не понимаю, попробуй команду из списка"
          );
        }
      }
    } catch (e) {
      return bot.sendMessage("Произошла ошибка!");
    }
  });

  bot.on("callback_query", async (msg) => {
    const chatId = msg.message.chat.id;
    const data = msg.data;
    if (data === "/cancel") {
      let user = await UserModel.findOne({
        where: {
          chatId: chatId,
        },
      });
      user.state = 1;
      await user.save();
      return (
        bot.sendMessage(chatId, "Вы отменили действие"),
        console.log(msg.message_id)
      );
    }
  });
};

start();
