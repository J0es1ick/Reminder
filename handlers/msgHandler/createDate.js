const schedule = require("node-schedule");
const bot = require("../../bot");
const ReminderModel = require("../../models/Reminder");
const { DateTime } = require("luxon");
const {
  cancelOptions,
  descOptions,
  listOptions,
} = require("../../helpers/options");

const createDate = async (user, options, reminder, text) => {
  if (user.state === 4) {
    if (text === undefined || text.trim() === "") {
      return bot.sendMessage(
        options.chatId,
        "Некорректный ввод даты и времени, попробуйте ещё раз",
        cancelOptions()
      );
    }

    const formats = [
      "d MMMM yyyy H:mm",
      "d MM yyyy H:mm",
      "d/MM/yyyy H:mm",
      "d.MM.yyyy H:mm",
      "d MMMM H:mm",
      "d MM H:mm",
      "H:mm",
      "H mm",
      "H-mm",
    ];

    const locales = ["ru", "en-US"];

    let parsedDate;
    for (const locale of locales) {
      for (const format of formats) {
        parsedDate = DateTime.fromFormat(text, format, { locale });
        if (parsedDate.isValid) {
          break;
        }
      }
      if (parsedDate.isValid) {
        break;
      }
    }

    if (!parsedDate || !parsedDate.isValid) {
      return bot.sendMessage(
        options.chatId,
        "Некорректный формат даты. Пожалуйста, попробуйте другой формат (например, 15-03-2024 10:30, 15 марта 2024 10:30 и т.д.).",
        cancelOptions()
      );
    }

    const now = DateTime.now();

    if (text.match(/^\d{1,2}[:.\s]\d{2}$/)) {
      parsedDate = DateTime.fromObject(
        {
          year: now.year,
          month: now.month,
          day: now.day,
          hour: parsedDate.hour,
          minute: parsedDate.minute,
        },
        { locale: parsedDate.locale }
      );
    }

    if (parsedDate < now) {
      return bot.sendMessage(
        options.chatId,
        "Данная дата уже прошла, попробуйте другую",
        cancelOptions()
      );
    }

    user.state = 1;
    await user.save();
    reminder.date = parsedDate.toJSDate();

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

    schedule.scheduleJob(reminder.date, function () {
      bot.sendMessage(
        options.chatId,
        `Ваше напоминание на ${latestReminder.date.toLocaleDateString()} в ${latestReminder.date.toLocaleTimeString()}:\n\n ${
          latestReminder.title
        } \n ${latestReminder.description ? latestReminder.description : ""}`
      );
      ReminderModel.destroy({
        where: {
          userId: latestReminder.userId,
          title: latestReminder.title,
          date: latestReminder.date,
        },
      });
    });

    return bot.sendMessage(options.chatId, "Напоминание создано!", {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "Создать ещё одно", callback_data: "/again" }],
        ],
      }),
    });
  }
};

module.exports = createDate;
