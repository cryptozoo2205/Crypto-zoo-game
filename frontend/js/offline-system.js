window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offline = {
    normalizeState() {
        CryptoZoo.state = CryptoZoo.state || {};

        const now = Date.now();
        let activeUntil = Number(CryptoZoo.state?.offlineBoostActiveUntil) || 0;

        if (activeUntil > 0 && activeUntil < 1000000000000) {
            activeUntil *= 1000;
        }

        CryptoZoo.state.offlineBoostActiveUntil = activeUntil;

        if (activeUntil > 0 && activeUntil <= now) {
            CryptoZoo.state.offlineBoostActiveUntil = 0;
            CryptoZoo.state.offlineBoostMultiplier = 1;
            CryptoZoo.state.offlineBoost = 1;
        } else {
            CryptoZoo.state.offlineBoostMultiplier = Math.max(
                1,
                Number(CryptoZoo.state?.offlineBoostMultiplier) || 1
            );
            CryptoZoo.state.offlineBoost = CryptoZoo.state.offlineBoostMultiplier;
        }
    },

    isActive() {
        this.normalizeState();
        return (Number(CryptoZoo.state?.offlineBoostActiveUntil) || 0) > Date.now();
    },

    getMultiplier() {
        this.normalizeState();

        return this.isActive()
            ? Math.max(1, Number(CryptoZoo.state?.offlineBoostMultiplier) || 1)
            : 1;
    },

    getTimeLeft() {
        this.normalizeState();

        return Math.max(
            0,
            Math.floor(
                ((Number(CryptoZoo.state?.offlineBoostActiveUntil) || 0) - Date.now()) / 1000
            )
        );
    },

    activate(multiplier = 2, durationSeconds = 10 * 60) {
        CryptoZoo.state = CryptoZoo.state || {};

        const safeMultiplier = Math.max(1, Number(multiplier) || 1);
        const safeDurationSeconds = Math.max(60, Number(durationSeconds) || 600);

        CryptoZoo.state.offlineBoostMultiplier = safeMultiplier;
        CryptoZoo.state.offlineBoostActiveUntil = Date.now() + safeDurationSeconds * 1000;
        CryptoZoo.state.offlineBoost = safeMultiplier;

        return true;
    },

    getIncomePerSecond() {
        this.normalizeState();

        const baseIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        const offlineBoostMultiplier = this.getMultiplier();

        return baseIncome * offlineBoostMultiplier;
    },

    getMaxSeconds() {
        return Math.max(
            Number(CryptoZoo.gameplay?.maxOfflineSeconds) || 0,
            Number(CryptoZoo.state?.offlineMaxSeconds) || Number(CryptoZoo.gameplay?.maxOfflineSeconds) || 0
        );
    },

    formatDuration(totalSeconds) {
        const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);

        if (hours > 0 && minutes > 0) {
            return `${hours}h ${minutes}m`;
        }

        if (hours > 0) {
            return `${hours}h`;
        }

        if (minutes > 0) {
            return `${minutes}m`;
        }

        return `${safeSeconds}s`;
    },

    applyEarnings() {
        CryptoZoo.state = CryptoZoo.state || {};

        const now = Date.now();
        const lastLogin = Math.max(0, Number(CryptoZoo.state?.lastLogin) || now);
        const elapsedSeconds = Math.max(0, Math.floor((now - lastLogin) / 1000));
        const maxOfflineSeconds = this.getMaxSeconds();
        const cappedSeconds = Math.min(elapsedSeconds, maxOfflineSeconds);
        const wasCapped = elapsedSeconds > maxOfflineSeconds;

        if (cappedSeconds <= 0) {
            CryptoZoo.state.lastLogin = now;
            return;
        }

        CryptoZoo.gameplay?.recalculateZooIncome?.();
        this.normalizeState();

        const offlineIncomePerSecond = this.getIncomePerSecond();
        const offlineCoins = Math.floor(offlineIncomePerSecond * cappedSeconds);

        CryptoZoo.state.lastLogin = now;

        if (offlineCoins <= 0) {
            return;
        }

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + offlineCoins;
        CryptoZoo.state.xp = (Number(CryptoZoo.state.xp) || 0) + Math.max(1, Math.floor(cappedSeconds / 60));

        CryptoZoo.gameplay?.recalculateLevel?.();

        const timeLabel = this.formatDuration(cappedSeconds);
        const capLabel = wasCapped ? ` • limit ${this.formatDuration(maxOfflineSeconds)}` : "";
        const offlineMultiplier = this.getMultiplier();
        const boostLabel = offlineMultiplier > 1
            ? ` • x${CryptoZoo.formatNumber(offlineMultiplier)} offline`
            : "";

        CryptoZoo.ui?.showToast?.(
            `Offline: ${timeLabel} • +${CryptoZoo.formatNumber(offlineCoins)} coins${capLabel}${boostLabel}`
        );

        CryptoZoo.api?.savePlayer?.();
    }
};