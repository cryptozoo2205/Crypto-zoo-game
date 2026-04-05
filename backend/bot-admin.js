require("dotenv").config();

const { readDb, writeDb } = require("./db/db");

const ADMIN_CHAT_ID = safeEnvString(process.env.ADMIN_CHAT_ID, "6845563406");
const ADMIN_RESET_PASSWORD = "8884498";

const ADMIN_CALLBACKS = {
    PANEL: "admin_panel",
    STATS: "admin_stats",
    DEPOSITS: "admin_deposits",
    WITHDRAWS: "admin_withdraws",
    EVENTS: "admin_events",
    TOOLS: "admin_tools",
    EVENTS_ON: "admin_events_on",
    EVENTS_OFF: "admin_events_off",
    BACK: "admin_back"
};

function safeEnvString(value, fallback = "") {
    const safe = String(value || "").trim();
    return safe || String(fallback || "");
}

function isAdmin(chatId) {
    return String(chatId) === String(ADMIN_CHAT_ID);
}

function isValidResetPassword(value) {
    return String(value || "").trim() === ADMIN_RESET_PASSWORD;
}

function normalizeAmount(item) {
    return Number((item?.rewardAmount || item?.amount || 0).toFixed(3));
}

function normalizeUsd(item) {
    return Number((item?.usdAmount || 0).toFixed(3));
}

function toNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

function round3(value) {
    return Number(toNumber(value).toFixed(3));
}

function normalizeGems(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
}

function normalizeSearchValue(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/^@+/, "");
}

function ensureAdminSettings(db) {
    if (!db || typeof db !== "object") return;

    if (!db.adminSettings || typeof db.adminSettings !== "object") {
        db.adminSettings = {};
    }

    if (typeof db.adminSettings.eventsEnabled !== "boolean") {
        db.adminSettings.eventsEnabled = false;
    }
}

function getEventsEnabled(db) {
    ensureAdminSettings(db);
    return Boolean(db?.adminSettings?.eventsEnabled);
}

function setEventsEnabled(db, enabled) {
    ensureAdminSettings(db);
    db.adminSettings.eventsEnabled = Boolean(enabled);
    db.adminSettings.updatedAt = Date.now();
    writeDb(db);
    return db.adminSettings.eventsEnabled;
}

function findWithdraw(db, id) {
    return (db.withdrawRequests || []).find((w) => String(w.id) === String(id));
}

function getPlayer(db, telegramId) {
    if (!db || !db.players) return null;
    return db.players?.[telegramId] || null;
}

function getPlayersArray(db) {
    if (!db || !db.players) return [];

    if (Array.isArray(db.players)) {
        return db.players;
    }

    if (typeof db.players === "object") {
        return Object.values(db.players);
    }

    return [];
}

function getTotalUsers(db) {
    if (!db || !db.players) return 0;

    if (Array.isArray(db.players)) {
        return db.players.length;
    }

    if (typeof db.players === "object") {
        return Object.keys(db.players).length;
    }

    return 0;
}

function getDepositEntries(db) {
    if (!db || typeof db !== "object") return [];

    if (Array.isArray(db.deposits)) {
        return db.deposits.filter(Boolean);
    }

    if (Array.isArray(db.depositRequests)) {
        return db.depositRequests.filter(Boolean);
    }

    const players = getPlayersArray(db);
    const all = [];

    for (const player of players) {
        if (!player || typeof player !== "object") continue;

        if (Array.isArray(player.depositHistory)) {
            all.push(...player.depositHistory.filter(Boolean));
            continue;
        }

        if (Array.isArray(player.deposits)) {
            all.push(...player.deposits.filter(Boolean));
            continue;
        }
    }

    return all;
}

function getDepositorsCount(db) {
    const players = getPlayersArray(db);
    let total = 0;

    for (const player of players) {
        if (!player || typeof player !== "object") continue;

        const hasDeposits =
            (Array.isArray(player.depositHistory) && player.depositHistory.length > 0) ||
            (Array.isArray(player.deposits) && player.deposits.length > 0) ||
            Number(player.totalDeposits || 0) > 0 ||
            Number(player.depositAmount || 0) > 0;

        if (hasDeposits) {
            total += 1;
        }
    }

    return total;
}

function getDepositTonValue(item) {
    return toNumber(
        item?.tonAmount ??
            item?.amount ??
            item?.depositAmount ??
            item?.value ??
            0
    );
}

function getDepositUsdValue(item) {
    return toNumber(
        item?.usdAmount ??
            item?.usd ??
            item?.usdValue ??
            0
    );
}

function getDepositStats(db) {
    const entries = getDepositEntries(db);

    let totalTon = 0;
    let totalUsd = 0;

    for (const item of entries) {
        totalTon += getDepositTonValue(item);
        totalUsd += getDepositUsdValue(item);
    }

    return {
        count: entries.length,
        totalTon: round3(totalTon),
        totalUsd: round3(totalUsd)
    };
}

function getRecentDeposits(db, limit = 10) {
    const entries = getDepositEntries(db);

    return entries
        .slice()
        .sort((a, b) => {
            const timeA = Number(a?.createdAt || a?.timestamp || a?.date || 0);
            const timeB = Number(b?.createdAt || b?.timestamp || b?.date || 0);
            return timeB - timeA;
        })
        .slice(0, Math.max(0, limit));
}

function getWithdrawLists(db) {
    const allWithdraws = Array.isArray(db.withdrawRequests) ? db.withdrawRequests : [];

    return {
        all: allWithdraws,
        pending: allWithdraws.filter((w) => w.status === "pending"),
        paid: allWithdraws.filter((w) => w.status === "paid"),
        rejected: allWithdraws.filter((w) => w.status === "rejected")
    };
}

function findPlayerByQuery(db, query) {
    if (!db || !db.players) return null;

    const rawQuery = String(query || "").trim();
    const normalizedQuery = normalizeSearchValue(rawQuery);

    if (!rawQuery) return null;

    if (db.players[rawQuery]) {
        return db.players[rawQuery];
    }

    const players = getPlayersArray(db);

    const exactIdMatch = players.find((player) => {
        return String(player?.telegramId || "").trim() === rawQuery;
    });
    if (exactIdMatch) return exactIdMatch;

    const exactUsernameMatch = players.find((player) => {
        const username1 = normalizeSearchValue(player?.username);
        const username2 = normalizeSearchValue(player?.telegramUser?.username);
        const firstName = normalizeSearchValue(player?.telegramUser?.first_name);
        const fullName = normalizeSearchValue(
            `${player?.telegramUser?.first_name || ""} ${player?.telegramUser?.last_name || ""}`
        );

        return (
            username1 === normalizedQuery ||
            username2 === normalizedQuery ||
            firstName === normalizedQuery ||
            fullName === normalizedQuery
        );
    });
    if (exactUsernameMatch) return exactUsernameMatch;

    const partialUsernameMatch = players.find((player) => {
        const candidates = [
            player?.username,
            player?.telegramUser?.username,
            player?.telegramUser?.first_name,
            `${player?.telegramUser?.first_name || ""} ${player?.telegramUser?.last_name || ""}`
        ]
            .map((value) => normalizeSearchValue(value))
            .filter(Boolean);

        return candidates.some((value) => value.includes(normalizedQuery));
    });

    return partialUsernameMatch || null;
}

function getAdminMainKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: "📊 Stats", callback_data: ADMIN_CALLBACKS.STATS },
                { text: "💰 Deposits", callback_data: ADMIN_CALLBACKS.DEPOSITS }
            ],
            [
                { text: "💸 Withdraws", callback_data: ADMIN_CALLBACKS.WITHDRAWS },
                { text: "🎮 Events", callback_data: ADMIN_CALLBACKS.EVENTS }
            ],
            [
                { text: "⚙️ Tools", callback_data: ADMIN_CALLBACKS.TOOLS }
            ]
        ]
    };
}

function getBackKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: "⬅️ Back", callback_data: ADMIN_CALLBACKS.BACK }
            ]
        ]
    };
}

function getEventsKeyboard(db) {
    const enabled = getEventsEnabled(db);

    return {
        inline_keyboard: [
            [
                {
                    text: enabled ? "✅ Events ON" : "🔛 Enable events",
                    callback_data: ADMIN_CALLBACKS.EVENTS_ON
                },
                {
                    text: !enabled ? "⛔ Events OFF" : "🔴 Disable events",
                    callback_data: ADMIN_CALLBACKS.EVENTS_OFF
                }
            ],
            [
                { text: "⬅️ Back", callback_data: ADMIN_CALLBACKS.BACK }
            ]
        ]
    };
}

function formatAdminPanel(db) {
    const totalUsers = getTotalUsers(db);
    const depositStats = getDepositStats(db);
    const depositUsersCount = getDepositorsCount(db);
    const withdraws = getWithdrawLists(db);
    const eventsEnabled = getEventsEnabled(db) ? "ON" : "OFF";

    return `🛠 ADMIN PANEL

👥 Users total: ${totalUsers}
💸 Deposits: ${depositStats.count}
💰 TON total: ${depositStats.totalTon}
💵 USD total: ${depositStats.totalUsd}
🧑‍💳 Users with deposit: ${depositUsersCount}

📤 Pending withdraws: ${withdraws.pending.length}
✅ Paid withdraws: ${withdraws.paid.length}
❌ Rejected withdraws: ${withdraws.rejected.length}
🎮 Events: ${eventsEnabled}

Komendy które już masz:
  
/live_withdraws
/paid_withdraws
/withdraw_stats

/pay <id>
/reject <id> <note>

/player <telegramId | username>
/addgems <telegramId | username> <amount>

/resetplayer <telegramId | username> <password>
/resetallplayers <password>`;
}

function formatLiveWithdraws(list) {
    if (!list.length) {
        return "Brak pending.";
    }

    return list
        .map(
            (w, i) => `${i + 1}.
ID: ${w.id}
User: ${w.username}
Reward: ${normalizeAmount(w)}
USD: $${normalizeUsd(w)}`
        )
        .join("\n\n");
}

function formatPaidWithdraws(list) {
    if (!list.length) {
        return "Brak paid.";
    }

    return list
        .map(
            (w, i) => `${i + 1}.
${w.username}
${normalizeAmount(w)} ($${normalizeUsd(w)})`
        )
        .join("\n\n");
}

function formatWithdrawStats(db) {
    const totalUsers = getTotalUsers(db);
    const depositStats = getDepositStats(db);
    const depositUsersCount = getDepositorsCount(db);
    const withdraws = getWithdrawLists(db);
    const eventsEnabled = getEventsEnabled(db) ? "ON" : "OFF";

    return `📊 STATS

👥 Users total: ${totalUsers}
💸 Deposits: ${depositStats.count}
💰 TON total: ${depositStats.totalTon}
💵 USD total: ${depositStats.totalUsd}
🧑‍💳 Users with deposit: ${depositUsersCount}

Pending: ${withdraws.pending.length}
Paid: ${withdraws.paid.length}
Rejected: ${withdraws.rejected.length}

🎮 Events: ${eventsEnabled}`;
}

function formatDepositsScreen(db) {
    const depositStats = getDepositStats(db);
    const depositUsersCount = getDepositorsCount(db);
    const recentDeposits = getRecentDeposits(db, 10);

    const recentText = recentDeposits.length
        ? recentDeposits
              .map((item, index) => {
                  const username = String(
                      item?.username ||
                          item?.playerUsername ||
                          item?.telegramUsername ||
                          item?.telegramId ||
                          item?.playerId ||
                          "Gracz"
                  );

                  const ton = round3(getDepositTonValue(item));
                  const usd = round3(getDepositUsdValue(item));

                  return `${index + 1}. ${username} • ${ton} TON • $${usd}`;
              })
              .join("\n")
        : "Brak ostatnich depozytów.";

    return `💰 DEPOSITS

Ilość depozytów: ${depositStats.count}
TON total: ${depositStats.totalTon}
USD total: ${depositStats.totalUsd}
Users with deposit: ${depositUsersCount}

Ostatnie depozyty:
${recentText}`;
}

function formatWithdrawsScreen(db) {
    const { pending, paid, rejected } = getWithdrawLists(db);

    const pendingText = pending.length
        ? pending
              .slice(0, 10)
              .map((w, i) => {
                  return `${i + 1}. ${String(w.username || w.telegramId || "Gracz")} • ${normalizeAmount(w)} • ID: ${w.id}`;
              })
              .join("\n")
        : "Brak pending.";

    return `💸 WITHDRAWS

Pending: ${pending.length}
Paid: ${paid.length}
Rejected: ${rejected.length}

Ostatnie pending:
${pendingText}

Komendy:
  
/pay <id>
/reject <id> <note>
/live_withdraws`;
}

function formatEventsScreen(db) {
    const enabled = getEventsEnabled(db);

    return `🎮 EVENTS

Status: ${enabled ? "ON" : "OFF"}

Tutaj sterujesz widocznością / aktywnością eventów z panelu admina.
Możesz to później podpiąć pod frontend i event UI gracza.`;
}

function formatToolsScreen() {
    return `⚙️ TOOLS

Dostępne teraz:
- /player <telegramId | username>
- /addgems <telegramId | username> <amount>
- /pay <id>
- /reject <id> <note>
- /resetplayer <telegramId | username> <password>
- /resetallplayers <password>

Później można tu dodać:
- give coins
- broadcast
- event bonus multipliers`;
}

function formatPlayerInfo(player) {
    if (!player) {
        return "Nie znaleziono gracza";
    }

    const username =
        String(
            player.username ||
            player.telegramUser?.username ||
            player.telegramUser?.first_name ||
            "Gracz"
        );

    return `👤 PLAYER

ID: ${String(player.telegramId || "")}
Username: ${username}
Gems: ${normalizeGems(player.gems)}
Coins: ${toNumber(player.coins)}
Level: ${Math.max(1, Math.floor(Number(player.level) || 1))}
Reward balance: ${toNumber(player.rewardBalance || 0).toFixed(3)}
Reward wallet: ${toNumber(player.rewardWallet || 0).toFixed(3)}
Pending: ${toNumber(player.withdrawPending || 0).toFixed(3)}`;
}

function resetPlayerProgress(player) {
    if (!player || typeof player !== "object") {
        return false;
    }

    const now = Date.now();

    player.coins = 0;
    player.gems = 0;
    player.rewardBalance = 0;
    player.rewardWallet = 0;
    player.withdrawPending = 0;

    player.level = 1;
    player.xp = 0;
    player.lastAwardedLevel = 1;
    player.coinsPerClick = 1;
    player.zooIncome = 0;

    player.animals = {};
    player.boxes = {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0
    };

    player.shopPurchases = {};
    player.minigames = {
        memoryCooldownUntil: 0
    };

    player.expeditionBoost = 0;
    player.expeditionBoostActiveUntil = 0;
    player.expeditionStats = {
        rareChanceBonus: 0,
        epicChanceBonus: 0,
        timeReductionSeconds: 0,
        timeBoostCharges: []
    };
    player.activeExpedition = null;
    player.selectedAnimals = [];

    player.offlineMaxSeconds = 15 * 60;
    player.offlineBoostMultiplier = 1;
    player.offlineBoostActiveUntil = 0;
    player.offlineBoost = 1;
    player.offlineBaseHours = 0.25;
    player.offlineBoostHours = 0;
    player.offlineAdsHours = 0;

    player.boost2xActiveUntil = 0;

    player.lastLogin = now;
    player.lastDailyRewardAt = 0;
    player.dailyRewardStreak = 0;
    player.dailyRewardClaimDayKey = "";

    player.playTimeSeconds = 0;
    player.updatedAt = now;

    delete player.wheelCooldownUntil;
    delete player.extraWheelSpins;
    delete player.dailyMissions;
    delete player.currentMissionProgress;
    delete player.homeBoostState;
    delete player.memoryGameState;
    delete player.offlineBoostState;

    return true;
}

function applyResetPlayer(db, player) {
    if (!player) {
        return { ok: false, error: "Nie znaleziono gracza" };
    }

    resetPlayerProgress(player);
    writeDb(db);

    return { ok: true, player };
}

function applyResetAllPlayers(db) {
    if (!db || !db.players) {
        return { ok: false, error: "Brak graczy w bazie" };
    }

    let total = 0;

    if (Array.isArray(db.players)) {
        db.players.forEach((player) => {
            if (player && typeof player === "object") {
                resetPlayerProgress(player);
                total += 1;
            }
        });
    } else if (typeof db.players === "object") {
        Object.keys(db.players).forEach((key) => {
            const player = db.players[key];
            if (player && typeof player === "object") {
                resetPlayerProgress(player);
                total += 1;
            }
        });
    }

    writeDb(db);

    return {
        ok: true,
        total
    };
}

function applyPaidWithdraw(db, withdraw) {
    const player = getPlayer(db, withdraw.telegramId);

    if (!player) {
        return { ok: false, error: "Nie znaleziono gracza" };
    }

    const amount = normalizeAmount(withdraw);

    player.withdrawPending = Number(player.withdrawPending || 0) - amount;
    player.rewardWallet = Number(player.rewardWallet || 0) + amount;

    withdraw.status = "paid";
    withdraw.updatedAt = Date.now();

    writeDb(db);

    return { ok: true };
}

function applyRejectedWithdraw(db, withdraw, note = "") {
    const player = getPlayer(db, withdraw.telegramId);

    if (!player) {
        return { ok: false, error: "Nie znaleziono gracza" };
    }

    const amount = normalizeAmount(withdraw);

    player.withdrawPending = Number(player.withdrawPending || 0) - amount;
    player.rewardBalance = Number(player.rewardBalance || 0) + amount;

    withdraw.status = "rejected";
    withdraw.note = note;
    withdraw.updatedAt = Date.now();

    writeDb(db);

    return { ok: true };
}

function applyAddGems(db, player, gemsAmount) {
    const safeGems = normalizeGems(gemsAmount);

    if (safeGems <= 0) {
        return { ok: false, error: "Nieprawidłowa ilość gemów" };
    }

    player.gems = normalizeGems(player.gems) + safeGems;
    player.updatedAt = Date.now();

    writeDb(db);

    return {
        ok: true,
        player,
        added: safeGems
    };
}

function isAdminCommand(text) {
    return (
        text.startsWith("/admin") ||
        text.startsWith("/live_withdraws") ||
        text.startsWith("/paid_withdraws") ||
        text.startsWith("/withdraw_stats") ||
        text.startsWith("/pay") ||
        text.startsWith("/reject") ||
        text.startsWith("/player") ||
        text.startsWith("/addgems") ||
        text.startsWith("/resetplayer") ||
        text.startsWith("/resetallplayers")
    );
}

async function sendOrEditAdminMessage(bot, chatId, messageId, text, replyMarkup) {
    const options = {
        reply_markup: replyMarkup
    };

    if (messageId) {
        try {
            return await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                ...options
            });
        } catch (error) {
            const message = String(error?.message || "");
            if (!message.includes("message is not modified")) {
                console.error("Admin editMessageText error:", error);
            }
        }
    }

    return bot.sendMessage(chatId, text, options);
}

function registerAdminHandlers(bot) {
    bot.on("message", async (msg) => {
        const text = String(msg.text || "");
        if (!text.startsWith("/")) return;

        if (!isAdmin(msg.chat.id) && isAdminCommand(text)) {
            return bot.sendMessage(msg.chat.id, "⛔ Brak dostępu.");
        }

        if (text.startsWith("/admin")) {
            const db = readDb();
            ensureAdminSettings(db);

            return bot.sendMessage(
                msg.chat.id,
                formatAdminPanel(db),
                {
                    reply_markup: getAdminMainKeyboard()
                }
            );
        }

        if (text.startsWith("/live_withdraws")) {
            const db = readDb();
            const { pending } = getWithdrawLists(db);
            return bot.sendMessage(msg.chat.id, formatLiveWithdraws(pending));
        }

        if (text.startsWith("/paid_withdraws")) {
            const db = readDb();
            const { paid } = getWithdrawLists(db);
            return bot.sendMessage(msg.chat.id, formatPaidWithdraws(paid.slice(0, 20)));
        }

        if (text.startsWith("/withdraw_stats")) {
            const db = readDb();
            ensureAdminSettings(db);
            return bot.sendMessage(msg.chat.id, formatWithdrawStats(db));
        }

        if (text.startsWith("/player")) {
            const db = readDb();
            const parts = text.trim().split(/\s+/);
            const query = parts.slice(1).join(" ").trim();

            if (!query) {
                return bot.sendMessage(msg.chat.id, "Użyj: /player <telegramId | username>");
            }

            const player = findPlayerByQuery(db, query);
            return bot.sendMessage(msg.chat.id, formatPlayerInfo(player));
        }

        if (text.startsWith("/addgems")) {
            const db = readDb();
            const parts = text.trim().split(/\s+/);

            if (parts.length < 3) {
                return bot.sendMessage(msg.chat.id, "Użyj: /addgems <telegramId | username> <amount>");
            }

            const amount = parts[parts.length - 1];
            const query = parts.slice(1, -1).join(" ").trim();

            if (!query) {
                return bot.sendMessage(msg.chat.id, "Użyj: /addgems <telegramId | username> <amount>");
            }

            const player = findPlayerByQuery(db, query);

            if (!player) {
                return bot.sendMessage(msg.chat.id, "Nie znaleziono gracza");
            }

            const result = applyAddGems(db, player, amount);

            if (!result.ok) {
                return bot.sendMessage(msg.chat.id, result.error || "Błąd");
            }

            return bot.sendMessage(
                msg.chat.id,
                `💎 Dodano ${result.added} gemów
ID: ${String(player.telegramId || "")}
User: ${String(player.username || player.telegramUser?.username || "Gracz")}
Nowe gemy: ${normalizeGems(result.player.gems)}`
            );
        }

        if (text.startsWith("/resetplayer")) {
            const db = readDb();
            const parts = text.trim().split(/\s+/);

            if (parts.length < 3) {
                return bot.sendMessage(
                    msg.chat.id,
                    "Użyj: /resetplayer <telegramId | username> <password>"
                );
            }

            const password = parts[parts.length - 1];
            const query = parts.slice(1, -1).join(" ").trim();

            if (!query) {
                return bot.sendMessage(
                    msg.chat.id,
                    "Użyj: /resetplayer <telegramId | username> <password>"
                );
            }

            if (!isValidResetPassword(password)) {
                return bot.sendMessage(msg.chat.id, "❌ Nieprawidłowe hasło resetu");
            }

            const player = findPlayerByQuery(db, query);

            if (!player) {
                return bot.sendMessage(msg.chat.id, "Nie znaleziono gracza");
            }

            const result = applyResetPlayer(db, player);

            if (!result.ok) {
                return bot.sendMessage(msg.chat.id, result.error || "Błąd resetu");
            }

            return bot.sendMessage(
                msg.chat.id,
                `♻️ Zresetowano gracza
ID: ${String(result.player.telegramId || "")}
User: ${String(result.player.username || result.player.telegramUser?.username || result.player.telegramUser?.first_name || "Gracz")}`
            );
        }

        if (text.startsWith("/resetallplayers")) {
            const db = readDb();
            const parts = text.trim().split(/\s+/);
            const password = parts[1] || "";

            if (!password) {
                return bot.sendMessage(
                    msg.chat.id,
                    "Użyj: /resetallplayers <password>"
                );
            }

            if (!isValidResetPassword(password)) {
                return bot.sendMessage(msg.chat.id, "❌ Nieprawidłowe hasło resetu");
            }

            const result = applyResetAllPlayers(db);

            if (!result.ok) {
                return bot.sendMessage(msg.chat.id, result.error || "Błąd resetu");
            }

            return bot.sendMessage(
                msg.chat.id,
                `♻️ Zresetowano wszystkich graczy: ${result.total}`
            );
        }

        if (text.startsWith("/pay")) {
            const db = readDb();
            const parts = text.split(" ");
            const id = parts[1];

            if (!id) {
                return bot.sendMessage(msg.chat.id, "Podaj ID");
            }

            const withdraw = findWithdraw(db, id);

            if (!withdraw) {
                return bot.sendMessage(msg.chat.id, "Nie znaleziono");
            }

            if (withdraw.status !== "pending") {
                return bot.sendMessage(msg.chat.id, "Już przetworzone");
            }

            const result = applyPaidWithdraw(db, withdraw);

            if (!result.ok) {
                return bot.sendMessage(msg.chat.id, result.error || "Błąd");
            }

            return bot.sendMessage(msg.chat.id, `✅ PAID ${id}`);
        }

        if (text.startsWith("/reject")) {
            const db = readDb();
            const parts = text.split(" ");

            const id = parts[1];
            const note = parts.slice(2).join(" ") || "";

            if (!id) {
                return bot.sendMessage(msg.chat.id, "Podaj ID");
            }

            const withdraw = findWithdraw(db, id);

            if (!withdraw) {
                return bot.sendMessage(msg.chat.id, "Nie znaleziono");
            }

            if (withdraw.status !== "pending") {
                return bot.sendMessage(msg.chat.id, "Już przetworzone");
            }

            const result = applyRejectedWithdraw(db, withdraw, note);

            if (!result.ok) {
                return bot.sendMessage(msg.chat.id, result.error || "Błąd");
            }

            return bot.sendMessage(msg.chat.id, `❌ REJECTED ${id}`);
        }
    });

    bot.on("callback_query", async (query) => {
        const chatId = query?.message?.chat?.id;
        const messageId = query?.message?.message_id;
        const data = String(query?.data || "");

        if (!chatId || !data.startsWith("admin_")) {
            return;
        }

        if (!isAdmin(chatId)) {
            try {
                await bot.answerCallbackQuery(query.id, {
                    text: "⛔ Brak dostępu.",
                    show_alert: true
                });
            } catch (error) {
                console.error("Admin callback deny error:", error);
            }
            return;
        }

        try {
            if (data === ADMIN_CALLBACKS.PANEL || data === ADMIN_CALLBACKS.BACK) {
                const db = readDb();
                ensureAdminSettings(db);

                await sendOrEditAdminMessage(
                    bot,
                    chatId,
                    messageId,
                    formatAdminPanel(db),
                    getAdminMainKeyboard()
                );
            }

            if (data === ADMIN_CALLBACKS.STATS) {
                const db = readDb();
                ensureAdminSettings(db);

                await sendOrEditAdminMessage(
                    bot,
                    chatId,
                    messageId,
                    formatWithdrawStats(db),
                    getBackKeyboard()
                );
            }

            if (data === ADMIN_CALLBACKS.DEPOSITS) {
                const db = readDb();
                ensureAdminSettings(db);

                await sendOrEditAdminMessage(
                    bot,
                    chatId,
                    messageId,
                    formatDepositsScreen(db),
                    getBackKeyboard()
                );
            }

            if (data === ADMIN_CALLBACKS.WITHDRAWS) {
                const db = readDb();
                ensureAdminSettings(db);

                await sendOrEditAdminMessage(
                    bot,
                    chatId,
                    messageId,
                    formatWithdrawsScreen(db),
                    getBackKeyboard()
                );
            }

            if (data === ADMIN_CALLBACKS.EVENTS) {
                const db = readDb();
                ensureAdminSettings(db);

                await sendOrEditAdminMessage(
                    bot,
                    chatId,
                    messageId,
                    formatEventsScreen(db),
                    getEventsKeyboard(db)
                );
            }

            if (data === ADMIN_CALLBACKS.TOOLS) {
                await sendOrEditAdminMessage(
                    bot,
                    chatId,
                    messageId,
                    formatToolsScreen(),
                    getBackKeyboard()
                );
            }

            if (data === ADMIN_CALLBACKS.EVENTS_ON) {
                const db = readDb();
                setEventsEnabled(db, true);

                await sendOrEditAdminMessage(
                    bot,
                    chatId,
                    messageId,
                    formatEventsScreen(db),
                    getEventsKeyboard(db)
                );
            }

            if (data === ADMIN_CALLBACKS.EVENTS_OFF) {
                const db = readDb();
                setEventsEnabled(db, false);

                await sendOrEditAdminMessage(
                    bot,
                    chatId,
                    messageId,
                    formatEventsScreen(db),
                    getEventsKeyboard(db)
                );
            }

            await bot.answerCallbackQuery(query.id);
        } catch (error) {
            console.error("Admin callback error:", error);

            try {
                await bot.answerCallbackQuery(query.id, {
                    text: "Wystąpił błąd",
                    show_alert: true
                });
            } catch (answerError) {
                console.error("Admin callback answer error:", answerError);
            }
        }
    });
}

module.exports = {
    registerAdminHandlers,
    isAdmin
};