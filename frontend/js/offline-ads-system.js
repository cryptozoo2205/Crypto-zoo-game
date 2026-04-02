window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offlineAds = {
    MAX_HOURS: 12,
    HOURS_PER_AD: 2,

    getCurrentHours() {
        return Math.max(0, Number(CryptoZoo.state?.offlineAdsHours) || 0);
    },

    getMaxHours() {
        return this.MAX_HOURS;
    },

    getRemainingHours() {
        return Math.max(0, this.MAX_HOURS - this.getCurrentHours());
    },

    canWatchAd() {
        return this.getCurrentHours() < this.MAX_HOURS;
    },

    grantAdReward() {
        if (!this.canWatchAd()) {
            CryptoZoo.ui?.showToast?.("Osiągnięto limit reklam (12h)");
            return false;
        }

        const current = this.getCurrentHours();
        const remaining = this.getRemainingHours();

        const added = Math.min(this.HOURS_PER_AD, remaining);

        CryptoZoo.state.offlineAdsHours = current + added;

        // zapis do backendu
        CryptoZoo.api?.savePlayer?.();

        CryptoZoo.ui?.showToast?.(`+${added}h offline`);

        return true;
    }
};