window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offlineAds = {
    MAX_HOURS: 3,
    HOURS_PER_AD: 0.5,

    clampHours(value) {
        return Math.max(0, Math.min(this.MAX_HOURS, Number(value) || 0));
    },

    persistState() {
        if (typeof CryptoZoo.api?.writeLocalState === "function") {
            CryptoZoo.api.writeLocalState(CryptoZoo.state || {});
        }
    },

    setZeroState() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.offlineAdsHours = 0;
        CryptoZoo.state.offlineAdsResetAt = 0;
        CryptoZoo.state.offlineAdsEnabled = false;
    },

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};

        const storedHours = this.clampHours(CryptoZoo.state.offlineAdsHours);

        if (storedHours <= 0) {
            this.setZeroState();
            return;
        }

        CryptoZoo.state.offlineAdsHours = Number(storedHours.toFixed(6));
        CryptoZoo.state.offlineAdsEnabled = true;
        CryptoZoo.state.offlineAdsResetAt = 0;
    },

    getCurrentHours() {
        this.ensureState();
        return this.clampHours(CryptoZoo.state?.offlineAdsHours);
    },

    getMaxHours() {
        return this.MAX_HOURS;
    },

    getRemainingHours() {
        const current = this.getCurrentHours();
        return this.clampHours(this.MAX_HOURS - current);
    },

    getSecondsUntilReset() {
        return 0;
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

    getFormattedTimeUntilReset() {
        return this.formatTimeLeft(this.getSecondsUntilReset());
    },

    getNextResetAt() {
        return 0;
    },

    formatHoursShort(hoursValue) {
        const safeHours = this.clampHours(hoursValue);
        const totalMinutes = Math.floor(safeHours * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

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

    getDisplayHoursText() {
        return this.formatHoursShort(this.getCurrentHours());
    },

    getDisplayLimitText() {
        return `${this.MAX_HOURS}h`;
    },

    canWatchAd() {
        return this.getCurrentHours() < this.getMaxHours();
    },

    getStatusText() {
        const current = this.getCurrentHours();
        const max = this.getMaxHours();
        const currentMinutes = Math.floor(current * 60);

        if (currentMinutes <= 0) {
            return `Offline: 0m/${this.formatHoursShort(max)} · 30min po obejrzeniu reklamy`;
        }

        return `Offline: ${this.formatHoursShort(current)}/${this.formatHoursShort(max)}`;
    },

    addHours(hours = 1) {
        this.ensureState();

        const safeHours = Math.max(0, Number(hours) || 0);
        if (safeHours <= 0) {
            return false;
        }

        const current = this.getCurrentHours();
        const next = this.clampHours(current + safeHours);

        if (next <= current) {
            return false;
        }

        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.offlineAdsHours = Number(next.toFixed(6));
        CryptoZoo.state.offlineAdsResetAt = 0;
        CryptoZoo.state.offlineAdsEnabled = next > 0;

        this.persistState();
        return true;
    }
};