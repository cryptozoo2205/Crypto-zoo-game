const { normalizeRewardNumber, safeString } = require("../utils/helpers");

function createDeposit({
    telegramId,
    username,
    amount,
    source = "ton",
    asset = "TON",
    walletAddress = ""
}) {
    const now = Date.now();
    const randomPart = Math.random().toString(36).slice(2, 8);
    const id = `dp_${now}_${randomPart}`;
    const paymentComment = `CRYPTOZOO_${id}`;

    return {
        id,
        telegramId: String(telegramId),
        username: String(username || "Gracz"),
        amount: normalizeRewardNumber(amount, 0),

        source: safeString(source, "ton") || "ton",
        asset: safeString(asset, "TON") || "TON",
        walletAddress: safeString(walletAddress, ""),

        status: "created",
        paymentComment,
        txHash: "",

        createdAt: now,
        updatedAt: now,
        expiresAt: now + 30 * 60 * 1000,

        note: ""
    };
}

function buildDepositPaymentData(deposit) {
    const receiverAddress =
        process.env.TON_DEPOSIT_WALLET ||
        process.env.TON_RECEIVER_WALLET ||
        "";

    return {
        depositId: String(deposit?.id || ""),
        amount: normalizeRewardNumber(deposit?.amount, 0),
        asset: String(deposit?.asset || "TON"),
        source: String(deposit?.source || "ton"),
        receiverAddress: String(receiverAddress || ""),
        paymentComment: String(deposit?.paymentComment || ""),
        expiresAt: Number(deposit?.expiresAt || 0)
    };
}

function getPlayerDeposits(db, telegramId) {
    return (Array.isArray(db?.deposits) ? db.deposits : [])
        .filter((d) => String(d.telegramId) === String(telegramId))
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

module.exports = {
    createDeposit,
    buildDepositPaymentData,
    getPlayerDeposits
};