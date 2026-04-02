window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offlineAds = {
    maxAdsHours: 12,
    rewardHoursPerAd: 2,

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};

        CryptoZoo.state.offlineAdsHours = Math.max(
            0,
            Math.min(
                this.maxAdsHours,
                Math.floor(Number(CryptoZoo.state.offlineAdsHours) || 0)
            )
        );
    },

    getMaxHours() {
        return this.maxAdsHours;
    },

    getRewardHoursPerAd() {
        return this.rewardHoursPerAd;
    },

    getCurrentHours() {
        this.ensureState();
        return Math.max(0, Number(CryptoZoo.state.offlineAdsHours) || 0);
    },

    getRemainingHours() {
        return Math.max(0, this.getMaxHours() - this.getCurrentHours());
    },

    canAddHours(hours = this.rewardHoursPerAd) {
        const safeHours = Math.max(1, Math.floor(Number(hours) || this.rewardHoursPerAd));
        return this.getCurrentHours() + safeHours <= this.getMaxHours();
    },

    addHours(hours = this.rewardHoursPerAd) {
        this.ensureState();

        const safeHours = Math.max(1, Math.floor(Number(hours) || this.rewardHoursPerAd));
        const current = this.getCurrentHours();
        const next = Math.min(this.getMaxHours(), current + safeHours);

        if (next === current) {
            return false;
        }

        CryptoZoo.state.offlineAdsHours = next;
        CryptoZoo.state.offlineMaxSeconds = CryptoZoo.gameplay?.getOfflineMaxSeconds?.() || ((next + 1) * 60 * 60);
        return true;
    },

    getAdSteps() {
        return [6, 8, 10, 12];
    },

    getNeededAdsForHours(targetHours) {
        const safeTarget = Math.max(0, Math.floor(Number(targetHours) || 0));
        return Math.ceil(safeTarget / this.rewardHoursPerAd);
    },

    grantAdReward() {
        const added = this.addHours(this.rewardHoursPerAd);

        if (!added) {
            CryptoZoo.ui?.showToast?.("Masz już maksymalny limit reklam offline 12h");
            return false;
        }

        CryptoZoo.state.lastLogin = Date.now();
        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        const currentHours = this.getCurrentHours();
        CryptoZoo.ui?.showToast?.(
            `📺 +${this.rewardHoursPerAd}h offline z reklamy • Reklamy: ${CryptoZoo.formatNumber(currentHours)}h / ${CryptoZoo.formatNumber(this.getMaxHours())}h`
        );

        return true;
    }
};