window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offlineAds = {
    MAX_HOURS: 12,
    HOURS_PER_AD: 2,

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

        CryptoZoo.state.offlineAdsHours = Math.max(
            0,
            Math.min(this.MAX_HOURS, Number(CryptoZoo.state.offlineAdsHours) || 0)
        );
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
        return Math.max(0, Math.ceil(this.getCurrentHours() * 3600));
    },

    getFormattedTimeUntilReset() {
        return this.formatTimeLeft(this.getSecondsUntilReset());
    },

    getNextResetAt() {
        return this.getNow() + this.getSecondsUntilReset() * 1000;
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
            CryptoZoo.ui?.showToast?.(`Osiągnięto limit reklam (${this.MAX_HOURS}h) • Reset za ${resetText}`);
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

        const resetText = this.getFormattedTimeUntilReset();
        CryptoZoo.ui?.showToast?.(`+${added}h offline • Reset za ${resetText}`);

        return true;
    }
};