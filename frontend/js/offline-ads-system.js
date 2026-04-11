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

    formatHoursShort(hoursValue) {
        const safeHours = Math.max(0, Number(hoursValue) || 0);
        const totalSeconds = Math.max(0, Math.floor(safeHours * 3600));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        if (hours > 0 && minutes > 0) {
            return `${hours}h ${minutes}m`;
        }

        if (hours > 0) {
            return `${hours}h`;
        }

        if (minutes > 0) {
            return `${minutes}m`;
        }

        return "0m";
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

        if (CryptoZoo.state.offlineAdsResetAt > 0) {
            if (CryptoZoo.state.offlineAdsResetAt <= now) {
                CryptoZoo.state.offlineAdsHours = 0;
                CryptoZoo.state.offlineAdsResetAt = 0;
                return;
            }

            const remainingHours = Math.max(
                0,
                (CryptoZoo.state.offlineAdsResetAt - now) / 3600000
            );

            CryptoZoo.state.offlineAdsHours = Math.max(
                0,
                Math.min(this.MAX_HOURS, Number(remainingHours.toFixed(6)))
            );

            return;
        }

        if (CryptoZoo.state.offlineAdsHours <= 0) {
            CryptoZoo.state.offlineAdsHours = 0;
            CryptoZoo.state.offlineAdsResetAt = 0;
            return;
        }

        CryptoZoo.state.offlineAdsResetAt =
            now + CryptoZoo.state.offlineAdsHours * 3600 * 1000;
    },

    getCurrentHours() {
        this.ensureState();

        const now = this.getNow();
        const resetAt = Number(CryptoZoo.state?.offlineAdsResetAt) || 0;

        if (resetAt > now) {
            return Math.max(
                0,
                Math.min(this.MAX_HOURS, Number((((resetAt - now) / 3600000)).toFixed(6)) || 0)
            );
        }

        return 0;
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
            return `Offline Ads: ${this.formatHoursShort(current)} / ${CryptoZoo.formatNumber(max)}h • Zostało: ${this.formatHoursShort(remaining)} • Reset za: ${resetText}`;
        }

        return `Offline Ads: ${this.formatHoursShort(current)} / ${CryptoZoo.formatNumber(max)}h • Limit osiągnięty • Reset za: ${resetText}`;
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

        const nextHours = Math.max(
            0,
            Math.min(this.MAX_HOURS, Number((current + added).toFixed(6)))
        );

        CryptoZoo.state.offlineAdsHours = nextHours;

        const currentResetAt = Number(CryptoZoo.state.offlineAdsResetAt) || 0;

        if (currentResetAt > now && current > 0) {
            CryptoZoo.state.offlineAdsResetAt = currentResetAt + added * 3600 * 1000;
        } else {
            CryptoZoo.state.offlineAdsResetAt =
                now + nextHours * 3600 * 1000;
        }

        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.renderOfflineInfo?.();

        const resetText = this.getFormattedTimeUntilReset();
        CryptoZoo.ui?.showToast?.(`+${added}h offline • Reset za ${resetText}`);

        return true;
    }
};