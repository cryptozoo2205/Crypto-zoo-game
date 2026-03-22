window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.dailyReward = {
    unlockAfterSeconds: 60 * 60,
    timerStarted: false,
    firstUnlockStorageKey: "cryptozoo_first_daily_unlock_started_at",

    init() {
        CryptoZoo.state = CryptoZoo.state || {};

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

        this.ensureFirstUnlockTimerStarted();
        this.startTimer();
    },

    startTimer() {
        if (this.timerStarted) return;
        this.timerStarted = true;

        setInterval(() => {
            this.ensureFirstUnlockTimerStarted();
            CryptoZoo.ui?.renderDailyRewardStatus?.();
        }, 1000);

        document.addEventListener("visibilitychange", () => {
            this.ensureFirstUnlockTimerStarted();
            CryptoZoo.ui?.renderDailyRewardStatus?.();
        });

        window.addEventListener("focus", () => {
            this.ensureFirstUnlockTimerStarted();
        });
    },

    isVisibleAndPlayable() {
        return document.visibilityState === "visible";
    },

    hasClaimedAtLeastOnce() {
        return Math.max(0, Number(CryptoZoo.state?.lastDailyRewardAt) || 0) > 0;
    },

    getFirstUnlockStartedAt() {
        const raw = localStorage.getItem(this.firstUnlockStorageKey);
        return Math.max(0, Number(raw) || 0);
    },

    setFirstUnlockStartedAt(timestamp) {
        localStorage.setItem(this.firstUnlockStorageKey, String(Math.max(0, Number(timestamp) || 0)));
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
        return Number(CryptoZoo.gameplay?.dailyRewardCooldownMs) || 24 * 60 * 60 * 1000;
    },

    getMaxStreak() {
        return Number(CryptoZoo.gameplay?.dailyRewardMaxStreak) || 7;
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