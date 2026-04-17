window.CryptoZoo = window.CryptoZoo || {};
window.CryptoZoo.api = window.CryptoZoo.api || {};

Object.assign(window.CryptoZoo.api, {
    getReferralCodeFromRaw(rawValue) {
        const safe = String(rawValue || "").trim();

        if (!safe) {
            return "";
        }

        if (safe.startsWith("ref_")) {
            return safe.slice(4).trim();
        }

        return safe;
    },

    getReferralCode() {
        const telegramStart = this.getTelegramStartParam();
        const urlStart = this.getUrlStartParam();

        return this.getReferralCodeFromRaw(telegramStart || urlStart);
    },

    async applyReferralIfNeeded() {
        const telegramId = await this.getPlayerId();
        const username = await this.getUsername();
        const referralCode = this.getReferralCode();

        if (!telegramId || !referralCode) {
            return null;
        }

        if (String(telegramId) === String(referralCode)) {
            return null;
        }

        const localKey = `cryptozoo_ref_applied_${telegramId}`;
        const alreadyApplied = String(localStorage.getItem(localKey) || "").trim();

        if (alreadyApplied === referralCode) {
            return null;
        }

        try {
            const response = await this.request("/referrals/apply", {
                method: "POST",
                body: JSON.stringify({
                    telegramId,
                    username,
                    referralCode
                }),
                timeoutMs: 5000,
                retryCount: 1
            });

            localStorage.setItem(localKey, referralCode);
            return response;
        } catch (error) {
            console.warn("Referral apply failed:", error);
            return null;
        }
    }
});