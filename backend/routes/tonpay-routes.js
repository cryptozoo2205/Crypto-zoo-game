const express = require("express");
const router = express.Router();

const tonpay = require("../services/tonpay-service");

router.post("/create", async (req, res) => {
    try {
        const telegramId =
            req.body?.telegramId ||
            req.body?.playerId ||
            "guest";

        const usdAmount =
            Number(req.body?.usdAmount || req.body?.amount || 1);

        const result = await tonpay.createPayment(telegramId, usdAmount);

        const tonAmount = Number(result?.tonAmount || 0);
        const baseAmountUsd = Number(result?.usdAmount || usdAmount || 0);
        const orderId = String(result?.orderId || `tonpay_${Date.now()}`);
        const paymentUrl = String(result?.paymentUrl || "").trim();

        return res.json({
            ok: true,
            provider: "TON_PAY",
            orderId,
            paymentUrl,
            deposit: {
                depositId: orderId,
                id: orderId,
                provider: "TON_PAY",
                status: "created",
                amount: tonAmount,
                expectedAmount: tonAmount,
                tonAmount: tonAmount,
                baseAmount: baseAmountUsd,
                baseAmountUsd: baseAmountUsd,
                uniqueFraction: 0
            },
            payment: {
                provider: "TON_PAY",
                orderId,
                paymentUrl,
                amount: tonAmount,
                expectedAmount: tonAmount,
                tonAmount: tonAmount,
                baseAmount: baseAmountUsd,
                baseAmountUsd: baseAmountUsd,
                uniqueFraction: 0,
                bonus: result?.bonus || null
            }
        });
    } catch (error) {
        console.error("TONPAY CREATE ERROR:", error);

        return res.status(500).json({
            ok: false,
            error: "payment_create_failed"
        });
    }
});

module.exports = router;
