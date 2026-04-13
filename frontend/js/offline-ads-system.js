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

    clampHours(value) {
        return Math.max(0, Math.min(this.MAX_HOURS, Number(value) || 0));
    },

    setZeroState() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.offlineAdsHours = 0;
        CryptoZoo.state.offlineAdsResetAt = 0;
    },

    syncStateFromResetAt() {
        CryptoZoo.state = CryptoZoo.state || {};

        const now = this.getNow();
        const resetAt = Math.max(0, Number(CryptoZoo.state.offlineAdsResetAt) || 0);

        if (resetAt <= now) {
            this.setZeroState();
            return 0;
        }

        const remainingHours = this.clampHours((resetAt - now) / 3600000);
        CryptoZoo.state.offlineAdsHours = Number(remainingHours.toFixed(6));
        return CryptoZoo.state.offlineAdsHours;
    },

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};

        const rawHours = this.clampHours(CryptoZoo.state.offlineAdsHours);
        const rawResetAt = Math.max(0, Number(CryptoZoo.state.offlineAdsResetAt) || 0);

        CryptoZoo.state.offlineAdsHours = Number(rawHours.toFixed(6));
        CryptoZoo.state.offlineAdsResetAt = rawResetAt;

        if (rawResetAt > 0) {
            this.syncStateFromResetAt();
            return;
        }

        if (rawHours <= 0) {
            this.setZeroState();
            return;
        }

        const now = this.getNow();
        CryptoZoo.state.offlineAdsResetAt = now + rawHours * 3600 * 1000;
        this.syncStateFromResetAt();
    },

    getCurrentHours() {
        this.ensureState();
        return this.syncStateFromResetAt();
    },

    getMaxHours() {
        return this.MAX_HOURS;
    },

    getRemainingHours() {
        const current = this.getCurrentHours();
        return Math.max(0, Number((this.MAX_HOURS - current).toFixed(6)) || 0);
    },

    getSecondsUntilReset() {
        this.ensureState();

        const resetAt = Math.max(0, Number(CryptoZoo.state?.offlineAdsResetAt) || 0);
        if (resetAt <= 0) return 0;

        const seconds = Math.max(0, Math.ceil((resetAt - this.getNow()) / 1000));

        if (seconds <= 0) {
            this.setZeroState();
            return 0;
        }

        return seconds;
    },

    getFormattedTimeUntilReset() {
        return this.formatTimeLeft(this.getSecondsUntilReset());
    },

    getNextResetAt() {
        this.ensureState();
        return Math.max(0, Number(CryptoZoo.state?.offlineAdsResetAt) || 0);
    },

    canWatchAd() {
        const current = this.getCurrentHours();
        return current < (this.MAX_HOURS - 0.000001);
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

    addHours(hours = 1) {
        this.ensureState();

        if (!this.canWatchAd()) {
            return false;
        }

        const now = this.getNow();
        const current = this.getCurrentHours();
        const remaining = this.getRemainingHours();
        const requested = Math.max(0, Number(hours) || 0);

        if (requested <= 0 || remaining <= 0) {
            return false;
        }

        const added = Math.min(requested, remaining);
        const currentResetAt = Math.max(0, Number(CryptoZoo.state?.offlineAdsResetAt) || 0);
        const baseResetAt = currentResetAt > now ? currentResetAt : now;

        CryptoZoo.state.offlineAdsResetAt = baseResetAt + added * 3600 * 1000;
        this.syncStateFromResetAt();

        return added > 0;
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

        const beforeHours = this.getCurrentHours();
        const beforeRemaining = this.getRemainingHours();
        const added = Math.min(this.HOURS_PER_AD, beforeRemaining);

        if (added <= 0) {
            const resetText = this.getFormattedTimeUntilReset();
            CryptoZoo.ui?.showToast?.(
                `Osiągnięto limit reklam (${this.MAX_HOURS}h) • Reset za ${resetText}`
            );
            return false;
        }

        const success = this.addHours(added);
        if (!success) {
            return false;
        }

        const afterHours = this.getCurrentHours();
        const resetText = this.getFormattedTimeUntilReset();

        CryptoZoo.state.lastLogin = this.getNow();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.renderOfflineInfo?.();

        CryptoZoo.ui?.showToast?.(
            `+${this.formatHoursShort(added)} offline • ${this.formatHoursShort(beforeHours)} → ${this.formatHoursShort(afterHours)} • Reset za ${resetText}`
        );

        return true;
    }
};