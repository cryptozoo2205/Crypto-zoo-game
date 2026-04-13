window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.dailyReward = {
    unlockAfterSeconds: 60 * 60,
    timerStarted: false,

    getFirstUnlockStorageKey() {
        const playerId = CryptoZoo.api?.getPlayerId?.() || "local-player";
        return `cryptozoo_first_daily_unlock_started_at_${playerId}`;
    },

    init() {
        CryptoZoo.state = CryptoZoo.state || {};

        CryptoZoo.state.lastDailyRewardAt = Math.max(
            0,
            Number(CryptoZoo.state.lastDailyRewardAt) || 0
        );

        CryptoZoo.state.dailyRewardStreak = Math.max(
            0,
            Math.floor(Number(CryptoZoo.state.dailyRewardStreak) || 0)
        );

        if (typeof CryptoZoo.state.dailyRewardClaimDayKey !== "string") {
            CryptoZoo.state.dailyRewardClaimDayKey = String(
                CryptoZoo.state.dailyRewardClaimDayKey || ""
            );
        }

        this.syncFirstUnlockState();
        this.ensureFirstUnlockTimerStarted();
        this.normalizeClaimState();
        this.startTimer();
    },

    startTimer() {
        if (this.timerStarted) return;
        this.timerStarted = true;

        setInterval(() => {
            this.tick();
        }, 1000);

        document.addEventListener("visibilitychange", () => {
            this.tick();
        });

        window.addEventListener("focus", () => {
            this.tick();
        });
    },

    tick() {
        this.syncFirstUnlockState();
        this.ensureFirstUnlockTimerStarted();
        this.normalizeClaimState();
        CryptoZoo.ui?.renderDailyRewardStatus?.();
    },

    isVisibleAndPlayable() {
        return document.visibilityState === "visible";
    },

    hasClaimedAtLeastOnce() {
        return Math.max(0, Number(CryptoZoo.state?.lastDailyRewardAt) || 0) > 0;
    },

    getFirstUnlockStartedAt() {
        const raw = localStorage.getItem(this.getFirstUnlockStorageKey());
        return Math.max(0, Number(raw) || 0);
    },

    setFirstUnlockStartedAt(timestamp) {
        localStorage.setItem(
            this.getFirstUnlockStorageKey(),
            String(Math.max(0, Number(timestamp) || 0))
        );
    },

    clearFirstUnlockStartedAt() {
        localStorage.removeItem(this.getFirstUnlockStorageKey());
    },

    syncFirstUnlockState() {
        if (this.hasClaimedAtLeastOnce()) {
            this.clearFirstUnlockStartedAt();
            return;
        }

        const startedAt = this.getFirstUnlockStartedAt();
        const now = Date.now();

        if (startedAt > now) {
            this.clearFirstUnlockStartedAt();
            return;
        }

        if (startedAt > 0) {
            const unlockAt = startedAt + (this.getUnlockAfterSeconds() * 1000);

            if (unlockAt <= now) {
                return;
            }
        }
    },

    ensureFirstUnlockTimerStarted() {
        if (this.hasClaimedAtLeastOnce()) return;
        if (!this.isVisibleAndPlayable()) return;

        const startedAt = this.getFirstUnlockStartedAt();
        if (!startedAt) {
            this.setFirstUnlockStartedAt(Date.now());
        }
    },

    normalizeClaimState() {
        CryptoZoo.state = CryptoZoo.state || {};

        const last = Math.max(0, Number(CryptoZoo.state.lastDailyRewardAt) || 0);
        if (!last) return;

        const cooldownMs = this.getCooldownMs();
        const readyAt = last + cooldownMs;
        const now = Date.now();

        if (readyAt <= now) {
            return;
        }

        if (last > now) {
            CryptoZoo.state.lastDailyRewardAt = 0;
            CryptoZoo.state.dailyRewardStreak = 0;
            CryptoZoo.state.dailyRewardClaimDayKey = "";
            this.clearFirstUnlockStartedAt();
            this.ensureFirstUnlockTimerStarted();
        }
    },

    getCooldownMs() {
        return Math.max(
            0,
            Number(CryptoZoo.gameplay?.dailyRewardCooldownMs) || 24 * 60 * 60 * 1000
        );
    },

    getMaxStreak() {
        return Math.max(
            1,
            Math.floor(Number(CryptoZoo.gameplay?.dailyRewardMaxStreak) || 7)
        );
    },

    getUnlockAfterSeconds() {
        return Math.max(0, Number(this.unlockAfterSeconds) || 0);
    },

    getRemainingUnlockSeconds() {
        if (this.hasClaimedAtLeastOnce()) {
            return 0;
        }

        const startedAt = this.getFirstUnlockStartedAt();
        if (!startedAt) {
            return this.getUnlockAfterSeconds();
        }

        const unlockAt = startedAt + this.getUnlockAfterSeconds() * 1000;
        return Math.max(0, Math.ceil((unlockAt - Date.now()) / 1000));
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
        return Math.max(
            0,
            Math.min(
                this.getMaxStreak(),
                Math.floor(Number(CryptoZoo.state?.dailyRewardStreak) || 0)
            )
        );
    },

    getNextClaimDay() {
        const streak = this.getStreak();

        if (streak <= 0) {
            return 1;
        }

        return Math.min(this.getMaxStreak(), streak + 1);
    },

    getCurrentClaimDay() {
        const streak = this.getStreak();
        return Math.max(1, Math.min(this.getMaxStreak(), streak || 1));
    },

    getReadyAtTimestamp() {
        if (!this.isUnlocked()) {
            const startedAt = this.getFirstUnlockStartedAt();
            if (!startedAt) return Date.now() + (this.getUnlockAfterSeconds() * 1000);
            return startedAt + (this.getUnlockAfterSeconds() * 1000);
        }

        const last = Number(CryptoZoo.state?.lastDailyRewardAt) || 0;
        if (!last) return 0;

        return last + this.getCooldownMs();
    },

    getTimeLeftMs() {
        if (!this.isUnlocked()) {
            return this.getRemainingUnlockSeconds() * 1000;
        }

        const readyAt = this.getReadyAtTimestamp();
        if (!readyAt) {
            return 0;
        }

        const left = Math.max(0, readyAt - Date.now());
        return left <= 1000 ? 0 : left;
    },

    canClaim() {
        return this.isUnlocked() && this.getTimeLeftMs() <= 0;
    },

    getRewardForDay(day) {
        const safeDay = Math.max(1, Math.min(this.getMaxStreak(), Number(day) || 1));

        const table = {
            1: { coins: 200, gems: 0 },
            2: { coins: 300, gems: 0 },
            3: { coins: 500, gems: 1 },
            4: { coins: 800, gems: 0 },
            5: { coins: 1200, gems: 1 },
            6: { coins: 1800, gems: 0 },
            7: { coins: 3000, gems: 2 }
        };

        return table[safeDay] || table[1];
    },

    getCoinsAmount() {
        const nextDay = this.canClaim()
            ? this.getNextClaimDay()
            : (this.getStreak() > 0 ? this.getCurrentClaimDay() : 1);

        return Math.max(0, Number(this.getRewardForDay(nextDay).coins) || 0);
    },

    getGemsAmount() {
        const nextDay = this.canClaim()
            ? this.getNextClaimDay()
            : (this.getStreak() > 0 ? this.getCurrentClaimDay() : 1);

        return Math.max(0, Number(this.getRewardForDay(nextDay).gems) || 0);
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
        } else if (prev === today) {
            CryptoZoo.state.dailyRewardStreak = this.getStreak() || 1;
        } else {
            CryptoZoo.state.dailyRewardStreak = 1;
        }

        CryptoZoo.state.dailyRewardClaimDayKey = today;
        return CryptoZoo.state.dailyRewardStreak;
    },

    getInfoText() {
        const nextDay = this.getNextClaimDay();
        const reward = this.getRewardForDay(nextDay);

        return reward.gems > 0
            ? `Day ${nextDay}: ${CryptoZoo.formatNumber(reward.coins)} coins + ${CryptoZoo.formatNumber(reward.gems)} gem`
            : `Day ${nextDay}: ${CryptoZoo.formatNumber(reward.coins)} coins`;
    },

    async claim() {
        this.normalizeClaimState();

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
        const reward = this.getRewardForDay(streak);
        const coins = Math.max(0, Number(reward.coins) || 0);
        const gems = Math.max(0, Number(reward.gems) || 0);

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + coins;
        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + gems;
        CryptoZoo.state.lastDailyRewardAt = Date.now();
        CryptoZoo.state.lastLogin = Date.now();
        CryptoZoo.state.updatedAt = Date.now();

        this.clearFirstUnlockStartedAt();

        CryptoZoo.audio?.play?.("win");
        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.render?.();

        try {
            await CryptoZoo.api?.savePlayer?.();
            await CryptoZoo.api?.flushSave?.(true);
        } catch (error) {
            console.warn("Daily reward immediate save failed:", error);
        }

        CryptoZoo.ui?.showToast?.(
            `🎁 Day ${streak} • +${CryptoZoo.formatNumber(coins)} coins${gems ? ` +${CryptoZoo.formatNumber(gems)} gem` : ""}`
        );

        return true;
    }
};

CryptoZoo.dailyReward.init();