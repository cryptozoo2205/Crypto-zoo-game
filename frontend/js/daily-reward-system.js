window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.dailyReward = {
    getCooldownMs() {
        return Number(CryptoZoo.gameplay?.dailyRewardCooldownMs) || 24 * 60 * 60 * 1000;
    },

    getMaxStreak() {
        return Number(CryptoZoo.gameplay?.dailyRewardMaxStreak) || 7;
    },

    getDayKeyFromTimestamp(timestamp = Date.now()) {
        const date = new Date(Number(timestamp) || Date.now());
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
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
        const lastClaimAt = Math.max(0, Number(CryptoZoo.state?.lastDailyRewardAt) || 0);

        if (lastClaimAt <= 0) {
            return 0;
        }

        const nextClaimAt = lastClaimAt + this.getCooldownMs();
        return Math.max(0, nextClaimAt - Date.now());
    },

    canClaim() {
        return this.getTimeLeftMs() <= 0;
    },

    getCoinsAmount() {
        const level = Math.max(1, Number(CryptoZoo.state?.level) || 1);
        const zooIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        const coinsPerClick = Math.max(1, Number(CryptoZoo.state?.coinsPerClick) || 1);
        const streak = this.getStreak();

        const levelPart = level * 120;
        const incomePart = zooIncome * 45;
        const clickPart = coinsPerClick * 25;
        const minimumReward = 250;

        const baseReward = Math.max(
            minimumReward,
            Math.floor(levelPart + incomePart + clickPart)
        );

        const streakMultiplier = 1 + streak * 0.08;

        return Math.max(minimumReward, Math.floor(baseReward * streakMultiplier));
    },

    getGemsAmount() {
        const level = Math.max(1, Number(CryptoZoo.state?.level) || 1);
        const zooIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        const streak = this.getStreak();

        let gems = 0;

        if (level >= 40 || zooIncome >= 20000) gems = 3;
        else if (level >= 20 || zooIncome >= 3000) gems = 2;
        else if (level >= 5 || zooIncome >= 150) gems = 1;

        if (streak >= this.getMaxStreak()) {
            gems += 1;
        }

        return gems;
    },

    getRewardBalanceAmount() {
        const streak = this.getStreak();

        if (streak >= this.getMaxStreak()) {
            return 1;
        }

        return 0;
    },

    updateStreak() {
        CryptoZoo.state = CryptoZoo.state || {};

        const todayKey = this.getDayKeyFromTimestamp(Date.now());
        const yesterdayKey = this.getYesterdayDayKey();
        const previousKey = String(CryptoZoo.state?.dailyRewardClaimDayKey || "");
        const currentStreak = this.getStreak();

        if (previousKey === todayKey) {
            return currentStreak > 0 ? currentStreak : 1;
        }

        if (!previousKey) {
            CryptoZoo.state.dailyRewardStreak = 1;
        } else if (previousKey === yesterdayKey) {
            CryptoZoo.state.dailyRewardStreak = Math.min(
                this.getMaxStreak(),
                currentStreak + 1
            );
        } else {
            CryptoZoo.state.dailyRewardStreak = 1;
        }

        CryptoZoo.state.dailyRewardClaimDayKey = todayKey;
        return CryptoZoo.state.dailyRewardStreak;
    },

    claim() {
        CryptoZoo.state = CryptoZoo.state || {};

        if (!this.canClaim()) {
            const timeLeftSeconds = Math.ceil(this.getTimeLeftMs() / 1000);

            CryptoZoo.ui?.showToast?.(
                `Daily Reward za: ${CryptoZoo.ui?.formatTimeLeft?.(timeLeftSeconds) || "00:00:00"}`
            );
            return false;
        }

        const streak = this.updateStreak();
        const coinsReward = this.getCoinsAmount();
        const gemsReward = this.getGemsAmount();
        const rewardBalanceReward = this.getRewardBalanceAmount();

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + coinsReward;
        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + gemsReward;
        CryptoZoo.state.rewardBalance = (Number(CryptoZoo.state.rewardBalance) || 0) + rewardBalanceReward;
        CryptoZoo.state.lastDailyRewardAt = Date.now();
        CryptoZoo.state.lastLogin = Date.now();

        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        if (rewardBalanceReward > 0) {
            CryptoZoo.ui?.showToast?.(
                gemsReward > 0
                    ? `🎁 Day ${streak} • +${CryptoZoo.formatNumber(coinsReward)} coins +${CryptoZoo.formatNumber(gemsReward)} gem +${CryptoZoo.formatNumber(rewardBalanceReward)} reward`
                    : `🎁 Day ${streak} • +${CryptoZoo.formatNumber(coinsReward)} coins +${CryptoZoo.formatNumber(rewardBalanceReward)} reward`
            );
        } else {
            CryptoZoo.ui?.showToast?.(
                gemsReward > 0
                    ? `🎁 Day ${streak} • +${CryptoZoo.formatNumber(coinsReward)} coins +${CryptoZoo.formatNumber(gemsReward)} gem`
                    : `🎁 Day ${streak} • +${CryptoZoo.formatNumber(coinsReward)} coins`
            );
        }

        return true;
    }
};