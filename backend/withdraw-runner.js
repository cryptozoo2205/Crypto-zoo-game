require("dotenv").config();

const { readDb, writeDb } = require("./db/db");
const { normalizePlayer, getPlayerOrCreate } = require("./services/player-service");
const {
    getNextPendingWithdraw,
    normalizeWithdrawStatus,
    markWithdrawAsProcessing,
    markWithdrawAsPaid,
    releaseWithdrawToPending,
    markWithdrawAsFailed,
    applyPaidWithdrawToPlayer
} = require("./services/withdraw-service");
const {
    isAutoPayoutEnabled,
    isAutoPayoutConfigured,
    sendTonPayout,
    getHotWalletAddress,
    getHotWalletBalanceTon
} = require("./services/ton-payout-service");
const {
    notifyWithdrawPaid
} = require("./bot");

const LOOP_INTERVAL_MS = Math.max(
    5000,
    Number(process.env.TON_AUTO_PAYOUT_LOOP_MS) || 15000
);

let isLoopRunning = false;

function ensureDbShape(db) {
    db.players = db.players && typeof db.players === "object" ? db.players : {};
    db.withdrawRequests = Array.isArray(db.withdrawRequests) ? db.withdrawRequests : [];
    return db;
}

async function processSingleWithdraw() {
    const db = ensureDbShape(readDb());
    const request = getNextPendingWithdraw(db);

    if (!request) {
        return { ok: true, processed: false, reason: "no_pending_withdraws" };
    }

    const currentStatus = normalizeWithdrawStatus(request.status);
    if (currentStatus === "processing") {
        console.log(`[withdraw-runner] Releasing stale processing lock for ${request.id}`);
        releaseWithdrawToPending(request, "Stale processing lock released");
        writeDb(db);
    }

    const player = getPlayerOrCreate(db, request.telegramId, request.username);
    db.players[player.telegramId] = normalizePlayer(player);

    markWithdrawAsProcessing(request, "Auto payout started");
    writeDb(db);

    try {
        const payoutResult = await sendTonPayout(request);

        const liveDb = ensureDbShape(readDb());
        const liveRequest = liveDb.withdrawRequests.find(
            (item) => String(item?.id || "") === String(request.id)
        );

        if (!liveRequest) {
            throw new Error("Withdraw request disappeared during processing");
        }

        const livePlayer = getPlayerOrCreate(
            liveDb,
            liveRequest.telegramId,
            liveRequest.username
        );

        const updatedPlayer = applyPaidWithdrawToPlayer(livePlayer, liveRequest);
        if (!updatedPlayer) {
            throw new Error("applyPaidWithdrawToPlayer failed");
        }

        const updatedRequest = markWithdrawAsPaid(
            liveRequest,
            payoutResult?.note || "TON auto payout sent",
            payoutResult?.payoutTxHash || ""
        );

        if (!updatedRequest) {
            throw new Error("markWithdrawAsPaid failed");
        }

        liveDb.players[updatedPlayer.telegramId] = normalizePlayer(updatedPlayer);
        writeDb(liveDb);

        try {
            await notifyWithdrawPaid(updatedRequest);
        } catch (notifyError) {
            console.error("[withdraw-runner] notifyWithdrawPaid failed:", notifyError?.message || notifyError);
        }

        console.log(
            `[withdraw-runner] PAID ${updatedRequest.id} -> ${updatedRequest.tonAddress} | tx=${updatedRequest.payoutTxHash}`
        );

        return {
            ok: true,
            processed: true,
            withdrawId: updatedRequest.id,
            payoutTxHash: updatedRequest.payoutTxHash
        };
    } catch (error) {
        const failDb = ensureDbShape(readDb());
        const failRequest = failDb.withdrawRequests.find(
            (item) => String(item?.id || "") === String(request.id)
        );

        if (failRequest) {
            const message = String(error?.message || "TON auto payout failed");

            if (
                message.includes("disabled") ||
                message.includes("not fully configured") ||
                message.includes("Invalid TON destination address") ||
                message.includes("Missing TON destination address")
            ) {
                markWithdrawAsFailed(failRequest, message);
            } else {
                releaseWithdrawToPending(failRequest, message);
            }

            writeDb(failDb);
        }

        console.error(
            `[withdraw-runner] FAILED ${request.id}:`,
            error?.message || error
        );

        return {
            ok: false,
            processed: true,
            withdrawId: request.id,
            error: String(error?.message || error)
        };
    }
}

async function loopOnce() {
    if (!isAutoPayoutEnabled()) {
        console.log("[withdraw-runner] TON_AUTO_PAYOUT_ENABLED is false");
        return;
    }

    if (!isAutoPayoutConfigured()) {
        console.log("[withdraw-runner] Auto payout not fully configured yet");
        return;
    }

    const result = await processSingleWithdraw();

    if (!result.processed) {
        return;
    }
}

async function startLoop() {
    if (isLoopRunning) {
        return;
    }

    isLoopRunning = true;

    console.log("[withdraw-runner] started");
    console.log(`[withdraw-runner] loop interval: ${LOOP_INTERVAL_MS}ms`);

    try {
        const hotWalletAddress = await getHotWalletAddress();
        const hotWalletBalanceTon = await getHotWalletBalanceTon();

        console.log("[withdraw-runner] hot wallet:", hotWalletAddress);
        console.log("[withdraw-runner] hot wallet balance:", hotWalletBalanceTon, "TON");
    } catch (error) {
        console.error("[withdraw-runner] wallet info read failed:", error?.message || error);
    }

    while (true) {
        try {
            await loopOnce();
        } catch (error) {
            console.error("[withdraw-runner] loop error:", error?.message || error);
        }

        await new Promise((resolve) => setTimeout(resolve, LOOP_INTERVAL_MS));
    }
}

startLoop().catch((error) => {
    console.error("[withdraw-runner] fatal error:", error?.message || error);
    process.exit(1);
});