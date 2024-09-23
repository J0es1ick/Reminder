const bot = require("./bot");
const UserModel = require("./models/User");
const ReminderModel = require("./models/Reminder");
const assotiations = require("./models/assotiations");
const sequelize = require("./db");
const msgUtils = require("./msgHandler/utils");
const dataUtils = require("./dataHandler/utils");

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
  let startIndex = 0;
  let endIndex = 10;
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
            return msgUtils
              .createMsg2(user, commands, options, reminder, text)
              .then((sendMessage) => {
                currentMessageId = sendMessage.message_id;
              });
          case 3:
            return msgUtils
              .createMsg3(user, commands, options, reminder, text)
              .then((sendMessage) => {
                currentMessageId = sendMessage.message_id;
              });
          case 4:
            return msgUtils
              .createMsg4(user, options, reminder, text)
              .then((sendMessage) => {
                currentMessageId = sendMessage.message_id;
              });
        }
      }

      switch (text) {
        case "/create":
          return await msgUtils.createMsg(user, options).then((sendMessage) => {
            currentMessageId = sendMessage.message_id;
          });
        case "/start":
          return msgUtils.startMsg(options.chatId);
        case "/rlist":
          return msgUtils.rlistMsg(user, options.chatId, text);
        case "/id":
          return msgUtils.idMsg(options.chatId, options.tgId);
        case "/help":
          return msgUtils.helpMsg(options.chatId);
        case "/info":
          return msgUtils.infoMsg(options, commands);

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
    if (data.startsWith("prev:") || data.startsWith("next:")) {
      [startIndex, endIndex] = dataUtils.pages(
        data,
        startIndex,
        endIndex,
        reminders,
        options
      );
    } else if (data === "/back") {
      dataUtils.back(user, options);
    } else if (data === "/skip") {
      dataUtils.skip(user, options);
    } else if (data === "/delete") {
      dataUtils.deleteMsg(options, reminders, startIndex, endIndex, data);
    } else if (data === "/backTo") {
      dataUtils.backTo(startIndex, endIndex, reminders, options);
    } else if (data.startsWith("/delete_")) {
      dataUtils.deleteRem(data, user, options, startIndex, endIndex, reminders);
    } else if (data === "/again") {
      dataUtils.again(user, options);
    }
  });
};

start();
