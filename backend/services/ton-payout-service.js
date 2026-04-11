const { Address, TonClient, WalletContractV4, internal, SendMode, toNano, fromNano } = require("@ton/ton");
const { mnemonicToPrivateKey } = require("@ton/crypto");

const { safeString, normalizeRewardNumber } = require("../utils/helpers");

const TONCENTER_MAINNET_RPC = "https://toncenter.com/api/v2/jsonRPC";
const TONCENTER_TESTNET_RPC = "https://testnet.toncenter.com/api/v2/jsonRPC";

const DEFAULT_SEND_TIMEOUT_MS = 90000;
const DEFAULT_SEQNO_POLL_MS = 1500;
const DEFAULT_SEQNO_POLL_ATTEMPTS = 40;
const DEFAULT_FEE_BUFFER_TON = 0.08;
const DEFAULT_MIN_WALLET_RESERVE_TON = 1.0;

let payoutQueue = Promise.resolve();

function getEnv(name, fallback = "") {
    return safeString(process.env[name], fallback).trim();
}

function getBooleanEnv(name, fallback = false) {
    const raw = getEnv(name, fallback ? "true" : "false").toLowerCase();
    return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function getNumberEnv(name, fallback = 0) {
    const value = Number(process.env[name]);
    return Number.isFinite(value) ? value : fallback;
}

function getTonNetwork() {
    const raw = getEnv("TON_NETWORK", "mainnet").toLowerCase();
    return raw === "testnet" ? "testnet" : "mainnet";
}

function getToncenterEndpoint() {
    const custom = getEnv("TONCENTER_RPC_URL", "");
    if (custom) return custom;

    return getTonNetwork() === "testnet"
        ? TONCENTER_TESTNET_RPC
        : TONCENTER_MAINNET_RPC;
}

function getToncenterApiKey() {
    return getEnv("TONCENTER_API_KEY", "");
}

function getPayoutMnemonicWords() {
    const raw = getEnv("TON_HOT_WALLET_MNEMONIC", "");
    if (!raw) return [];

    return raw
        .split(/\s+/)
        .map((word) => word.trim())
        .filter(Boolean);
}

function getWithdrawTonPerReward() {
    return Math.max(
        0,
        normalizeRewardNumber(
            getNumberEnv("WITHDRAW_TON_PER_REWARD", 0),
            0
        )
    );
}

function getWalletReserveTon() {
    return Math.max(
        0,
        normalizeRewardNumber(
            getNumberEnv("TON_HOT_WALLET_MIN_RESERVE_TON", DEFAULT_MIN_WALLET_RESERVE_TON),
            DEFAULT_MIN_WALLET_RESERVE_TON
        )
    );
}

function getFeeBufferTon() {
    return Math.max(
        0,
        normalizeRewardNumber(
            getNumberEnv("TON_PAYOUT_FEE_BUFFER_TON", DEFAULT_FEE_BUFFER_TON),
            DEFAULT_FEE_BUFFER_TON
        )
    );
}

function getSendTimeoutMs() {
    return Math.max(
        5000,
        Math.floor(getNumberEnv("TON_PAYOUT_SEND_TIMEOUT_MS", DEFAULT_SEND_TIMEOUT_MS))
    );
}

function getSeqnoPollMs() {
    return Math.max(
        500,
        Math.floor(getNumberEnv("TON_PAYOUT_SEQNO_POLL_MS", DEFAULT_SEQNO_POLL_MS))
    );
}

function getSeqnoPollAttempts() {
    return Math.max(
        5,
        Math.floor(getNumberEnv("TON_PAYOUT_SEQNO_POLL_ATTEMPTS", DEFAULT_SEQNO_POLL_ATTEMPTS))
    );
}

function isAutoPayoutEnabled() {
    return getBooleanEnv("TON_AUTO_PAYOUT_ENABLED", false);
}

function isAutoPayoutConfigured() {
    return (
        isAutoPayoutEnabled() &&
        getPayoutMnemonicWords().length >= 12 &&
        getWithdrawTonPerReward() > 0
    );
}

function formatTonAmount(value) {
    return Number(normalizeRewardNumber(value, 0).toFixed(9));
}

function toNanoSafe(value) {
    return toNano(formatTonAmount(value).toFixed(9));
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getWithdrawNetRewardAmount(withdrawRequest) {
    return normalizeRewardNumber(
        withdrawRequest?.netRewardAmount ??
            withdrawRequest?.grossRewardAmount ??
            withdrawRequest?.rewardAmount ??
            withdrawRequest?.amount,
        0
    );
}

function getWithdrawTonAmount(withdrawRequest) {
    const netRewardAmount = getWithdrawNetRewardAmount(withdrawRequest);
    const tonPerReward = getWithdrawTonPerReward();

    return formatTonAmount(netRewardAmount * tonPerReward);
}

function validateDestinationAddress(addressRaw) {
    const safe = safeString(addressRaw, "").trim();
    if (!safe) {
        throw new Error("Missing TON destination address");
    }

    try {
        return Address.parse(safe);
    } catch (error) {
        throw new Error("Invalid TON destination address");
    }
}

async function getTonClient() {
    return new TonClient({
        endpoint: getToncenterEndpoint(),
        apiKey: getToncenterApiKey() || undefined
    });
}

async function getHotWalletContext() {
    const words = getPayoutMnemonicWords();

    if (words.length < 12) {
        throw new Error("TON_HOT_WALLET_MNEMONIC is missing or invalid");
    }

    const keyPair = await mnemonicToPrivateKey(words);

    const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey
    });

    const client = await getTonClient();
    const walletOpened = client.open(wallet);

    return {
        client,
        wallet,
        walletOpened,
        keyPair
    };
}

async function getHotWalletBalanceTon() {
    const { client, wallet } = await getHotWalletContext();
    const balance = await client.getBalance(wallet.address);
    return formatTonAmount(Number(fromNano(balance)));
}

async function getHotWalletAddress() {
    const { wallet } = await getHotWalletContext();
    return wallet.address.toString();
}

function buildPayoutComment(withdrawRequest) {
    const id = safeString(withdrawRequest?.id, "");
    return id ? `CZ payout ${id}` : "CZ payout";
}

async function waitForSeqnoIncrease(walletOpened, seqnoBefore) {
    const attempts = getSeqnoPollAttempts();
    const delayMs = getSeqnoPollMs();

    for (let i = 0; i < attempts; i += 1) {
        await sleep(delayMs);

        const currentSeqno = await walletOpened.getSeqno();
        if (currentSeqno > seqnoBefore) {
            return currentSeqno;
        }
    }

    throw new Error("TON payout broadcast timeout: seqno did not increase");
}

async function sendTonPayoutNow(withdrawRequest) {
    if (!isAutoPayoutEnabled()) {
        throw new Error("TON auto payout is disabled");
    }

    if (!isAutoPayoutConfigured()) {
        throw new Error("TON auto payout is not fully configured");
    }

    const destination = validateDestinationAddress(withdrawRequest?.tonAddress);
    const tonAmount = getWithdrawTonAmount(withdrawRequest);

    if (tonAmount <= 0) {
        throw new Error("Calculated TON payout amount is 0");
    }

    const amountNano = toNanoSafe(tonAmount);
    const reserveNano = toNanoSafe(getWalletReserveTon());
    const feeBufferNano = toNanoSafe(getFeeBufferTon());

    const {
        client,
        wallet,
        walletOpened,
        keyPair
    } = await getHotWalletContext();

    const walletBalance = await client.getBalance(wallet.address);
    const requiredTotalNano = amountNano + reserveNano + feeBufferNano;

    if (walletBalance < requiredTotalNano) {
        throw new Error(
            `Insufficient hot wallet balance. Need at least ${formatTonAmount(Number(fromNano(requiredTotalNano)))} TON including reserve`
        );
    }

    const seqnoBefore = await walletOpened.getSeqno();
    const comment = buildPayoutComment(withdrawRequest);

    const sendPromise = walletOpened.sendTransfer({
        seqno: seqnoBefore,
        secretKey: keyPair.secretKey,
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        messages: [
            internal({
                to: destination,
                value: amountNano,
                bounce: false,
                body: comment
            })
        ]
    });

    const timeoutMs = getSendTimeoutMs();

    await Promise.race([
        sendPromise,
        new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("TON payout send timeout"));
            }, timeoutMs);
        })
    ]);

    const seqnoAfter = await waitForSeqnoIncrease(walletOpened, seqnoBefore);

    return {
        ok: true,
        walletAddress: wallet.address.toString(),
        destinationAddress: destination.toString(),
        payoutTonAmount: tonAmount,
        payoutTonAmountNano: amountNano.toString(),
        seqnoBefore,
        seqnoAfter,
        payoutTxHash: `wallet:${wallet.address.toString()}:seqno:${seqnoBefore}`,
        note: `TON auto payout sent (${tonAmount} TON)`
    };
}

async function sendTonPayout(withdrawRequest) {
    payoutQueue = payoutQueue
        .catch(() => null)
        .then(() => sendTonPayoutNow(withdrawRequest));

    return payoutQueue;
}

module.exports = {
    isAutoPayoutEnabled,
    isAutoPayoutConfigured,
    getTonNetwork,
    getToncenterEndpoint,
    getHotWalletAddress,
    getHotWalletBalanceTon,
    getWithdrawTonAmount,
    sendTonPayout
};