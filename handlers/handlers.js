const UserModel = require("../models/User");
const ReminderModel = require("../models/Reminder");
const msgUtils = require("./msgHandler/utils");
const dataUtils = require("./dataHandler/utils");
const bot = require("../bot");

let currentMessageId;
let startIndex = 0;
let endIndex = 10;
const reminder = [];

const getUser = async (chatId, tgId) => {
  let user = await UserModel.findOne({
    where: { chatId, tgId },
    include: [ReminderModel],
  });

  if (!user) {
    user = await UserModel.create(
      { chatId, tgId, state: 1 },
      { returning: true, include: [ReminderModel] }
    );
  }

  return user;
};

const handleMessage = async (msg, bot, commands) => {
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
      .catch((err) =>
        console.error("Ошибка при редактировании сообщения:", err)
      );
    currentMessageId = null;
  }

  try {
    const user = await getUser(options.chatId, options.tgId);

    const response = await handleUserState(
      user,
      options,
      text,
      reminder,
      commands
    );

    if (response) {
      currentMessageId = response.message_id;
    }
  } catch (e) {
    console.error(e);
    bot.sendMessage(options.chatId, "Произошла ошибка!");
  }
};

const handleUserState = async (user, options, text, reminder, commands) => {
  if (user.state >= 2 && user.state <= 4) {
    return handleRemCreation(user, options, text, reminder, commands);
  }

  switch (text) {
    case "/start":
      return msgUtils.startMsg(options.chatId);
    case "/rlist":
      return msgUtils.rlistMsg(user, options.chatId);
    case "/id":
      return msgUtils.idMsg(options.chatId, options.tgId);
    case "/help":
      return msgUtils.helpMsg(options.chatId);
    case "/info":
      return msgUtils.infoMsg(options, commands);
    case "/create":
      return msgUtils.create(user, options).then((sendMessage) => {
        currentMessageId = sendMessage.message_id;
      });
    default:
      return bot.sendMessage(
        options.chatId,
        "Я тебя не понимаю, попробуй команду из списка"
      );
  }
};

const handleRemCreation = async (user, options, text, reminder, commands) => {
  switch (user.state) {
    case 2:
      return msgUtils
        .createTitle(user, commands, options, reminder, text)
        .then((sendMessage) => {
          currentMessageId = sendMessage.message_id;
        });
    case 3:
      return msgUtils
        .createDesc(user, commands, options, reminder, text)
        .then((sendMessage) => {
          currentMessageId = sendMessage.message_id;
        });
    case 4:
      return msgUtils
        .createDate(user, options, reminder, text)
        .then((sendMessage) => {
          currentMessageId = sendMessage.message_id;
        });
  }
};

const handleCallbackQuery = async (msg) => {
  const options = {
    chatId: msg.message.chat.id,
    message_id: msg.message.message_id,
  };
  const data = msg.data;

  const user = await UserModel.findOne({ where: { chatId: options.chatId } });
  const reminders = await ReminderModel.findAll({ where: { userId: user.id } });

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
};

module.exports = {
  handleMessage,
  handleCallbackQuery,
};
