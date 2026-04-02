window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.offline = {
    MAX_FUTURE_SKEW_MS: 2 * 60 * 1000,
    MAX_BACKWARD_SKEW_MS: 30 * 24 * 60 * 60 * 1000,
    MAX_OFFLINE_COINS_PER_APPLY: 5e9,

    normalizeTimestamp(value) {
        let safeValue = Number(value) || 0;

        if (safeValue <= 0) return 0;
        if (safeValue < 1000000000000) safeValue *= 1000;

        return safeValue;
    },

    clampLastLogin(rawValue) {
        const now = Date.now();
        let safeValue = this.normalizeTimestamp(rawValue);

        if (!safeValue) return now;

        const maxFuture = now + this.MAX_FUTURE_SKEW_MS;
        if (safeValue > maxFuture) {
            safeValue = now;
        }

        const minPast = now - this.MAX_BACKWARD_SKEW_MS;
        if (safeValue < minPast) {
            safeValue = minPast;
        }

        return safeValue;
    },

    normalizeState() {
        CryptoZoo.state = CryptoZoo.state || {};

        const now = Date.now();
        const activeUntil = this.normalizeTimestamp(CryptoZoo.state?.offlineBoostActiveUntil);

        CryptoZoo.state.lastLogin = this.clampLastLogin(CryptoZoo.state?.lastLogin);

        CryptoZoo.state.offlineBaseHours = Math.max(
            1,
            Math.floor(Number(CryptoZoo.state?.offlineBaseHours) || 1)
        );

        CryptoZoo.state.offlineBoostHours = Math.max(
            0,
            Math.floor(Number(CryptoZoo.state?.offlineBoostHours) || 0)
        );

        CryptoZoo.state.offlineAdsHours = Math.max(
            0,
            Math.min(12, Math.floor(Number(CryptoZoo.state?.offlineAdsHours) || 0))
        );

        CryptoZoo.state.offlineBoostActiveUntil = activeUntil;

        if (activeUntil > 0 && activeUntil <= now) {
            CryptoZoo.state.offlineBoostActiveUntil = 0;
            CryptoZoo.state.offlineBoostMultiplier = 1;
            CryptoZoo.state.offlineBoost = 1;
        } else {
            const safeMultiplier = Math.max(
                1,
                Math.min(3, Number(CryptoZoo.state?.offlineBoostMultiplier) || 1)
            );

            CryptoZoo.state.offlineBoostMultiplier = safeMultiplier;
            CryptoZoo.state.offlineBoost = safeMultiplier;
        }

        if (CryptoZoo.gameplay?.getOfflineMaxSeconds) {
            CryptoZoo.state.offlineMaxSeconds = Math.max(
                0,
                Number(CryptoZoo.gameplay.getOfflineMaxSeconds()) || 3600
            );
        } else {
            CryptoZoo.state.offlineMaxSeconds = Math.max(
                0,
                Number(CryptoZoo.state?.offlineMaxSeconds) ||
                    Number(CryptoZoo.gameplay?.maxOfflineSeconds) ||
                    1 * 60 * 60
            );
        }
    },

    isActive() {
        this.normalizeState();
        return (Number(CryptoZoo.state?.offlineBoostActiveUntil) || 0) > Date.now();
    },

    getMultiplier() {
        this.normalizeState();

        return this.isActive()
            ? Math.max(1, Math.min(3, Number(CryptoZoo.state?.offlineBoostMultiplier) || 1))
            : 1;
    },

    getStoredMultiplier() {
        return Math.max(1, Math.min(3, Number(CryptoZoo.state?.offlineBoostMultiplier) || 1));
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

        const safeMultiplier = Math.max(1, Math.min(3, Number(multiplier) || 1));
        const safeDurationSeconds = Math.max(60, Math.min(24 * 60 * 60, Number(durationSeconds) || 600));

        CryptoZoo.state.offlineBoostMultiplier = safeMultiplier;
        CryptoZoo.state.offlineBoostActiveUntil = Date.now() + safeDurationSeconds * 1000;
        CryptoZoo.state.offlineBoost = safeMultiplier;

        return true;
    },

    getIncomePerSecond() {
        this.normalizeState();

        const baseIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        const offlineBoostMultiplier = this.getMultiplier();

        const income = baseIncome * offlineBoostMultiplier;
        if (!Number.isFinite(income) || income < 0) return 0;

        return income;
    },

    getBaseIncomePerSecond() {
        const baseIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        if (!Number.isFinite(baseIncome) || baseIncome < 0) return 0;

        return baseIncome;
    },

    getMaxSeconds() {
        if (CryptoZoo.gameplay?.getOfflineMaxSeconds) {
            return Math.max(0, Number(CryptoZoo.gameplay.getOfflineMaxSeconds()) || 0);
        }

        return Math.max(
            0,
            Number(CryptoZoo.state?.offlineMaxSeconds) ||
                Number(CryptoZoo.gameplay?.maxOfflineSeconds) ||
                0
        );
    },

    getMaxHours() {
        return Math.max(0, Math.floor(this.getMaxSeconds() / 3600));
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

    getBoostedOfflineSeconds(fromTime, toTime, activeUntil) {
        const safeFrom = Math.max(0, Number(fromTime) || 0);
        const safeTo = Math.max(safeFrom, Number(toTime) || safeFrom);
        const safeActiveUntil = this.normalizeTimestamp(activeUntil);

        if (safeActiveUntil <= safeFrom) {
            return 0;
        }

        const boostedUntil = Math.min(safeTo, safeActiveUntil);
        return Math.max(0, Math.floor((boostedUntil - safeFrom) / 1000));
    },

    showOfflineToast(message) {
        const tryShow = () => {
            const loadingScreen = document.getElementById("loading-screen");

            if (loadingScreen && loadingScreen.style.display !== "none") {
                setTimeout(tryShow, 300);
                return;
            }

            CryptoZoo.ui?.showToast?.(message);
        };

        setTimeout(tryShow, 700);
    },

    applyEarnings() {
        CryptoZoo.state = CryptoZoo.state || {};

        const now = Date.now();
        this.normalizeState();

        const lastLogin = this.clampLastLogin(CryptoZoo.state?.lastLogin || now);
        const elapsedSeconds = Math.max(0, Math.floor((now - lastLogin) / 1000));
        const maxOfflineSeconds = this.getMaxSeconds();
        const cappedSeconds = Math.min(elapsedSeconds, maxOfflineSeconds);
        const wasCapped = elapsedSeconds > maxOfflineSeconds;

        CryptoZoo.state.lastLogin = now;

        if (cappedSeconds <= 0) {
            return;
        }

        CryptoZoo.gameplay?.recalculateZooIncome?.();

        const baseIncomePerSecond = Math.max(0, Number(this.getBaseIncomePerSecond()) || 0);
        const storedMultiplier = this.getStoredMultiplier();
        const rawActiveUntil = this.normalizeTimestamp(CryptoZoo.state?.offlineBoostActiveUntil);

        const cappedStartTime = now - cappedSeconds * 1000;
        const boostedSeconds =
            storedMultiplier > 1
                ? Math.min(
                      cappedSeconds,
                      this.getBoostedOfflineSeconds(cappedStartTime, now, rawActiveUntil)
                  )
                : 0;

        const normalSeconds = Math.max(0, cappedSeconds - boostedSeconds);

        const boostedCoins = Math.floor(baseIncomePerSecond * storedMultiplier * boostedSeconds);
        const normalCoins = Math.floor(baseIncomePerSecond * normalSeconds);

        let offlineCoins = Math.max(0, boostedCoins + normalCoins);

        if (!Number.isFinite(offlineCoins)) {
            offlineCoins = 0;
        }

        offlineCoins = Math.min(offlineCoins, this.MAX_OFFLINE_COINS_PER_APPLY);

        if (offlineCoins > 0) {
            CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + offlineCoins;
        }

        const timeLabel = this.formatDuration(cappedSeconds);
        const capLabel = wasCapped ? ` • limit ${this.formatDuration(maxOfflineSeconds)}` : "";
        const boostLabel =
            boostedSeconds > 0
                ? ` • x${CryptoZoo.formatNumber(storedMultiplier)} offline przez ${this.formatDuration(boostedSeconds)}`
                : "";

        const toastMessage =
            offlineCoins > 0
                ? `Offline: ${timeLabel} • +${CryptoZoo.formatNumber(offlineCoins)} coins${capLabel}${boostLabel}`
                : `Offline: ${timeLabel} • +0 coins${capLabel}`;

        this.showOfflineToast(toastMessage);
        CryptoZoo.api?.savePlayer?.();
    }
};