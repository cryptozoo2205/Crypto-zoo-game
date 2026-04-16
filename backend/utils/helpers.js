function clamp(val, min, max) {
    const num = Number(val);
    if (!Number.isFinite(num)) return min;
    return Math.max(min, Math.min(max, num));
}

function normalizeNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function normalizeRewardNumber(value, fallback = 0) {
    const num = normalizeNumber(value, fallback);

    if (!Number.isFinite(num)) return fallback;

    const safe = Math.max(0, num);

    return Number(safe.toFixed(3));
}

function safeString(value, fallback = "") {
    return String(value ?? fallback).trim();
}

function normalizeTelegramUser(
    rawTelegramUser,
    fallbackTelegramId = "local-player",
    fallbackUsername = "Gracz"
) {
    const safe =
        rawTelegramUser && typeof rawTelegramUser === "object"
            ? rawTelegramUser
            : {};

    const id = safeString(
        safe.id,
        safeString(fallbackTelegramId, "local-player")
    );

    const username = safeString(
        safe.username,
        safeString(fallbackUsername, "")
    );

    const firstName = safeString(
        safe.first_name,
        username || "Gracz"
    );

    const lastName = safeString(safe.last_name, "");
    const languageCode = safeString(safe.language_code, "pl");

    return {
        id,
        username,
        first_name: firstName,
        last_name: lastName,
        language_code: languageCode,
        isMock: !!safe.isMock,
        isTelegramWebApp: !!safe.isTelegramWebApp
    };
}

function sanitizeReferrerId(value) {
    const raw = safeString(value, "");
    if (!raw) return "";

    if (raw.startsWith("ref_")) {
        return safeString(raw.slice(4), "");
    }

    return raw;
}

function extractReferrerId(req) {
    return sanitizeReferrerId(
        req.query?.ref ||
            req.query?.startapp ||
            req.query?.start ||
            req.body?.ref ||
            req.body?.referrerId ||
            req.body?.referralCode ||
            ""
    );
}

module.exports = {
    clamp,
    normalizeNumber,
    normalizeRewardNumber,
    safeString,
    normalizeTelegramUser,
    sanitizeReferrerId,
    extractReferrerId
};