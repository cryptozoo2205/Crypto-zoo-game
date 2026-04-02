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

router.post("/verify", async (req, res) => {
    try {
        const depositId = safeString(req.body?.depositId, "");

        if (!depositId) {
            return res.status(400).json({ error: "Missing depositId" });
        }

        const result = await verifySingleDepositById(depositId);

        if (!result.ok) {
            return res.json({
                ok: true,
                matched: false,
                message: result.error || "Deposit not matched yet",
                duplicateTxHash: !!result.duplicateTxHash,
                deposit: result.deposit || null,
                player: result.player || null
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
   VERIFY PLAYER PENDING DEPOSITS
========================= */

router.post("/verify-player", async (req, res) => {
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