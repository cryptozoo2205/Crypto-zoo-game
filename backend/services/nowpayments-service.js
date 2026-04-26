const https = require("https");

const API_KEY = String(process.env.NOWPAYMENTS_API_KEY || "").trim();
const BASE_URL = "api.nowpayments.io";

function request(path, method = "GET", data = null) {
    return new Promise((resolve, reject) => {
        const body = data ? JSON.stringify(data) : null;

        const req = https.request(
            {
                hostname: BASE_URL,
                path,
                method,
                headers: {
                    "x-api-key": API_KEY,
                    "Content-Type": "application/json",
                    ...(body ? { "Content-Length": Buffer.byteLength(body) } : {})
                }
            },
            (res) => {
                let raw = "";

                res.on("data", (chunk) => {
                    raw += chunk;
                });

                res.on("end", () => {
                    let json = {};
                    try {
                        json = raw ? JSON.parse(raw) : {};
                    } catch (error) {
                        return reject(new Error(`NOWPayments invalid JSON: ${raw}`));
                    }

                    if (res.statusCode && res.statusCode >= 400) {
                        return reject(
                            new Error(
                                json?.message ||
                                json?.error ||
                                `NOWPayments HTTP ${res.statusCode}`
                            )
                        );
                    }

                    resolve(json);
                });
            }
        );

        req.on("error", reject);

        if (body) req.write(body);
        req.end();
    });
}

async function createPayment({ amountUsd, orderId, orderDescription }) {
    if (!API_KEY) {
        throw new Error("NOWPAYMENTS_API_KEY missing");
    }

    const safeAmountUsd = Number(amountUsd || 0);
    if (!Number.isFinite(safeAmountUsd) || safeAmountUsd < 1) {
        throw new Error("Invalid deposit amount");
    }

    return request("/v1/payment", "POST", {
        price_amount: Number(safeAmountUsd.toFixed(2)),
        price_currency: "usd",
        pay_currency: "ton",
        order_id: String(orderId || `dep_${Date.now()}`),
        order_description: String(orderDescription || "CryptoZoo deposit"),
        ipn_callback_url: "https://cryptozoo.pl/api/payments/nowpayments/ipn"
    });
}

async function getPaymentStatus(paymentId) {
    if (!API_KEY) {
        throw new Error("NOWPAYMENTS_API_KEY missing");
    }

    const safePaymentId = String(paymentId || "").trim();
    if (!safePaymentId) {
        throw new Error("paymentId missing");
    }

    return request(`/v1/payment/${encodeURIComponent(safePaymentId)}`, "GET");
}

module.exports = {
    createPayment,
    getPaymentStatus
};
