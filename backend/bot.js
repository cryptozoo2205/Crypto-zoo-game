require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const { readDb, writeDb } = require("./db/db");

const token = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

// 🔒 TWÓJ ADMIN
const ADMIN_CHAT_ID = "6845563406";

if (!token) {
    console.error("BOT_TOKEN missing");
    process.exit(1);
}

if (!WEBAPP_URL) {
    console.error("WEBAPP_URL missing");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Bot started");

// =======================
// HELPERS
// =======================

function isAdmin(chatId) {
    return String(chatId) === ADMIN_CHAT_ID;
}

function normalizeAmount(item) {
    return Number((item?.rewardAmount || item?.amount || 0).toFixed(3));
}

function normalizeUsd(item) {
    return Number((item?.usdAmount || 0).toFixed(3));
}

function findWithdraw(db, id) {
    return db.withdrawRequests.find(w => w.id === id);
}

function getPlayer(db, telegramId) {
    return db.players[telegramId];
}

// =======================
// START
// =======================

bot.onText(/\/start/, async (msg) => {
    const url = `${WEBAPP_URL}`;
    await bot.sendMessage(msg.chat.id, "🎮 Crypto Zoo", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Zagraj", web_app: { url } }]
            ]
        }
    });
});

// =======================
// DEBUG
// =======================

bot.onText(/\/ping/, (msg) => {
    bot.sendMessage(msg.chat.id, `pong\nchat.id: ${msg.chat.id}`);
});

// =======================
// ADMIN COMMANDS
// =======================

bot.on("message", async (msg) => {
    const text = String(msg.text || "");
    if (!text.startsWith("/")) return;

    // 🔒 ADMIN BLOCK
    if (!isAdmin(msg.chat.id)) {
        if (
            text.startsWith("/admin") ||
            text.startsWith("/live_withdraws") ||
            text.startsWith("/paid_withdraws") ||
            text.startsWith("/withdraw_stats") ||
            text.startsWith("/pay") ||
            text.startsWith("/reject")
        ) {
            return bot.sendMessage(msg.chat.id, "⛔ Brak dostępu.");
        }
    }

    // =======================
    // ADMIN MENU
    // =======================
    if (text.startsWith("/admin")) {
        return bot.sendMessage(
            msg.chat.id,
            `🛠 Commands:

/live_withdraws
/paid_withdraws
/withdraw_stats

/pay <id>
/reject <id> <note>`
        );
    }

    // =======================
    // LIVE
    // =======================
    if (text.startsWith("/live_withdraws")) {
        const db = readDb();

        const list = db.withdrawRequests
            .filter(w => w.status === "pending");

        if (!list.length) {
            return bot.sendMessage(msg.chat.id, "Brak pending.");
        }

        const txt = list.map((w, i) =>
            `${i + 1}.
ID: ${w.id}
User: ${w.username}
Reward: ${normalizeAmount(w)}
USD: $${normalizeUsd(w)}`
        ).join("\n\n");

        return bot.sendMessage(msg.chat.id, txt);
    }

    // =======================
    // PAID
    // =======================
    if (text.startsWith("/paid_withdraws")) {
        const db = readDb();

        const list = db.withdrawRequests
            .filter(w => w.status === "paid")
            .slice(0, 20);

        if (!list.length) {
            return bot.sendMessage(msg.chat.id, "Brak paid.");
        }

        const txt = list.map((w, i) =>
            `${i + 1}.
${w.username}
${normalizeAmount(w)} ($${normalizeUsd(w)})`
        ).join("\n\n");

        return bot.sendMessage(msg.chat.id, txt);
    }

    // =======================
    // STATS
    // =======================
    if (text.startsWith("/withdraw_stats")) {
        const db = readDb();
        const all = db.withdrawRequests;

        const pending = all.filter(w => w.status === "pending");
        const paid = all.filter(w => w.status === "paid");
        const rejected = all.filter(w => w.status === "rejected");

        return bot.sendMessage(
            msg.chat.id,
            `📊 STATS

Pending: ${pending.length}
Paid: ${paid.length}
Rejected: ${rejected.length}`
        );
    }

    // =======================
    // PAY
    // =======================
    if (text.startsWith("/pay")) {
        const db = readDb();
        const parts = text.split(" ");
        const id = parts[1];

        if (!id) {
            return bot.sendMessage(msg.chat.id, "Podaj ID");
        }

        const w = findWithdraw(db, id);

        if (!w) {
            return bot.sendMessage(msg.chat.id, "Nie znaleziono");
        }

        if (w.status !== "pending") {
            return bot.sendMessage(msg.chat.id, "Już przetworzone");
        }

        const player = getPlayer(db, w.telegramId);
        const amount = normalizeAmount(w);

        player.withdrawPending -= amount;
        player.rewardWallet += amount;

        w.status = "paid";
        w.updatedAt = Date.now();

        writeDb(db);

        await bot.sendMessage(msg.chat.id, `✅ PAID ${id}`);
    }

    // =======================
    // REJECT
    // =======================
    if (text.startsWith("/reject")) {
        const db = readDb();
        const parts = text.split(" ");

        const id = parts[1];
        const note = parts.slice(2).join(" ") || "";

        if (!id) {
            return bot.sendMessage(msg.chat.id, "Podaj ID");
        }

        const w = findWithdraw(db, id);

        if (!w) {
            return bot.sendMessage(msg.chat.id, "Nie znaleziono");
        }

        if (w.status !== "pending") {
            return bot.sendMessage(msg.chat.id, "Już przetworzone");
        }

        const player = getPlayer(db, w.telegramId);
        const amount = normalizeAmount(w);

        player.withdrawPending -= amount;
        player.rewardBalance += amount;

        w.status = "rejected";
        w.note = note;
        w.updatedAt = Date.now();

        writeDb(db);

        await bot.sendMessage(msg.chat.id, `❌ REJECTED ${id}`);
    }
});

module.exports = {
    bot
};