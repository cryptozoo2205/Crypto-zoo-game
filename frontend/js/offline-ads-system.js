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

    canWatchAd() {
        return this.getCurrentHours() < this.MAX_HOURS;
    },

    grantAdReward() {
        if (!this.canWatchAd()) return false;

        CryptoZoo.state.offlineAdsHours =
            this.getCurrentHours() + this.HOURS_PER_AD;

        // zapis do backendu
        CryptoZoo.api?.savePlayer?.();

        return true;
    }
};