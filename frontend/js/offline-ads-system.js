window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offlineAds = {
    MAX_HOURS: 3,
    HOURS_PER_AD: 0.5,

    getNow() {
        return Date.now();
    },

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

        const enabled = Boolean(CryptoZoo.state.offlineAdsEnabled);
        const now = this.getNow();
        const resetAt = Math.max(0, Number(CryptoZoo.state.offlineAdsResetAt) || 0);

        if (!enabled) {
            this.setZeroState();
            return;
        }

        if (resetAt <= 0) {
            this.setZeroState();
            this.persistState();
            return;
        }

        const msLeft = resetAt - now;

        if (msLeft <= 0) {
            this.setZeroState();
            this.persistState();
            return;
        }

        const currentHours = this.clampHours(msLeft / 3600000);

        if (currentHours <= 0) {
            this.setZeroState();
            this.persistState();
            return;
        }

        CryptoZoo.state.offlineAdsHours = Number(currentHours.toFixed(6));
        CryptoZoo.state.offlineAdsEnabled = true;
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
        this.ensureState();

        const enabled = Boolean(CryptoZoo.state?.offlineAdsEnabled);
        const resetAt = Math.max(0, Number(CryptoZoo.state?.offlineAdsResetAt) || 0);

        if (!enabled || resetAt <= 0) {
            return 0;
        }

        const seconds = Math.max(0, Math.ceil((resetAt - this.getNow()) / 1000));

        if (seconds <= 0) {
            this.setZeroState();
            this.persistState();
            return 0;
        }

        return seconds;
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
        this.ensureState();

        if (!Boolean(CryptoZoo.state?.offlineAdsEnabled)) {
            return 0;
        }

        return Math.max(0, Number(CryptoZoo.state?.offlineAdsResetAt) || 0);
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

        return `Offline: ${this.formatHoursShort(current)}/${this.formatHoursShort(max)} · Reset za: ${this.getFormattedTimeUntilReset()}`;
    },

    addHours(hours = 1) {
        this.ensureState();

        const safeHours = Math.max(0, Number(hours) || 0);
        if (safeHours <= 0) {
            return false;
        }

        const now = this.getNow();
        const currentResetAt = Math.max(0, Number(CryptoZoo.state?.offlineAdsResetAt) || 0);
        const baseTime = currentResetAt > now ? currentResetAt : now;

        const current = this.getCurrentHours();
        const next = this.clampHours(current + safeHours);

        if (next <= current) {
            return false;
        }

        const addedMs = (next - current) * 3600 * 1000;

        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.offlineAdsHours = Number(next.toFixed(6));
        CryptoZoo.state.offlineAdsResetAt = Math.max(baseTime, now) + addedMs;
        CryptoZoo.state.offlineAdsEnabled = true;

        this.persistState();
        return true;
    }
};