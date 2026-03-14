require("dotenv").config()

const TelegramBot = require("node-telegram-bot-api")

const token = process.env.BOT_TOKEN
const WEBAPP_URL = process.env.WEBAPP_URL

const bot = new TelegramBot(token, { polling: true })

bot.onText(/\/start/, (msg) => {

    const chatId = msg.chat.id

    bot.sendMessage(chatId, "🐾 Witaj w Crypto Zoo!", {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "🎮 Zagraj w Crypto Zoo",
                        web_app: { url: WEBAPP_URL }
                    }
                ]
            ]
        }
    })

})