const bot = require("./bot");
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
const utils = require("./msgHandler/utils");

assotiations.func();

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

const start = async () => {
  let currentMessageId;
  const reminder = [];

  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

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
      currentMessageId = null;
    }

    let user = await UserModel.findOne({
      where: { chatId: options.chatId, tgId: options.tgId },
      include: [ReminderModel],
    });
    if (!user) {
      user = await UserModel.create(
        { chatId: options.chatId, tgId: options.tgId, state: 1 },
        { returning: true, include: [ReminderModel] }
      );
    }

    try {
      if (user.state >= 2 && user.state <= 4) {
        switch (user.state) {
          case 2:
            return utils
              .createMsg2(user, commands, options, reminder, text)
              .then((sendMessage) => {
                currentMessageId = sendMessage.message_id;
              });
          case 3:
            return utils
              .createMsg3(user, commands, options, reminder, text)
              .then((sendMessage) => {
                currentMessageId = sendMessage.message_id;
              });
          case 4:
            return utils
              .createMsg4(user, options, reminder, text)
              .then((sendMessage) => {
                currentMessageId = sendMessage.message_id;
              });
        }
      }

      switch (text) {
        case "/create":
          return await utils.createMsg(user, options).then((sendMessage) => {
            currentMessageId = sendMessage.message_id;
          });
        case "/start":
          return utils.startMsg(options.chatId);
        case "/rlist":
          return utils.rlistMsg(user, options.chatId);
        case "/id":
          return utils.idMsg(options.chatId, options.tgId);
        case "/help":
          return utils.helpMsg(options.chatId);
        case "/info":
          return utils.infoMsg(options, commands);

        default:
          if (!commands.some((command) => command.command === text)) {
            return bot.sendMessage(
              options.chatId,
              "Я тебя не понимаю, попробуй команду из списка"
            );
          }
      }
    } catch (e) {
      console.error(e);
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
    const reminders = await ReminderModel.findAll({
      where: {
        userId: user.id,
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
    if (data === "/delete") {
      let messageText = "Список ваших напоминаний:\n";
      reminders.forEach((reminder, index) => {
        messageText += `${index + 1}. ${
          reminder.title
        } | Дата: ${reminder.date.toLocaleDateString()} в ${reminder.date.toLocaleTimeString()}\n`;
      });

      const buttons = reminders.map((_, index) => ({
        text: `${index + 1}`,
        callback_data: `/delete_${index}`,
      }));

      const optionsForBtn = {
        chat_id: options.chatId,
        message_id: options.message_id,
        reply_markup: JSON.stringify({
          inline_keyboard: [
            buttons.slice(0, 5),
            buttons.slice(5, 10),
            [{ text: "Назад", callback_data: "/backTo" }],
          ],
        }),
      };
      bot.editMessageText(messageText, optionsForBtn);
    }
    if (data === "/backTo") {
      bot.editMessageReplyMarkup(listOptions.reply_markup, {
        chat_id: options.chatId,
        message_id: options.message_id,
      });
    }
    if (data.startsWith("/delete_")) {
      const reminderIndex = parseInt(data.split("_")[1]);
      const reminderToDelete = reminders[reminderIndex];

      if (reminderToDelete) {
        await ReminderModel.destroy({ where: { id: reminderToDelete.id } });

        const updatedReminders = await ReminderModel.findAll({
          where: { userId: user.id },
        });

        let messageText = "Список ваших напоминаний:\n";
        updatedReminders.forEach((reminder, index) => {
          messageText += `${index + 1}. ${
            reminder.title
          } | Дата: ${reminder.date.toLocaleDateString()} в ${reminder.date.toLocaleTimeString()}\n`;
        });

        const buttons = updatedReminders.map((_, index) => ({
          text: `${index + 1}`,
          callback_data: `/delete_${index}`,
        }));

        const optionsForBtn = {
          chat_id: options.chatId,
          message_id: options.message_id,
          reply_markup: JSON.stringify({
            inline_keyboard: [
              buttons.slice(0, 5),
              buttons.slice(5, 10),
              [{ text: "Назад", callback_data: "/backTo" }],
            ],
          }),
        };

        bot.editMessageText(messageText, optionsForBtn);
      }
    }
  });
};

start();
