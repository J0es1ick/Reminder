const TelegramBot = require("node-telegram-bot-api");
const schedule = require("node-schedule");
const UserModel = require("./models/User");
const ReminderModel = require("./models/Reminder");
const assotiations = require("./models/assotiations");
const sequelize = require("./db");
const {
  cancelOptions,
  heplOptions,
  descOptions,
  listOptions,
} = require("./options");

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
  { command: "/help", description: "Обратная связь с автором" },
];

const reminder = [];
let currentMessageId;

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
    { command: "/help", description: "Обратная связь с автором" },
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
    const text = msg.text;
    const options = {
      chatId: msg.chat.id,
      tgId: msg.from.id,
      message_id: msg.message_id,
    };

    if (currentMessageId) {
      bot
        .editMessageReplyMarkup(
          {},
          { chat_id: options.chatId, message_id: currentMessageId }
        )
        .catch((err) => {
          console.error("Ошибка при редактировании сообщения:", err);
        });
    }

    let user = await UserModel.findOne({
      where: {
        chatId: options.chatId,
        tgId: options.tgId,
      },
      include: [ReminderModel],
    });
    if (user === null) {
      user = await UserModel.create(
        { chatId: options.chatId, tgId: options.tgId, state: 1 },
        { returning: true, include: [ReminderModel] }
      );
    }

    try {
      if (text === "/create") {
        if (user.state === 1) {
          user.state = 2;
          await user.save();

          return bot
            .sendMessage(
              options.chatId,
              `Введите название напоминания`,
              cancelOptions()
            )
            .then((sendMessage) => {
              currentMessageId = sendMessage.message_id;
            });
        }
      }

      if (user.state === 2) {
        let callbackText = commands.map((commands) => commands.command);
        for (let i = 0; i < callbackText.length; i++) {
          if (text === callbackText[i] || text == undefined) {
            return bot.sendMessage(
              options.chatId,
              "Такое название не поддерживается, попробуйте снова"
            );
          }
        }

        reminder.userId = user.id;
        reminder.title = text;

        user.state = 3;
        await user.save();

        return bot
          .sendMessage(
            options.chatId,
            "Введите описание (необязательно)",
            descOptions()
          )
          .then((sendMessage) => {
            currentMessageId = sendMessage.message_id;
          });
      }

      if (user.state === 3) {
        let callbackText = commands.map((commands) => commands.command);
        for (let i = 0; i < callbackText.length; i++) {
          if (text === callbackText[i] || text == undefined) {
            return bot.sendMessage(
              options.chatId,
              "Такое описание не поддерживается, попробуйте снова"
            );
          }
        }

        reminder.description = text;
        user.state = 4;
        await user.save();

        return bot
          .sendMessage(
            options.chatId,
            "Введите дату в формате DD-MM-YYYY HH:MM",
            cancelOptions()
          )
          .then((sendMessage) => {
            currentMessageId = sendMessage.message_id;
          });
      }

      if (user.state === 4) {
        if (
          text === undefined ||
          !text.match(
            /(0[1-9]|[12][0-9]|3[01])(-)(0[1-9]|1[1,2])(-)(19|20)\d{2} ([0-1]?[0-9]|2[0-3]):([0-5][0-9])/g
          )
        ) {
          return bot
            .sendMessage(
              options.chatId,
              "Некорректный вывод даты и времени, попробуйте ещё раз",
              cancelOptions()
            )
            .then((sendMessage) => {
              currentMessageId = sendMessage.message_id;
            });
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

        if (date < now) {
          return bot
            .sendMessage(
              options.chatId,
              "Данная дата уже прошла, попробуйте другую",
              cancelOptions()
            )
            .then((sendMessage) => {
              currentMessageId = sendMessage.message_id;
            });
        }

        user.state = 1;
        await user.save();

        reminder.date = date;

        let latestReminder = await ReminderModel.create(
          {
            userId: reminder.userId,
            title: reminder.title,
            description: reminder.description,
            date: reminder.date,
          },
          { returning: true }
        );

        reminder.description = null;

        schedule.scheduleJob(date, function () {
          bot.sendMessage(
            options.chatId,
            `Ваше напоминание на ${latestReminder.date.getDate()} ${
              latestReminder.date.getMonth() + 1
            } ${latestReminder.date.getFullYear()} в ${latestReminder.date.getHours()} час. ${latestReminder.date.getMinutes()} мин: \n\n ${
              latestReminder.title
            }`
          );
          ReminderModel.destroy({
            where: {
              userId: latestReminder.userId,
              title: latestReminder.title,
              date: latestReminder.date,
            },
          });
        });

        return bot.sendMessage(options.chatId, "Напоминание создано!");
      }

      if (text === "/start") {
        return bot.sendMessage(
          options.chatId,
          `Добро пожаловать в телеграм бот Reminder, напишите /create для создания напоминания`
        );
      }

      if (text === "/id") {
        return bot.sendMessage(
          options.chatId,
          "Это твой айди - " + options.tgId
        );
      }

      if (text === "/help") {
        return bot.sendMessage(
          options.chatId,
          "По любым вопросам можете связаться с автором бота",
          heplOptions()
        );
      }

      if (text === "/info") {
        let helpText = `Список доступных команд: \n`;
        helpText += commands
          .map((command) => `${command.command} - ${command.description}`)
          .join(`\n`);
        return bot.sendMessage(options.chatId, helpText);
      }

      if (text === "/rlist") {
        const reminders = await ReminderModel.findAll({
          where: {
            userId: user.id,
          },
        });

        if (reminders.length === 0) {
          return bot.sendMessage(
            options.chatId,
            "У вас ещё нет ни одного напоминания"
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
          return bot.sendMessage(options.chatId, helpText, listOptions());
        }
      }

      let callbackText = commands.map((commands) => commands.command);
      for (let i = 0; i < callbackText.length; i++) {
        if (text !== callbackText[i] || text == undefined) {
          return bot.sendMessage(
            options.chatId,
            "Я тебя не понимаю, попробуй команду из списка"
          );
        }
      }
    } catch (e) {
      return bot.sendMessage(options.chatId, "Произошла ошибка!");
    }
  });

  bot.on("callback_query", async (msg) => {
    const options = {
      chatId: msg.message.chat.id,
      message_id: msg.message.message_id,
    };
    const data = msg.data;
    let user = await UserModel.findOne({
      where: {
        chatId: options.chatId,
      },
    });
    if (data === "/back") {
      user.state = 1;
      await user.save();
      bot.editMessageText("Вы отменили действие", {
        chat_id: user.chatId,
        message_id: options.message_id,
      });
    }
    if (data === "/skip") {
      user.state = 4;
      await user.save();
      bot.editMessageText("Введите дату в формате DD-MM-YYYY HH:MM", {
        chat_id: options.chatId,
        message_id: options.message_id,
        reply_markup: JSON.stringify({
          inline_keyboard: [[{ text: "Вернуться", callback_data: "/back" }]],
        }),
      });
    }
  });
};

start();
