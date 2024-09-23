const bot = require("./bot");
const UserModel = require("./models/User");
const ReminderModel = require("./models/Reminder");
const assotiations = require("./models/assotiations");
const sequelize = require("./db");
const { cancelOptions, descOptions, listOptions } = require("./options");
const utils = require("./msgHandler/utils");
const generateReminderMessage = require("./generateReminderMessage");

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
          return utils.rlistMsg(user, options.chatId, text);
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

  let startIndex = 0;
  let endIndex = 10;

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
    if (data.startsWith("prev:") || data.startsWith("next:")) {
      const action = data.split(":")[0];
      const index = parseInt(data.split(":")[1]);

      if (action === "prev") {
        startIndex = Math.max(0, index - 10);
        endIndex = index;
      } else if (action === "next") {
        startIndex = index;
        endIndex = Math.min(reminders.length, index + 10);
      }

      const { helpText, keyboard } = generateReminderMessage(
        options.chatId,
        reminders,
        startIndex,
        endIndex
      );

      bot.editMessageText(helpText, {
        chat_id: options.chatId,
        message_id: options.message_id,
        reply_markup: keyboard,
      });
    }
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
          inline_keyboard: [[{ text: "Отменить", callback_data: "/back" }]],
        }),
      });
    }
    if (data === "/delete") {
      const { helpText, keyboard } = generateReminderMessage(
        options.chatId,
        reminders,
        startIndex,
        endIndex,
        data
      );

      const optionsForBtn = {
        chat_id: options.chatId,
        message_id: options.message_id,
        reply_markup: JSON.stringify({
          ...keyboard,
        }),
      };
      bot.editMessageText(helpText, optionsForBtn);
    }
    if (data === "/backTo") {
      const keyboard = listOptions(startIndex, endIndex, reminders);
      bot.editMessageReplyMarkup(JSON.stringify(keyboard), {
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

        const { helpText, keyboard } = generateReminderMessage(
          options.chatId,
          updatedReminders,
          startIndex,
          endIndex,
          data
        );

        const optionsForBtn = {
          chat_id: options.chatId,
          message_id: options.message_id,
          reply_markup: JSON.stringify({
            ...keyboard,
          }),
        };

        bot.editMessageText(helpText, optionsForBtn);
      }
    }
  });
};

start();
