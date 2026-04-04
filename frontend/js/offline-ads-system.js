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

        CryptoZoo.state.offlineAdsLastUpdateAt = Math.max(
            0,
            Number(CryptoZoo.state.offlineAdsLastUpdateAt) || 0
        );

        if (!CryptoZoo.state.offlineAdsLastUpdateAt) {
            CryptoZoo.state.offlineAdsLastUpdateAt = this.getNow();
        }

        this.applyDecayIfNeeded();
    },

    applyDecayIfNeeded() {
        const now = this.getNow();
        const lastUpdateAt = Math.max(
            0,
            Number(CryptoZoo.state?.offlineAdsLastUpdateAt) || 0
        );

        if (!lastUpdateAt) {
            CryptoZoo.state.offlineAdsLastUpdateAt = now;
            return false;
        }

        const elapsedSeconds = Math.max(0, Math.floor((now - lastUpdateAt) / 1000));
        if (elapsedSeconds <= 0) {
            return false;
        }

        const currentHours = Math.max(
            0,
            Math.min(this.MAX_HOURS, Number(CryptoZoo.state?.offlineAdsHours) || 0)
        );

        const currentSeconds = Math.floor(currentHours * 60 * 60);
        const nextSeconds = Math.max(0, currentSeconds - elapsedSeconds);
        const nextHours = nextSeconds / 3600;

        const changed = Math.abs(nextHours - currentHours) > 0.000001;

        CryptoZoo.state.offlineAdsHours = Math.max(
            0,
            Math.min(this.MAX_HOURS, Number(nextHours.toFixed(6)))
        );

        CryptoZoo.state.offlineAdsLastUpdateAt = now;

        return changed;
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
        this.ensureState();
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
            return `Offline Ads: ${current.toFixed(1)}/${max}h • Zostało: ${remaining.toFixed(1)}h • Reset za: ${resetText}`;
        }

        return `Offline Ads: ${current.toFixed(1)}/${max}h • Limit osiągnięty • Reset za: ${resetText}`;
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
            Math.min(this.MAX_HOURS, Number((current + added).toFixed(6)))
        );

        CryptoZoo.state.offlineAdsLastUpdateAt = this.getNow();

        CryptoZoo.api?.savePlayer?.();

        const resetText = this.getFormattedTimeUntilReset();
        CryptoZoo.ui?.showToast?.(`+${added}h offline • Reset za ${resetText}`);

        return true;
    }
};