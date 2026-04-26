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

        CryptoZoo.state.lastLogin = this.clampLastLogin(CryptoZoo.state?.lastLogin);

        CryptoZoo.state.offlineBaseHours = 0;
        CryptoZoo.state.offlineBoostHours = 0;
        CryptoZoo.state.offlineBoostActiveUntil = 0;
        CryptoZoo.state.offlineBoostMultiplier = 1;
        CryptoZoo.state.offlineBoost = 1;

        CryptoZoo.offlineAds?.ensureState?.();

        const adsHours = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getCurrentHours?.() || 0)
        );

        const adsResetAt = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getNextResetAt?.() || 0)
        );

        CryptoZoo.state.offlineAdsHours = Number(adsHours.toFixed(6));

        if (adsResetAt > Date.now() && adsHours > 0) {
            CryptoZoo.state.offlineAdsResetAt = adsResetAt;
            CryptoZoo.state.offlineAdsEnabled = true;
        } else {
            CryptoZoo.state.offlineAdsResetAt = 0;
            CryptoZoo.state.offlineAdsEnabled = false;
            CryptoZoo.state.offlineAdsHours = 0;
        }

        CryptoZoo.state.offlineMaxSeconds = this.getMaxSeconds();
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
        return 0;
    },

    getAdsOfflineSeconds() {
        CryptoZoo.offlineAds?.ensureState?.();

        const currentHours = Math.max(
            0,
            Number(CryptoZoo.offlineAds?.getCurrentHours?.() || 0)
        );

        return Math.max(0, Math.round(currentHours * 3600));
    },

    getMaxSeconds() {
        const total = this.getAdsOfflineSeconds();
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

    consumeOfflineAllowance(consumedSeconds, availableSecondsBeforeConsume = null) {
        CryptoZoo.state = CryptoZoo.state || {};

        const safeConsumed = Math.max(0, Math.floor(Number(consumedSeconds) || 0));
        if (safeConsumed <= 0) {
            return;
        }

        CryptoZoo.offlineAds?.ensureState?.();

        const availableSeconds = availableSecondsBeforeConsume === null
            ? this.getAdsOfflineSeconds()
            : Math.max(0, Math.floor(Number(availableSecondsBeforeConsume) || 0));

        const secondsLeft = Math.max(0, availableSeconds - safeConsumed);
        const now = Date.now();

        CryptoZoo.state.offlineAdsHours = Number((secondsLeft / 3600).toFixed(6));
        CryptoZoo.state.offlineAdsResetAt = secondsLeft > 0 ? now + (secondsLeft * 1000) : 0;
        CryptoZoo.state.offlineAdsEnabled = secondsLeft > 0;
        CryptoZoo.state.offlineMaxSeconds = secondsLeft;

        CryptoZoo.offlineAds?.persistState?.();
    },

    showOfflineToast(message) {
        setTimeout(() => {
            try {
                alert(message);
            } catch (_) {}
            CryptoZoo.ui?.showToast?.(message);
        }, 1000);
    },

    applyEarnings() {
        CryptoZoo.state = CryptoZoo.state || {};

        const now = Date.now();
        this.normalizeState();

        const lastLogin = this.clampLastLogin(CryptoZoo.state?.lastLogin || now);
        const elapsedSeconds = Math.max(0, Math.floor((now - lastLogin) / 1000));
        const availableOfflineSeconds = this.getMaxSeconds();
        const cappedSeconds = Math.min(elapsedSeconds, availableOfflineSeconds);
        const wasCapped = elapsedSeconds > availableOfflineSeconds;

        if (availableOfflineSeconds <= 0 || cappedSeconds <= 0) {
            CryptoZoo.state.lastLogin = now;
            CryptoZoo.state.offlineMaxSeconds = this.getMaxSeconds();
            CryptoZoo.api?.savePlayer?.();
            return;
        }

        CryptoZoo.gameplay?.recalculateZooIncome?.();

        const baseIncomePerSecond = Math.max(0, Number(this.getBaseIncomePerSecond()) || 0);

        let offlineCoins = Math.floor(baseIncomePerSecond * cappedSeconds * 0.25);

        if (!Number.isFinite(offlineCoins)) {
            offlineCoins = 0;
        }

        offlineCoins = Math.max(0, Math.min(offlineCoins, this.MAX_OFFLINE_COINS_PER_APPLY));

        if (offlineCoins > 0) {
            CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + offlineCoins;
        }

        this.consumeOfflineAllowance(cappedSeconds, availableOfflineSeconds);

        CryptoZoo.state.lastLogin = now;
        CryptoZoo.state.offlineMaxSeconds = this.getMaxSeconds();

        const timeLabel = this.formatDuration(cappedSeconds);
        const limitLabel = this.formatToastLimitDuration(availableOfflineSeconds);
        const capLabel = wasCapped ? ` • limit ${limitLabel}` : "";

        const toastMessage =
            offlineCoins > 0
                ? `Offline: ${timeLabel} • +${CryptoZoo.formatNumber(offlineCoins)} coins${capLabel}`
                : `Offline: ${timeLabel} • +0 coins${capLabel}`;

        console.log("OFFLINE_TOAST_DEBUG", {
            elapsedSeconds,
            availableOfflineSeconds,
            cappedSeconds,
            offlineCoins,
            toastMessage
        });

        this.showOfflineToast(toastMessage);
        CryptoZoo.api?.savePlayer?.();
    }
};