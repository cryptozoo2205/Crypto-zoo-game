const TelegramBot = require("node-telegram-bot-api");

const TOKEN = "8723087229:AAGi_OCgJur6VSmGWatGdB1mk_UUR6PRvnk";

const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {

    const chatId = msg.chat.id;

    bot.sendMessage(chatId, "🐾 Crypto Zoo", {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "🎮 Otwórz grę",
                        web_app: {
                            url: "https://tobi-nonextenuative-alycia.ngrok-free.dev"
                        }
                    }
                ]
            ]
        }
    });

});