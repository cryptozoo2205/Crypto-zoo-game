const { normalizeRewardNumber, safeString } = require("../utils/helpers");

const TON_RECEIVER_WALLET = "UQBTjBORP2cXRNE_hakpG-2DZlBn0uUWME8tKhi7HCcynER5";

function getDepositGemsAmount(amount) {
    const safeAmount = normalizeRewardNumber(amount, 0);

    if (safeAmount >= 10) return 150;
    if (safeAmount >= 5) return 70;
    if (safeAmount >= 3) return 35;
    if (safeAmount >= 1) return 10;

    return 0;
}

function getDepositExpeditionBoostAmount(amount) {
    const safeAmount = normalizeRewardNumber(amount, 0);

    if (safeAmount >= 10) return 0.60;
    if (safeAmount >= 5) return 0.30;
    if (safeAmount >= 3) return 0.15;
    if (safeAmount >= 1) return 0.05;

    return 0;
}

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
    const safeAmount = normalizeRewardNumber(amount, 0);
    const gemsAmount = getDepositGemsAmount(safeAmount);
    const expeditionBoostAmount = getDepositExpeditionBoostAmount(safeAmount);

    return {
        id,
        telegramId: String(telegramId),
        username: String(username || "Gracz"),

        amount: safeAmount,
        gemsAmount: Math.max(0, Number(gemsAmount) || 0),
        expeditionBoostAmount: Math.max(0, Number(expeditionBoostAmount) || 0),

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
        TON_RECEIVER_WALLET;

    return {
        depositId: String(deposit?.id || ""),
        amount: normalizeRewardNumber(deposit?.amount, 0),
        gemsAmount: Math.max(0, Number(deposit?.gemsAmount) || 0),
        expeditionBoostAmount: Math.max(0, Number(deposit?.expeditionBoostAmount) || 0),
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
    TON_RECEIVER_WALLET,
    getDepositGemsAmount,
    getDepositExpeditionBoostAmount,
    createDeposit,
    buildDepositPaymentData,
    getPlayerDeposits
};