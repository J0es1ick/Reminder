const util = require("util");
const TelegramBot = require("node-telegram-bot-api");
const schedule = require("node-schedule");

const token = "7280997507:AAFqm189AJXhDKWVtRdcB51sEbq9BrGQEUo";

const bot = new TelegramBot(token, { polling: true });
const statesByChatId = [];
const remindersByChatId = [];

const commands = [
  { command: "/start", description: "Начальное приветствие" },
  {
    command: "/info",
    description: "Получить информацию обо всех доступных командах",
  },
  { command: "/create", description: "Создать напоминание" },
  { command: "/love", description: "?" },
];

const start = () => {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
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

    console.log(util.inspect(remindersByChatId, false, null, true));
    console.log(util.inspect(statesByChatId, false, null, true));

    if (text === "/start") {
      return bot.sendMessage(
        chatId,
        "Добро пожаловать в телеграм бот-напоминалку, напишите /create для создания напоминания"
      );
    }

    if (text === "/info") {
      let helpText = `Список доступных команд: \n`;
      helpText += commands
        .map((command) => `${command.command} - ${command.description}`)
        .join(`\n`);
      return bot.sendMessage(chatId, helpText);
    }

    if (text === "/love") {
      return bot.sendMessage(chatId, "Люблю тебя, солнышко!");
    }

    if (text === "/create") {
      if (state.state === 1) {
        state.state = 2;
        return bot.sendMessage(chatId, `Введите название напоминалки`);
      }
    }

    if (state.state === 2) {
      const reminder = remindersByChatId.find((reminder) => {
        if (reminder.chatId === chatId) {
          return true;
        }
      });

      if (reminder === undefined) {
        remindersByChatId.push({
          chatId,
          reminders: [{ title: text }],
        });
      } else {
        reminder.reminders.push({ title: text });
      }
      state.state = 3;

      return bot.sendMessage(chatId, "Введите дату в формате DD-MM-YYYY HH:MM");
    }

    if (state.state === 3) {
      if (
        !text.match(
          /(0[1-9]|[12][0-9]|3[01])(-)(0[1-9]|1[1,2])(-)(19|20)\d{2} ([0-1]?[0-9]|2[0-3]):([0-5][0-9])/g
        )
      ) {
        return bot.sendMessage(
          chatId,
          "Некорректный вывод даты и времени, попробуй ещё раз"
        );
      }

      const reminder = remindersByChatId.find((reminder) => {
        if ((reminder.chatId = chatId)) {
          return true;
        }
      });
      const latestremind = reminder.reminders[reminder.reminders.length - 1];
      latestremind.date = text;

      state.state = 1;
      const data = text.split(" "); // [DD-MM-YYYY, HH:MM]
      const DMY = data[0].split("-"); // [DD, MM, YYYY]
      const time = data[1].split(":"); // [HH, MM]

      const date = new Date(
        DMY[2],
        Number(DMY[1]) - 1,
        DMY[0],
        time[0],
        time[1],
        10
      );

      console.log(date, reminder);

      schedule.scheduleJob(date, function () {
        bot.sendMessage(chatId, latestremind.title);
      });

      return bot.sendMessage(chatId, "Напоминалка создана!");
    }

    return chatId, "Я тебя не понимаю, попробуй команду из списка";
  });
};

start();
