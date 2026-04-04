const { normalizeRewardNumber, safeString } = require("../utils/helpers");

const TON_RECEIVER_WALLET = "UQBTjBORP2cXRNE_hakpG-2DZlBn0uUWME8tKhi7HCcynER5";
const MAX_EXPEDITION_BOOST = 1.0;
const MAX_EXPEDITION_BOOST_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

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

function getDepositExpeditionBoostDurationMs(amount) {
    const safeAmount = normalizeRewardNumber(amount, 0);

    if (safeAmount >= 10) return 7 * 24 * 60 * 60 * 1000;
    if (safeAmount >= 5) return 5 * 24 * 60 * 60 * 1000;
    if (safeAmount >= 3) return 3 * 24 * 60 * 60 * 1000;
    if (safeAmount >= 1) return 1 * 24 * 60 * 60 * 1000;

    return 0;
}

function clampExpeditionBoost(value) {
    const safeValue = normalizeRewardNumber(value, 0);
    return Math.max(0, Math.min(MAX_EXPEDITION_BOOST, safeValue));
}

function applyDepositExpeditionBoost(currentBoost, depositAmount) {
    const safeCurrentBoost = clampExpeditionBoost(currentBoost);
    const addAmount = getDepositExpeditionBoostAmount(depositAmount);

    return clampExpeditionBoost(safeCurrentBoost + addAmount);
}

function getRemainingExpeditionBoostCapacity(currentBoost) {
    const safeCurrentBoost = clampExpeditionBoost(currentBoost);
    return normalizeRewardNumber(
        Math.max(0, MAX_EXPEDITION_BOOST - safeCurrentBoost),
        0
    );
}

function getExpeditionBoostActiveUntil(depositAmount, now = Date.now()) {
    const safeNow = Math.max(0, Number(now) || 0);
    const durationMs = Math.min(
        MAX_EXPEDITION_BOOST_DURATION_MS,
        Math.max(0, Number(getDepositExpeditionBoostDurationMs(depositAmount)) || 0)
    );

    return safeNow + durationMs;
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
    const expeditionBoostDurationMs = getDepositExpeditionBoostDurationMs(safeAmount);

    return {
        id,
        telegramId: String(telegramId),
        username: String(username || "Gracz"),

        amount: safeAmount,
        gemsAmount: Math.max(0, Number(gemsAmount) || 0),
        expeditionBoostAmount: Math.max(0, Number(expeditionBoostAmount) || 0),
        expeditionBoostDurationMs: Math.max(0, Number(expeditionBoostDurationMs) || 0),

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
        expeditionBoostDurationMs: Math.max(0, Number(deposit?.expeditionBoostDurationMs) || 0),
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
    MAX_EXPEDITION_BOOST,
    MAX_EXPEDITION_BOOST_DURATION_MS,
    getDepositGemsAmount,
    getDepositExpeditionBoostAmount,
    getDepositExpeditionBoostDurationMs,
    clampExpeditionBoost,
    applyDepositExpeditionBoost,
    getRemainingExpeditionBoostCapacity,
    getExpeditionBoostActiveUntil,
    createDeposit,
    buildDepositPaymentData,
    getPlayerDeposits
};