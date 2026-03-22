window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.dailyReward = {
    unlockAfterSeconds: 60 * 60,
    timerStarted: false,
    sessionStartedAt: 0,
    persistCounter: 0,

    init() {
        CryptoZoo.state = CryptoZoo.state || {};

        CryptoZoo.state.playTimeSeconds = Math.max(
            0,
            Number(CryptoZoo.state.playTimeSeconds) || 0
        );

        CryptoZoo.state.lastDailyRewardAt = Math.max(
            0,
            Number(CryptoZoo.state.lastDailyRewardAt) || 0
        );

        CryptoZoo.state.dailyRewardStreak = Math.max(
            0,
            Number(CryptoZoo.state.dailyRewardStreak) || 0
        );

        if (typeof CryptoZoo.state.dailyRewardClaimDayKey !== "string") {
            CryptoZoo.state.dailyRewardClaimDayKey = String(
                CryptoZoo.state.dailyRewardClaimDayKey || ""
            );
        }

        this.refreshSessionTracking();
        this.startTimer();
    },

    startTimer() {
        if (this.timerStarted) return;
        this.timerStarted = true;

        setInterval(() => {
            this.refreshSessionTracking();
            CryptoZoo.ui?.renderDailyRewardStatus?.();

            this.persistCounter += 1;
            if (this.persistCounter >= 15) {
                this.persistCounter = 0;
                CryptoZoo.api?.savePlayer?.();
            }
        }, 1000);

        document.addEventListener("visibilitychange", () => {
            this.refreshSessionTracking(true);
            CryptoZoo.ui?.renderDailyRewardStatus?.();
        });

        window.addEventListener("beforeunload", () => {
            this.refreshSessionTracking(true);
        });
    },

    isGameplaySessionActive() {
        const isVisible = document.visibilityState === "visible";
        const isGameScreen = (CryptoZoo.gameplay?.activeScreen || "game") === "game";
        return isVisible && isGameScreen;
    },

    refreshSessionTracking(forceCommit = false) {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.playTimeSeconds = Math.max(
            0,
            Number(CryptoZoo.state.playTimeSeconds) || 0
        );

        const now = Date.now();
        const isActive = this.isGameplaySessionActive();

        if (isActive) {
            if (!this.sessionStartedAt) {
                this.sessionStartedAt = now;
            }
            return;
        }

        if (this.sessionStartedAt || forceCommit) {
            const startedAt = Number(this.sessionStartedAt) || 0;

            if (startedAt > 0) {
                const elapsedSeconds = Math.max(
                    0,
                    Math.floor((now - startedAt) / 1000)
                );

                if (elapsedSeconds > 0) {
                    CryptoZoo.state.playTimeSeconds += elapsedSeconds;
                }
            }

            this.sessionStartedAt = 0;
        }
    },

    getCooldownMs() {
        return Number(CryptoZoo.gameplay?.dailyRewardCooldownMs) || 24 * 60 * 60 * 1000;
    },

    getMaxStreak() {
        return Number(CryptoZoo.gameplay?.dailyRewardMaxStreak) || 7;
    },

    getUnlockAfterSeconds() {
        return Math.max(0, Number(this.unlockAfterSeconds) || 0);
    },

    hasClaimedAtLeastOnce() {
        return Math.max(0, Number(CryptoZoo.state?.lastDailyRewardAt) || 0) > 0;
    },

    getPlayTimeSeconds() {
        CryptoZoo.state = CryptoZoo.state || {};

        const stored = Math.max(0, Number(CryptoZoo.state.playTimeSeconds) || 0);

        if (!this.sessionStartedAt) {
            return stored;
        }

        const liveExtra = Math.max(
            0,
            Math.floor((Date.now() - this.sessionStartedAt) / 1000)
        );

        return stored + liveExtra;
    },

    getRemainingUnlockSeconds() {
        if (this.hasClaimedAtLeastOnce()) {
            return 0;
        }

        return Math.max(0, this.getUnlockAfterSeconds() - this.getPlayTimeSeconds());
    },

    isUnlocked() {
        if (this.hasClaimedAtLeastOnce()) {
            return true;
        }

        return this.getRemainingUnlockSeconds() <= 0;
    },

    getDayKeyFromTimestamp(timestamp = Date.now()) {
        const date = new Date(Number(timestamp) || Date.now());
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    },

    getYesterdayDayKey() {
        const now = new Date();
        now.setDate(now.getDate() - 1);
        return this.getDayKeyFromTimestamp(now.getTime());
    },

    getStreak() {
        return Math.min(
            this.getMaxStreak(),
            Math.max(0, Number(CryptoZoo.state?.dailyRewardStreak) || 0)
        );
    },

    getTimeLeftMs() {
        if (!this.isUnlocked()) {
            return this.getRemainingUnlockSeconds() * 1000;
        }

        const last = Number(CryptoZoo.state?.lastDailyRewardAt) || 0;
        if (!last) return 0;

        return Math.max(0, (last + this.getCooldownMs()) - Date.now());
    },

    canClaim() {
        return this.isUnlocked() && this.getTimeLeftMs() <= 0;
    },

    getCoinsAmount() {
        const level = Math.max(1, Number(CryptoZoo.state?.level) || 1);
        const income = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        const click = Math.max(1, Number(CryptoZoo.state?.coinsPerClick) || 1);
        const streak = this.getStreak();

        const base = Math.max(
            100,
            Math.floor(level * 35 + income * 12 + click * 10)
        );

        return Math.floor(base * (1 + streak * 0.08));
    },

    getGemsAmount() {
        const level = Math.max(1, Number(CryptoZoo.state?.level) || 1);
        const income = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        const streak = this.getStreak();

        let gems = 0;

        if (level >= 40 || income >= 20000) gems = 3;
        else if (level >= 20 || income >= 3000) gems = 2;
        else if (level >= 8 || income >= 250) gems = 1;

        if (streak >= this.getMaxStreak()) gems += 1;

        return gems;
    },

    updateStreak() {
        CryptoZoo.state = CryptoZoo.state || {};

        const today = this.getDayKeyFromTimestamp();
        const yesterday = this.getYesterdayDayKey();
        const prev = String(CryptoZoo.state?.dailyRewardClaimDayKey || "");

        if (!prev) {
            CryptoZoo.state.dailyRewardStreak = 1;
        } else if (prev === yesterday) {
            CryptoZoo.state.dailyRewardStreak = Math.min(
                this.getMaxStreak(),
                this.getStreak() + 1
            );
        } else if (prev !== today) {
            CryptoZoo.state.dailyRewardStreak = 1;
        }

        CryptoZoo.state.dailyRewardClaimDayKey = today;
        return CryptoZoo.state.dailyRewardStreak;
    },

    claim() {
        if (!this.isUnlocked()) {
            const left = Math.ceil(this.getRemainingUnlockSeconds());
            CryptoZoo.ui?.showToast?.(
                `Odblokuje się za ${CryptoZoo.ui?.formatTimeLeft?.(left) || "00:00:00"}`
            );
            return false;
        }

        if (!this.canClaim()) {
            const left = Math.ceil(this.getTimeLeftMs() / 1000);
            CryptoZoo.ui?.showToast?.(
                `Za ${CryptoZoo.ui?.formatTimeLeft?.(left) || "00:00:00"}`
            );
            return false;
        }

        CryptoZoo.state = CryptoZoo.state || {};

        const streak = this.updateStreak();
        const coins = this.getCoinsAmount();
        const gems = this.getGemsAmount();

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + coins;
        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + gems;
        CryptoZoo.state.lastDailyRewardAt = Date.now();

        CryptoZoo.audio?.play?.("win");
        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        CryptoZoo.ui?.showToast?.(
            `🎁 Day ${streak} • +${CryptoZoo.formatNumber(coins)} coins${gems ? ` +${gems} gem` : ""}`
        );

        return true;
    }
};

CryptoZoo.dailyReward.init();