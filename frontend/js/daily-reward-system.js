window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.dailyReward = {
    unlockAfterSeconds: 60 * 60,

    timerStarted: false,

    startTimer() {
        if (this.timerStarted) return;
        this.timerStarted = true;

        setInterval(() => {
            // tylko odśwież UI (bez resetów!)
            CryptoZoo.ui?.renderDailyRewardStatus?.();
        }, 1000);
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

    getPlayTimeSeconds() {
        return Math.max(0, Number(CryptoZoo.state?.playTimeSeconds) || 0);
    },

    getRemainingUnlockSeconds() {
        return Math.max(0, this.getUnlockAfterSeconds() - this.getPlayTimeSeconds());
    },

    isUnlocked() {
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
            250,
            Math.floor(level * 120 + income * 45 + click * 25)
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
        else if (level >= 5 || income >= 150) gems = 1;

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
                `Odblokuje się za ${CryptoZoo.ui.formatTimeLeft(left)}`
            );
            return false;
        }

        if (!this.canClaim()) {
            const left = Math.ceil(this.getTimeLeftMs() / 1000);
            CryptoZoo.ui?.showToast?.(
                `Za ${CryptoZoo.ui.formatTimeLeft(left)}`
            );
            return false;
        }

        const streak = this.updateStreak();
        const coins = this.getCoinsAmount();
        const gems = this.getGemsAmount();

        CryptoZoo.state.coins += coins;
        CryptoZoo.state.gems += gems;
        CryptoZoo.state.lastDailyRewardAt = Date.now();

        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        CryptoZoo.ui?.showToast?.(
            `🎁 Day ${streak} • +${CryptoZoo.formatNumber(coins)} coins${gems ? ` +${gems} gem` : ""}`
        );

        return true;
    }
};