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

        CryptoZoo.state.offlineAdsHours = 0;
        CryptoZoo.state.offlineAdsResetAt = 0;

        if (rawResetAt > 0) {
            this.syncStateFromResetAt();
            return;
        }

        this.setZeroState();
    },

    getCurrentHours() {
    const resetAt = Number(CryptoZoo.state.offlineAdsResetAt) || 0;
    const now = Date.now();
    if (resetAt <= now) return 0;
    return (resetAt - now) / 3600000;
}
        this.ensureState();
        return this.syncStateFromResetAt();
    },

    getMaxHours() {
        return this.MAX_HOURS;
    },

    getRemainingHours() {
        const current = this.getCurrentHours() {
    const resetAt = Number(CryptoZoo.state.offlineAdsResetAt) || 0;
    const now = Date.now();
    if (resetAt <= now) return 0;
    return (resetAt - now) / 3600000;
}
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
        const current = this.getCurrentHours() {
    const resetAt = Number(CryptoZoo.state.offlineAdsResetAt) || 0;
    const now = Date.now();
    if (resetAt <= now) return 0;
    return (resetAt - now) / 3600000;
}
        const max = this.getMaxHours();
        return current < max;
    },

    getStatusText() {
        const current = this.getCurrentHours() {
    const resetAt = Number(CryptoZoo.state.offlineAdsResetAt) || 0;
    const now = Date.now();
    if (resetAt <= now) return 0;
    return (resetAt - now) / 3600000;
}
        const max = this.getMaxHours();
        const remaining = Math.max(0, max - current);
        const resetText = this.getFormattedTimeUntilReset();

        if (current <= 0.000001) {
            return `Offline Ads: ${this.formatHoursShort(current)} / ${CryptoZoo.formatNumber(max)}h · Gotowe do obejrzenia reklamy`;
        }

        if (current < max) {
            return `Offline Ads: ${this.formatHoursShort(current)} / ${CryptoZoo.formatNumber(max)}h · Zostało: ${this.formatHoursShort(remaining)} · Reset za: ${resetText}`;
        }

        return `Offline Ads: ${this.formatHoursShort(current)} / ${CryptoZoo.formatNumber(max)}h · Reset za: ${resetText}`;
    },

    addHours(hours = 1) {
        this.ensureState();

        const current = Number(CryptoZoo.state.offlineAdsHours) || 0;
        const max = this.getMaxHours();

        const next = Math.min(max, current + 1);

        CryptoZoo.state.offlineAdsHours = next;
        CryptoZoo.state.offlineAdsResetAt = Date.now() + next * 3600 * 1000;

        return true;
    }
