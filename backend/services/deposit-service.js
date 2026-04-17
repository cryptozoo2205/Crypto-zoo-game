const { normalizeRewardNumber, safeString } = require("../utils/helpers");

const TON_RECEIVER_WALLET = "";
const MAX_EXPEDITION_BOOST = 1.0;
const MAX_EXPEDITION_BOOST_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_DEPOSIT_AMOUNT = 100000;
const MAX_GEMS_FROM_DEPOSIT = 150;

const UNIQUE_AMOUNT_DECIMALS = 6;
const UNIQUE_AMOUNT_MIN_FRACTION = 0.000001;
const UNIQUE_AMOUNT_MAX_FRACTION = 0.009999;

function clampDepositAmount(amount) {
    return Math.max(0, Math.min(MAX_DEPOSIT_AMOUNT, normalizeRewardNumber(amount, 0)));
}

function roundTonAmount(amount) {
    const safe = Number(amount) || 0;
    return Number(safe.toFixed(UNIQUE_AMOUNT_DECIMALS));
}

function getDepositGemsAmount(amount) {
    const safeAmount = clampDepositAmount(amount);

    if (safeAmount >= 10) return 150;
    if (safeAmount >= 5) return 70;
    if (safeAmount >= 3) return 35;
    if (safeAmount >= 1) return 10;

    return 0;
}

function getDepositExpeditionBoostAmount(amount) {
    const safeAmount = clampDepositAmount(amount);

    if (safeAmount >= 10) return 0.60;
    if (safeAmount >= 5) return 0.30;
    if (safeAmount >= 3) return 0.15;
    if (safeAmount >= 1) return 0.05;

    return 0;
}

function getDepositExpeditionBoostDurationMs(amount) {
    const safeAmount = clampDepositAmount(amount);

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

function generateUniqueFraction() {
    const minInt = Math.round(UNIQUE_AMOUNT_MIN_FRACTION * 1_000_000);
    const maxInt = Math.round(UNIQUE_AMOUNT_MAX_FRACTION * 1_000_000);
    const randomInt = Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt;

    return Number((randomInt / 1_000_000).toFixed(UNIQUE_AMOUNT_DECIMALS));
}

function buildExpectedAmount(baseAmount, uniqueFraction = 0) {
    const safeBaseAmount = clampDepositAmount(baseAmount);
    const safeFraction = Math.max(0, Number(uniqueFraction) || 0);

    return roundTonAmount(safeBaseAmount + safeFraction);
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

    const safeBaseAmount = clampDepositAmount(amount);
    const uniqueFraction = generateUniqueFraction();
    const expectedAmount = buildExpectedAmount(safeBaseAmount, uniqueFraction);

    const gemsAmount = Math.max(
        0,
        Math.min(MAX_GEMS_FROM_DEPOSIT, Number(getDepositGemsAmount(safeBaseAmount)) || 0)
    );

    const expeditionBoostAmount = clampExpeditionBoost(
        getDepositExpeditionBoostAmount(safeBaseAmount)
    );

    const expeditionBoostDurationMs = Math.min(
        MAX_EXPEDITION_BOOST_DURATION_MS,
        Math.max(0, Number(getDepositExpeditionBoostDurationMs(safeBaseAmount)) || 0)
    );

    return {
        id,
        telegramId: String(telegramId || ""),
        username: String(username || "Gracz"),

        amount: expectedAmount,
        baseAmount: safeBaseAmount,
        expectedAmount,
        uniqueFraction,

        gemsAmount,
        expeditionBoostAmount,
        expeditionBoostDurationMs,

        source: safeString(source, "ton") || "ton",
        asset: safeString(asset, "TON") || "TON",
        walletAddress: safeString(walletAddress, ""),

        status: "created",
        paymentComment: "",
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
        process.env.TON_WALLET_ADDRESS ||
        TON_RECEIVER_WALLET;

    return {
        depositId: String(deposit?.id || ""),
        amount: roundTonAmount(deposit?.amount),
        baseAmount: roundTonAmount(deposit?.baseAmount),
        expectedAmount: roundTonAmount(deposit?.expectedAmount || deposit?.amount),
        uniqueFraction: roundTonAmount(deposit?.uniqueFraction || 0),
        gemsAmount: Math.max(
            0,
            Math.min(MAX_GEMS_FROM_DEPOSIT, Number(deposit?.gemsAmount) || 0)
        ),
        expeditionBoostAmount: clampExpeditionBoost(deposit?.expeditionBoostAmount),
        expeditionBoostDurationMs: Math.min(
            MAX_EXPEDITION_BOOST_DURATION_MS,
            Math.max(0, Number(deposit?.expeditionBoostDurationMs) || 0)
        ),
        asset: String(deposit?.asset || "TON"),
        source: String(deposit?.source || "ton"),
        receiverAddress: String(receiverAddress || ""),
        paymentComment: "",
        expiresAt: Math.max(0, Number(deposit?.expiresAt || 0))
    };
}

function getPlayerDeposits(db, telegramId) {
    return (Array.isArray(db?.deposits) ? db.deposits : [])
        .filter((d) => String(d?.telegramId || "") === String(telegramId || ""))
        .sort((a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));
}

module.exports = {
    TON_RECEIVER_WALLET,
    MAX_EXPEDITION_BOOST,
    MAX_EXPEDITION_BOOST_DURATION_MS,
    UNIQUE_AMOUNT_DECIMALS,
    UNIQUE_AMOUNT_MIN_FRACTION,
    UNIQUE_AMOUNT_MAX_FRACTION,
    getDepositGemsAmount,
    getDepositExpeditionBoostAmount,
    getDepositExpeditionBoostDurationMs,
    clampExpeditionBoost,
    applyDepositExpeditionBoost,
    getRemainingExpeditionBoostCapacity,
    getExpeditionBoostActiveUntil,
    generateUniqueFraction,
    buildExpectedAmount,
    createDeposit,
    buildDepositPaymentData,
    getPlayerDeposits
};