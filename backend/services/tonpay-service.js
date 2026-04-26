const crypto = require("crypto");

const MIN_USD = 1;
const MAX_USD = 10000;

function getUsdToTonRate() {
    const raw = Number(process.env.DEPOSIT_USD_TO_TON_RATE || 1);
    return raw > 0 ? raw : 1;
}

function clampUsd(value) {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return MIN_USD;
    return Math.max(MIN_USD, Math.min(MAX_USD, Number(n.toFixed(2))));
}

function usdToTon(usd) {
    return Number((clampUsd(usd) * getUsdToTonRate()).toFixed(6));
}

function buildBonus(usd) {
    const safe = clampUsd(usd);

    return {
        gems: Math.floor(safe * 5),
        expeditionBoostPercent: Number((safe * 6).toFixed(2)),
        expeditionHours: Math.max(1, Math.floor(safe * 7))
    };
}

function createOrderId(playerId) {
    return [
        "cz",
        String(playerId || "guest"),
        Date.now(),
        crypto.randomBytes(4).toString("hex")
    ].join("_");
}

async function createPayment(playerId, usdAmount) {
    const usd = clampUsd(usdAmount);
    const ton = usdToTon(usd);
    const orderId = createOrderId(playerId);

    return {
        ok: true,
        provider: "TON_PAY",
        orderId,
        usdAmount: usd,
        tonAmount: ton,
        asset: "TON",
        bonus: buildBonus(usd),

        /* tymczasowo link testowy – podmienimy na prawdziwy TON Pay */
        paymentUrl: `https://app.tonkeeper.com/transfer/${process.env.TON_WALLET_ADDRESS}?amount=${Math.floor(ton * 1000000000)}&text=${orderId}`
    };
}

module.exports = {
    createPayment,
    clampUsd,
    usdToTon,
    buildBonus
};
