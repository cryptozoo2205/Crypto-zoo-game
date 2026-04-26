const { normalizeRewardNumber, safeString } = require("../utils/helpers");

const TON_RECEIVER_WALLET = "";
const MAX_EXPEDITION_BOOST = 10.0;
const MAX_EXPEDITION_BOOST_DURATION_MS = 365 * 24 * 60 * 60 * 1000;
const MAX_DEPOSIT_AMOUNT_USD = 100000;
const MAX_GEMS_FROM_DEPOSIT = 500000;

const UNIQUE_AMOUNT_DECIMALS = 6;
const UNIQUE_AMOUNT_MIN_FRACTION = 0.000001;
const UNIQUE_AMOUNT_MAX_FRACTION = 0.009999;

const DEFAULT_USD_TO_TON_RATE = Number(process.env.DEPOSIT_USD_TO_TON_RATE || 1) || 1;

function getUsdToTonRate() {
    return DEFAULT_USD_TO_TON_RATE > 0 ? DEFAULT_USD_TO_TON_RATE : 1;
}

function clampDepositAmountUsd(amount) {
    return Math.max(0, Math.min(MAX_DEPOSIT_AMOUNT_USD, Number((Number(amount) || 0).toFixed(2))));
}

function roundUsdAmount(amount) {
    const safe = Number(amount) || 0;
    return Number(safe.toFixed(2));
}

function roundTonAmount(amount) {
    const safe = Number(amount) || 0;
    return Number(safe.toFixed(UNIQUE_AMOUNT_DECIMALS));
}

function convertUsdToTon(amountUsd) {
    const safeAmountUsd = clampDepositAmountUsd(amountUsd);
    return roundTonAmount(safeAmountUsd * getUsdToTonRate());
}

function getDepositGemsAmount(amountUsd) {
    const safeAmountUsd = clampDepositAmountUsd(amountUsd);
    return Math.max(0, Math.floor(safeAmountUsd * 5));
}

function getDepositExpeditionBoostAmount(amountUsd) {
    const safeAmountUsd = clampDepositAmountUsd(amountUsd);
    return Number(Math.max(0, safeAmountUsd * 0.06).toFixed(6));
}

function getDepositExpeditionBoostDurationMs(amountUsd) {
    const safeAmountUsd = clampDepositAmountUsd(amountUsd);
    return Math.max(0, Math.floor(safeAmountUsd * 7 * 60 * 60 * 1000));
}

function clampExpeditionBoost(value) {
    const safeValue = normalizeRewardNumber(value, 0);
    return Math.max(0, Math.min(MAX_EXPEDITION_BOOST, safeValue));
}

function applyDepositExpeditionBoost(currentBoost, depositAmountUsd) {
    const safeCurrentBoost = Math.max(0, Number(currentBoost) || 0);
    const addAmount = getDepositExpeditionBoostAmount(depositAmountUsd);
    return clampExpeditionBoost(safeCurrentBoost + addAmount);
}

function getRemainingExpeditionBoostCapacity(currentBoost) {
    const safeCurrentBoost = clampExpeditionBoost(currentBoost);
    return normalizeRewardNumber(
        Math.max(0, MAX_EXPEDITION_BOOST - safeCurrentBoost),
        0
    );
}

function getExpeditionBoostActiveUntil(depositAmountUsd, now = Date.now(), currentActiveUntil = 0) {
    const safeNow = Math.max(0, Number(now) || 0);
    const safeCurrentActiveUntil = Math.max(0, Number(currentActiveUntil) || 0);
    const durationMs = Math.min(
        MAX_EXPEDITION_BOOST_DURATION_MS,
        Math.max(0, Number(getDepositExpeditionBoostDurationMs(depositAmountUsd)) || 0)
    );

    const durationBaseTime = safeCurrentActiveUntil > safeNow ? safeCurrentActiveUntil : safeNow;
    return durationBaseTime + durationMs;
}

function generateUniqueFraction() {
    const minInt = Math.round(UNIQUE_AMOUNT_MIN_FRACTION * 1_000_000);
    const maxInt = Math.round(UNIQUE_AMOUNT_MAX_FRACTION * 1_000_000);
    const randomInt = Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt;

    return Number((randomInt / 1_000_000).toFixed(UNIQUE_AMOUNT_DECIMALS));
}

function buildExpectedAmount(baseAmountTon, uniqueFraction = 0) {
    const safeBaseAmountTon = roundTonAmount(Math.max(0, Number(baseAmountTon) || 0));
    const safeFraction = Math.max(0, Number(uniqueFraction) || 0);

    return roundTonAmount(safeBaseAmountTon + safeFraction);
}

function createDeposit({
    telegramId,
    username,
    amountUsd,
    baseAmountUsd,
    source = "ton",
    asset = "TON",
    walletAddress = ""
}) {
    const now = Date.now();
    const randomPart = Math.random().toString(36).slice(2, 8);
    const id = `dp_${now}_${randomPart}`;

    const safeBaseAmountUsd = clampDepositAmountUsd(baseAmountUsd ?? amountUsd);
    const safeBaseAmountTon = convertUsdToTon(safeBaseAmountUsd);

    const uniqueFraction = generateUniqueFraction();
    const expectedAmount = buildExpectedAmount(safeBaseAmountTon, uniqueFraction);

    const gemsAmount = Math.max(
        0,
        Math.min(MAX_GEMS_FROM_DEPOSIT, Number(getDepositGemsAmount(safeBaseAmountUsd)) || 0)
    );

    const expeditionBoostAmount = clampExpeditionBoost(
        getDepositExpeditionBoostAmount(safeBaseAmountUsd)
    );

    const expeditionBoostDurationMs = Math.min(
        MAX_EXPEDITION_BOOST_DURATION_MS,
        Math.max(0, Number(getDepositExpeditionBoostDurationMs(safeBaseAmountUsd)) || 0)
    );

    return {
        id,
        telegramId: String(telegramId || ""),
        username: String(username || "Gracz"),

        amount: expectedAmount,
        tonAmount: expectedAmount,
        amountUsd: safeBaseAmountUsd,
        baseAmount: safeBaseAmountUsd,
        baseAmountUsd: safeBaseAmountUsd,
        baseAmountTon: safeBaseAmountTon,
        expectedAmount,
        uniqueFraction,

        gemsAmount,
        expeditionBoostAmount,
        expeditionBoostDurationMs,

        source: safeString(source, "ton") || "ton",
        asset: safeString(asset, "TON") || "TON",
        currency: safeString(asset, "TON") || "TON",
        network: "TON",
        walletAddress: safeString(walletAddress, ""),

        status: "created",
        paymentComment: "",
        txHash: "",

        createdAt: now,
        updatedAt: now,
        expiresAt: now + 5 * 60 * 1000,

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
        tonAmount: roundTonAmount(deposit?.tonAmount ?? deposit?.amount),
        baseAmount: roundUsdAmount(deposit?.baseAmountUsd ?? deposit?.baseAmount),
        baseAmountUsd: roundUsdAmount(deposit?.baseAmountUsd ?? deposit?.baseAmount),
        baseAmountTon: roundTonAmount(deposit?.baseAmountTon),
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
        currency: String(deposit?.currency || deposit?.asset || "TON"),
        network: String(deposit?.network || "TON"),
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
    getUsdToTonRate,
    convertUsdToTon,
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