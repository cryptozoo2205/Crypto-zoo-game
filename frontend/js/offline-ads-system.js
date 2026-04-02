window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offlineAds = {
    MAX_HOURS: 12,
    HOURS_PER_AD: 2,
    RESET_INTERVAL_MS: 24 * 60 * 60 * 1000,

    getNow() {
        return Date.now();
    },

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};

        CryptoZoo.state.offlineAdsHours = Math.max(
            0,
            Math.min(this.MAX_HOURS, Number(CryptoZoo.state.offlineAdsHours) || 0)
        );

        CryptoZoo.state.offlineAdsResetAt = Math.max(
            0,
            Number(CryptoZoo.state.offlineAdsResetAt) || 0
        );

        if (!CryptoZoo.state.offlineAdsResetAt) {
            CryptoZoo.state.offlineAdsResetAt = this.getNow();
        }

        this.applyDailyResetIfNeeded();
    },

    applyDailyResetIfNeeded() {
        const now = this.getNow();
        const lastResetAt = Math.max(0, Number(CryptoZoo.state?.offlineAdsResetAt) || 0);

        if (!lastResetAt) {
            CryptoZoo.state.offlineAdsResetAt = now;
            return false;
        }

        if (now - lastResetAt < this.RESET_INTERVAL_MS) {
            return false;
        }

        CryptoZoo.state.offlineAdsHours = 0;
        CryptoZoo.state.offlineAdsResetAt = now;
        CryptoZoo.api?.savePlayer?.();

        return true;
    },

    getCurrentHours() {
        this.ensureState();
        return Math.max(
            0,
            Math.min(this.MAX_HOURS, Number(CryptoZoo.state?.offlineAdsHours) || 0)
        );
    },

    getMaxHours() {
        return this.MAX_HOURS;
    },

    getRemainingHours() {
        return Math.max(0, this.MAX_HOURS - this.getCurrentHours());
    },

    getSecondsUntilReset() {
        this.ensureState();

        const now = this.getNow();
        const lastResetAt = Math.max(0, Number(CryptoZoo.state?.offlineAdsResetAt) || 0);
        const nextResetAt = lastResetAt + this.RESET_INTERVAL_MS;

        return Math.max(0, Math.ceil((nextResetAt - now) / 1000));
    },

    canWatchAd() {
        this.ensureState();
        return this.getCurrentHours() < this.MAX_HOURS;
    },

    grantAdReward() {
        this.ensureState();

        if (!this.canWatchAd()) {
            CryptoZoo.ui?.showToast?.("Osiągnięto dzienny limit reklam (12h)");
            return false;
        }

        const current = this.getCurrentHours();
        const remaining = this.getRemainingHours();
        const added = Math.min(this.HOURS_PER_AD, remaining);

        CryptoZoo.state.offlineAdsHours = Math.max(
            0,
            Math.min(this.MAX_HOURS, current + added)
        );

        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.(`+${added}h offline`);

        return true;
    }
};