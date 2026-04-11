window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offlineAds = {
    MAX_HOURS: 6,
    HOURS_PER_AD: 1,

    getNow() {
        return Date.now();
    },

    formatTimeLeft(totalSeconds) {
        const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
        const hours = Math.floor(safe / 3600);
        const minutes = Math.floor((safe % 3600) / 60);
        const seconds = safe % 60;

        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(seconds).padStart(2, "0")
        ].join(":");
    },

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};

        const now = this.getNow();

        CryptoZoo.state.offlineAdsHours = Math.max(
            0,
            Math.min(this.MAX_HOURS, Number(CryptoZoo.state.offlineAdsHours) || 0)
        );

        CryptoZoo.state.offlineAdsResetAt = Math.max(
            0,
            Number(CryptoZoo.state.offlineAdsResetAt) || 0
        );

        if (CryptoZoo.state.offlineAdsHours <= 0) {
            CryptoZoo.state.offlineAdsHours = 0;
            CryptoZoo.state.offlineAdsResetAt = 0;
            return;
        }

        if (CryptoZoo.state.offlineAdsResetAt <= 0) {
            CryptoZoo.state.offlineAdsResetAt =
                now + CryptoZoo.state.offlineAdsHours * 3600 * 1000;
            return;
        }

        if (CryptoZoo.state.offlineAdsResetAt <= now) {
            CryptoZoo.state.offlineAdsHours = 0;
            CryptoZoo.state.offlineAdsResetAt = 0;
        }
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

        const resetAt = Number(CryptoZoo.state?.offlineAdsResetAt) || 0;
        if (resetAt <= 0) return 0;

        return Math.max(0, Math.ceil((resetAt - this.getNow()) / 1000));
    },

    getFormattedTimeUntilReset() {
        return this.formatTimeLeft(this.getSecondsUntilReset());
    },

    getNextResetAt() {
        this.ensureState();
        return Number(CryptoZoo.state?.offlineAdsResetAt) || 0;
    },

    canWatchAd() {
        this.ensureState();
        return this.getCurrentHours() < this.MAX_HOURS;
    },

    getStatusText() {
        const current = this.getCurrentHours();
        const max = this.getMaxHours();
        const remaining = this.getRemainingHours();
        const resetText = this.getFormattedTimeUntilReset();

        if (this.canWatchAd()) {
            return `Offline Ads: ${current}/${max}h • Zostało: ${remaining}h • Reset za: ${resetText}`;
        }

        return `Offline Ads: ${current}/${max}h • Limit osiągnięty • Reset za: ${resetText}`;
    },

    grantAdReward() {
        this.ensureState();

        if (!this.canWatchAd()) {
            const resetText = this.getFormattedTimeUntilReset();
            CryptoZoo.ui?.showToast?.(
                `Osiągnięto limit reklam (${this.MAX_HOURS}h) • Reset za ${resetText}`
            );
            return false;
        }

        const now = this.getNow();
        const current = this.getCurrentHours();
        const remaining = this.getRemainingHours();
        const added = Math.min(this.HOURS_PER_AD, remaining);

        CryptoZoo.state.offlineAdsHours = Math.max(
            0,
            Math.min(this.MAX_HOURS, current + added)
        );

        const currentResetAt = Number(CryptoZoo.state.offlineAdsResetAt) || 0;

        if (currentResetAt > now) {
            CryptoZoo.state.offlineAdsResetAt = currentResetAt + added * 3600 * 1000;
        } else {
            CryptoZoo.state.offlineAdsResetAt =
                now + CryptoZoo.state.offlineAdsHours * 3600 * 1000;
        }

        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.renderOfflineInfo?.();
        CryptoZoo.ads?.updateOfflineUi?.();

        const resetText = this.getFormattedTimeUntilReset();
        CryptoZoo.ui?.showToast?.(`+${added}h offline • Reset za ${resetText}`);

        return true;
    }
};