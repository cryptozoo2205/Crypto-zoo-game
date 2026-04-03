window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.dailyReward = {
    unlockAfterSeconds: 60 * 60,
    timerStarted: false,
    claimInProgress: false,

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

        this.claimInProgress = false;
        this.normalizeState();
        this.syncFirstUnlockState();
        this.ensureFirstUnlockTimerStarted();
        this.startTimer();
        this.refreshUi();
    },

    normalizeState() {
        CryptoZoo.state = CryptoZoo.state || {};

        CryptoZoo.state.lastDailyRewardAt = Math.max(
            0,
            Number(CryptoZoo.state.lastDailyRewardAt) || 0
        );

        CryptoZoo.state.dailyRewardStreak = Math.max(
            0,
            Math.min(
                this.getMaxStreak(),
                Math.floor(Number(CryptoZoo.state.dailyRewardStreak) || 0)
            )
        );

        if (typeof CryptoZoo.state.dailyRewardClaimDayKey !== "string") {
            CryptoZoo.state.dailyRewardClaimDayKey = "";
        }

        const todayKey = this.getDayKeyFromTimestamp();
        const yesterdayKey = this.getYesterdayDayKey();
        const storedKey = String(CryptoZoo.state.dailyRewardClaimDayKey || "");

        if (storedKey && storedKey !== todayKey && storedKey !== yesterdayKey) {
            CryptoZoo.state.dailyRewardStreak = 0;
        }
    },

    startTimer() {
        if (this.timerStarted) return;
        this.timerStarted = true;

        setInterval(() => {
            this.normalizeState();
            this.syncFirstUnlockState();
            this.ensureFirstUnlockTimerStarted();
            this.refreshUi();
        }, 1000);

        document.addEventListener("visibilitychange", () => {
            this.normalizeState();
            this.syncFirstUnlockState();
            this.ensureFirstUnlockTimerStarted();
            this.refreshUi();
        });

        window.addEventListener("focus", () => {
            this.normalizeState();
            this.syncFirstUnlockState();
            this.ensureFirstUnlockTimerStarted();
            this.refreshUi();
        });
    },

    refreshUi() {
        CryptoZoo.ui?.renderDailyRewardStatus?.();
        CryptoZoo.ui?.render?.();
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

        if (startedAt > Date.now()) {
            this.clearFirstUnlockStartedAt();
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

    getDisplayDay() {
        const streak = this.getStreak();
        const dayKey = String(CryptoZoo.state?.dailyRewardClaimDayKey || "");
        const todayKey = this.getDayKeyFromTimestamp();

        if (!streak) {
            return 1;
        }

        if (this.canClaim()) {
            if (dayKey && dayKey !== todayKey) {
                return Math.min(this.getMaxStreak(), streak + 1);
            }

            if (!dayKey) {
                return 1;
            }
        }

        return Math.max(1, Math.min(this.getMaxStreak(), streak));
    },

    getNextClaimDay() {
        const streak = this.getStreak();
        const todayKey = this.getDayKeyFromTimestamp();
        const storedKey = String(CryptoZoo.state?.dailyRewardClaimDayKey || "");

        if (!storedKey) {
            return 1;
        }

        if (storedKey === todayKey) {
            return Math.min(this.getMaxStreak(), streak || 1);
        }

        return Math.min(this.getMaxStreak(), Math.max(1, streak + 1));
    },

    getCurrentClaimDay() {
        const streak = this.getStreak();
        return Math.max(1, Math.min(this.getMaxStreak(), streak || 1));
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
        if (!this.isUnlocked()) return false;
        return this.getTimeLeftMs() <= 0;
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

    getRewardDayForDisplay() {
        if (this.canClaim()) {
            return this.getNextClaimDay();
        }

        return this.getDisplayDay();
    },

    getCoinsAmount() {
        const day = this.getRewardDayForDisplay();
        return Math.max(0, Number(this.getRewardForDay(day).coins) || 0);
    },

    getGemsAmount() {
        const day = this.getRewardDayForDisplay();
        return Math.max(0, Number(this.getRewardForDay(day).gems) || 0);
    },

    updateStreak() {
        CryptoZoo.state = CryptoZoo.state || {};

        const today = this.getDayKeyFromTimestamp();
        const yesterday = this.getYesterdayDayKey();
        const prev = String(CryptoZoo.state?.dailyRewardClaimDayKey || "");

        if (!prev) {
            CryptoZoo.state.dailyRewardStreak = 1;
        } else if (prev === today) {
            CryptoZoo.state.dailyRewardStreak = Math.max(1, this.getStreak());
        } else if (prev === yesterday) {
            CryptoZoo.state.dailyRewardStreak = Math.min(
                this.getMaxStreak(),
                Math.max(1, this.getStreak()) + 1
            );
        } else {
            CryptoZoo.state.dailyRewardStreak = 1;
        }

        CryptoZoo.state.dailyRewardClaimDayKey = today;
        return CryptoZoo.state.dailyRewardStreak;
    },

    getInfoText() {
        const nextDay = this.getRewardDayForDisplay();
        const reward = this.getRewardForDay(nextDay);

        return reward.gems > 0
            ? `Day ${nextDay}: ${CryptoZoo.formatNumber(reward.coins)} coins + ${CryptoZoo.formatNumber(reward.gems)} gem`
            : `Day ${nextDay}: ${CryptoZoo.formatNumber(reward.coins)} coins`;
    },

    async claim() {
        if (this.claimInProgress) {
            return false;
        }

        this.normalizeState();

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

        this.claimInProgress = true;

        try {
            CryptoZoo.state = CryptoZoo.state || {};

            const streak = this.updateStreak();
            const reward = this.getRewardForDay(streak);
            const coins = Math.max(0, Number(reward.coins) || 0);
            const gems = Math.max(0, Number(reward.gems) || 0);

            CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + coins;
            CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + gems;
            CryptoZoo.state.lastDailyRewardAt = Date.now();

            this.clearFirstUnlockStartedAt();

            CryptoZoo.audio?.play?.("win");
            CryptoZoo.gameplay?.recalculateProgress?.();
            this.refreshUi();

            try {
                await CryptoZoo.api?.savePlayer?.();
            } catch (error) {
                console.error("Daily reward save failed:", error);
            }

            CryptoZoo.ui?.showToast?.(
                `🎁 Day ${streak} • +${CryptoZoo.formatNumber(coins)} coins${gems ? ` +${CryptoZoo.formatNumber(gems)} gem` : ""}`
            );

            this.refreshUi();
            return true;
        } finally {
            this.claimInProgress = false;
        }
    }
};

CryptoZoo.dailyReward.init();