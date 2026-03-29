const express = require("express");

const { safeString } = require("../utils/helpers");
const {
    verifySingleDepositById,
    verifyPendingDepositsForPlayer
} = require("../services/deposit-verifier-service");

const router = express.Router();

/* =========================
   VERIFY SINGLE DEPOSIT
========================= */

router.post("/api/deposit/verify", async (req, res) => {
    try {
        const depositId = safeString(req.body?.depositId, "");

        if (!depositId) {
            return res.status(400).json({ error: "Missing depositId" });
        }

        const result = await verifySingleDepositById(depositId);

        // 🔥 FIX: nie wywalaj błędu → zwróć normalny response
        if (!result.ok) {
            return res.json({
                ok: true,
                matched: false,
                message: result.error || "Deposit not matched yet"
            });
        }

        return res.json(result);
    } catch (error) {
        console.error("Deposit verify error:", error);
        return res.status(500).json({
            error: error.message || "Deposit verification failed"
        });
    }
});

/* =========================
   VERIFY PLAYER PENDING DEPOSITS (AUTO VERIFY)
========================= */

router.post("/api/deposit/verify-player", async (req, res) => {
    try {
        const telegramId = safeString(req.body?.telegramId, "");

        if (!telegramId) {
            return res.status(400).json({ error: "Missing telegramId" });
        }

        const result = await verifyPendingDepositsForPlayer(telegramId);

        return res.json({
            ok: true,
            checked: result.checked || 0,
            matched: result.matched || 0,
            skippedDuplicates: result.skippedDuplicates || 0,
            player: result.player || null
        });
    } catch (error) {
        console.error("Deposit verify player error:", error);
        return res.status(500).json({
            error: error.message || "Player deposit verification failed"
        });
    }
});

module.exports = router;