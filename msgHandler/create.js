const schedule = require("node-schedule");
const bot = require("../bot");
const ReminderModel = require("../models/Reminder");

const cancelOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [[{ text: "Отменить", callback_data: "/back" }]],
  }),
};
const descOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Пропустить", callback_data: "/skip" }],
      [{ text: "Отменить", callback_data: "/back" }],
    ],
  }),
};

const createMsg = async (user, options) => {
  if (user.state === 1) {
    user.state = 2;
    await user.save();

    return bot.sendMessage(
      options.chatId,
      `Введите название напоминания`,
      cancelOptions
    );
  }
};

const createMsg2 = async (user, commands, options, reminder, text) => {
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

    return bot.sendMessage(
      options.chatId,
      "Введите описание (необязательно)",
      descOptions
    );
  }
};

const createMsg3 = async (user, commands, options, reminder, text) => {
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

    return bot.sendMessage(
      options.chatId,
      "Введите дату в формате DD-MM-YYYY HH:MM",
      cancelOptions
    );
  }
};

const createMsg4 = async (user, options, reminder, text) => {
  if (user.state === 4) {
    if (
      text === undefined ||
      !text.match(
        /(0[1-9]|[12][0-9]|3[01])(-)(0[1-9]|1[1,2])(-)(19|20)\d{2} ([0-1]?[0-9]|2[0-3]):([0-5][0-9])/g
      )
    ) {
      return bot.sendMessage(
        options.chatId,
        "Некорректный вывод даты и времени, попробуйте ещё раз",
        cancelOptions
      );
    }

    const data = text.split(" "); // [DD-MM-YYYY, HH:MM]
    const DMY = data[0].split("-"); // [DD, MM, YYYY]
    const time = data[1].split(":"); // [HH, MM]

    const date = new Date(DMY[2], Number(DMY[1]) - 1, DMY[0], time[0], time[1]);

    let now = new Date();

    if (date < now) {
      return bot.sendMessage(
        options.chatId,
        "Данная дата уже прошла, попробуйте другую",
        cancelOptions
      );
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
        } \n ${latestReminder.description}`
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
};

module.exports = { createMsg, createMsg2, createMsg3, createMsg4 };
