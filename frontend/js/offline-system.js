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

    normalizeAdsHoursFromResetAt() {
        const now = Date.now();
        const resetAt = this.normalizeTimestamp(CryptoZoo.state?.offlineAdsResetAt);

        if (!resetAt || resetAt <= now) {
            CryptoZoo.state.offlineAdsHours = 0;
            CryptoZoo.state.offlineAdsResetAt = 0;
            return 0;
        }

        const remainingSeconds = Math.max(0, Math.floor((resetAt - now) / 1000));
        const remainingHoursPrecise = remainingSeconds / 3600;

        CryptoZoo.state.offlineAdsHours = Math.max(
            0,
            Math.min(
                Number(CryptoZoo.gameplay?.getMaxOfflineAdsHours?.() || 6),
                Number(remainingHoursPrecise.toFixed(6))
            )
        );

        return CryptoZoo.state.offlineAdsHours;
    },

    normalizeState() {
        CryptoZoo.state = CryptoZoo.state || {};

        CryptoZoo.state.lastLogin = this.clampLastLogin(CryptoZoo.state?.lastLogin);

        const forcedBaseHours = Math.max(
            0.25,
            Number(CryptoZoo.gameplay?.baseOfflineHours) || 0.25
        );

        CryptoZoo.state.offlineBaseHours = forcedBaseHours;
        CryptoZoo.state.offlineBoostHours = 0;

        CryptoZoo.state.offlineAdsResetAt = Math.max(
            0,
            this.normalizeTimestamp(CryptoZoo.state?.offlineAdsResetAt)
        );

        CryptoZoo.state.offlineBoostActiveUntil = 0;
        CryptoZoo.state.offlineBoostMultiplier = 1;
        CryptoZoo.state.offlineBoost = 1;

        if (CryptoZoo.state.offlineAdsResetAt > 0) {
            this.normalizeAdsHoursFromResetAt();
        } else {
            const rawHours = Math.max(
                0,
                Math.min(
                    Number(CryptoZoo.gameplay?.getMaxOfflineAdsHours?.() || 6),
                    Number(CryptoZoo.state?.offlineAdsHours) || 0
                )
            );

            CryptoZoo.state.offlineAdsHours = Number(rawHours.toFixed(6));

            if (CryptoZoo.state.offlineAdsHours > 0) {
                CryptoZoo.state.offlineAdsResetAt =
                    Date.now() + CryptoZoo.state.offlineAdsHours * 3600 * 1000;
            } else {
                CryptoZoo.state.offlineAdsResetAt = 0;
            }
        }

        if (CryptoZoo.state.offlineAdsHours <= 0) {
            CryptoZoo.state.offlineAdsHours = 0;
            CryptoZoo.state.offlineAdsResetAt = 0;
        }

        if (CryptoZoo.gameplay?.getOfflineMaxSeconds) {
            CryptoZoo.state.offlineMaxSeconds = Math.max(
                0,
                Number(CryptoZoo.gameplay.getOfflineMaxSeconds()) || 15 * 60
            );
        } else {
            CryptoZoo.state.offlineMaxSeconds = Math.floor(
                (forcedBaseHours + CryptoZoo.state.offlineAdsHours) * 3600
            );
        }
    },

    isActive() {
        return false;
    },

    getMultiplier() {
        return 1;
    },

    getStoredMultiplier() {
        return 1;
    },

    getTimeLeft() {
        return 0;
    },

    activate(multiplier = 2, durationSeconds = 10 * 60) {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.offlineBoostMultiplier = 1;
        CryptoZoo.state.offlineBoostActiveUntil = 0;
        CryptoZoo.state.offlineBoost = 1;
        return false;
    },

    getIncomePerSecond() {
        this.normalizeState();

        const baseIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        if (!Number.isFinite(baseIncome) || baseIncome < 0) return 0;

        return baseIncome;
    },

    getBaseIncomePerSecond() {
        const baseIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        if (!Number.isFinite(baseIncome) || baseIncome < 0) return 0;

        return baseIncome;
    },

    getBaseOfflineSeconds() {
        const baseHours = Math.max(
            0.25,
            Number(CryptoZoo.state?.offlineBaseHours) ||
                Number(CryptoZoo.gameplay?.baseOfflineHours) ||
                0.25
        );

        return Math.floor(baseHours * 3600);
    },

    getAdsOfflineSeconds() {
        const now = Date.now();
        const resetAt = this.normalizeTimestamp(CryptoZoo.state?.offlineAdsResetAt);

        if (resetAt > now) {
            return Math.max(0, Math.floor((resetAt - now) / 1000));
        }

        const adsHours = Math.max(0, Number(CryptoZoo.state?.offlineAdsHours) || 0);
        return Math.floor(adsHours * 3600);
    },

    getMaxSeconds() {
        const total = this.getBaseOfflineSeconds() + this.getAdsOfflineSeconds();
        return Math.max(0, total);
    },

    getMaxHours() {
        return this.getMaxSeconds() / 3600;
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

    formatToastLimitDuration(totalSeconds) {
        const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
        const totalMinutes = Math.floor(safeSeconds / 60);
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

        return `${safeSeconds}s`;
    },

    getBoostedOfflineSeconds(fromTime, toTime, activeUntil) {
        return 0;
    },

    consumeOfflineAllowance(elapsedSeconds) {
        const safeElapsed = Math.max(0, Math.floor(Number(elapsedSeconds) || 0));
        if (safeElapsed <= 0) {
            return;
        }

        const baseSeconds = this.getBaseOfflineSeconds();
        const adsSeconds = this.getAdsOfflineSeconds();

        const consumedFromBase = Math.min(baseSeconds, safeElapsed);
        const remainingAfterBase = Math.max(0, safeElapsed - consumedFromBase);
        const consumedFromAds = Math.min(adsSeconds, remainingAfterBase);
        const adsSecondsLeft = Math.max(0, adsSeconds - consumedFromAds);

        if (adsSecondsLeft <= 0) {
            CryptoZoo.state.offlineAdsHours = 0;
            CryptoZoo.state.offlineAdsResetAt = 0;
        } else {
            CryptoZoo.state.offlineAdsHours = Number((adsSecondsLeft / 3600).toFixed(6));
            CryptoZoo.state.offlineAdsResetAt = Date.now() + adsSecondsLeft * 1000;
        }

        CryptoZoo.state.offlineMaxSeconds = this.getMaxSeconds();
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
            CryptoZoo.state.offlineMaxSeconds = this.getMaxSeconds();
            CryptoZoo.api?.savePlayer?.();
            return;
        }

        CryptoZoo.gameplay?.recalculateZooIncome?.();

        const baseIncomePerSecond = Math.max(0, Number(this.getBaseIncomePerSecond()) || 0);

        let offlineCoins = Math.floor(baseIncomePerSecond * cappedSeconds);

        if (!Number.isFinite(offlineCoins)) {
            offlineCoins = 0;
        }

        offlineCoins = Math.max(0, Math.min(offlineCoins, this.MAX_OFFLINE_COINS_PER_APPLY));

        if (offlineCoins > 0) {
            CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + offlineCoins;
        }

        this.consumeOfflineAllowance(cappedSeconds);

        const timeLabel = this.formatDuration(cappedSeconds);
        const limitLabel = this.formatToastLimitDuration(maxOfflineSeconds);
        const capLabel = wasCapped ? ` • limit ${limitLabel}` : "";

        const toastMessage =
            offlineCoins > 0
                ? `Offline: ${timeLabel} • +${CryptoZoo.formatNumber(offlineCoins)} coins${capLabel}`
                : `Offline: ${timeLabel} • +0 coins${capLabel}`;

        this.showOfflineToast(toastMessage);
        CryptoZoo.api?.savePlayer?.();
    }
};