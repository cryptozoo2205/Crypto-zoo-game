window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.gameplay = {
    activeScreen: "game",
    expeditionTimerStarted: false,
    boostTimerStarted: false,
    suppressClickUntil: 0,
    touchTapLock: false,
    touchTapTimer: null,
    touchTapTriggered: false,
    maxOfflineSeconds: 1 * 60 * 60,
    dailyRewardCooldownMs: 24 * 60 * 60 * 1000,
    dailyRewardMaxStreak: 7,

    init() {
        this.ensureState();
        this.recalculateProgress();
        this.applyOfflineEarnings();

        this.bindNavigation();
        this.bindTap();
        this.bindBoostShopButton();
        this.bindDailyRewardButton();
        this.bindAnimalButtons();
        this.bindShopButtons();

        const lastScreen = sessionStorage.getItem("cryptozoo_last_screen") || "game";
        this.showScreen(lastScreen);

        this.startIncomeTimer();
        this.startExpeditionTimer();
        this.startBoostTimer();

        CryptoZoo.dailyReward?.startTimer?.();

        CryptoZoo.ui?.render?.();
    },

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.animals = CryptoZoo.state.animals || {};
        CryptoZoo.state.boxes = CryptoZoo.state.boxes || {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0
        };

        const animals = CryptoZoo.config?.animals || {};
        Object.keys(animals).forEach((type) => {
            if (!CryptoZoo.state.animals[type]) {
                CryptoZoo.state.animals[type] = { count: 0, level: 1 };
            }
        });

        const defaults = {
            coins: 0,
            gems: 0,
            rewardBalance: 0,
            rewardWallet: 0,
            withdrawPending: 0,
            level: 1,
            coinsPerClick: 1,
            zooIncome: 0,
            expeditionBoost: 0,
            offlineMaxSeconds: this.maxOfflineSeconds,
            offlineBoostMultiplier: 1,
            offlineBoostActiveUntil: 0,
            offlineBoost: 1,
            xp: 0,
            boost2xActiveUntil: 0,
            lastLogin: Date.now(),
            lastDailyRewardAt: 0,
            dailyRewardStreak: 0,
            playTimeSeconds: 0,
            lastAwardedLevel: 1
        };

        Object.keys(defaults).forEach((key) => {
            if (typeof CryptoZoo.state[key] !== "number") {
                CryptoZoo.state[key] = Number(CryptoZoo.state[key]) || defaults[key];
            }
        });

        if (typeof CryptoZoo.state.dailyRewardClaimDayKey !== "string") {
            CryptoZoo.state.dailyRewardClaimDayKey = String(
                CryptoZoo.state.dailyRewardClaimDayKey || ""
            );
        }

        CryptoZoo.state.level = Math.max(1, Number(CryptoZoo.state.level) || 1);
        CryptoZoo.state.lastAwardedLevel = Math.max(
            1,
            Number(CryptoZoo.state.lastAwardedLevel) || CryptoZoo.state.level || 1
        );

        this.normalizeBoostState();
        this.normalizeOfflineBoostState();
    },

    normalizeBoostTimestamp(value) {
        let safeValue = Number(value) || 0;

        if (safeValue <= 0) return 0;
        if (safeValue < 1000000000000) safeValue *= 1000;

        return safeValue;
    },

    normalizeBoostState() {
        CryptoZoo.state.boost2xActiveUntil = this.normalizeBoostTimestamp(
            CryptoZoo.state?.boost2xActiveUntil
        );

        if (
            CryptoZoo.state.boost2xActiveUntil > 0 &&
            CryptoZoo.state.boost2xActiveUntil <= Date.now()
        ) {
            CryptoZoo.state.boost2xActiveUntil = 0;
        }
    },

    normalizeOfflineBoostState() {
        return CryptoZoo.offline?.normalizeState?.() || false;
    },

    bindTap() {
        const tapButton = document.getElementById("tapButton");
        if (!tapButton) return;

        tapButton.onclick = (e) => {
            e?.preventDefault?.();

            if (Date.now() < this.suppressClickUntil) return;
            this.handleTap();
        };

        tapButton.addEventListener("touchstart", (e) => {
            e.preventDefault();

            if (this.touchTapLock) return;

            this.touchTapLock = true;
            this.touchTapTriggered = false;
            this.suppressClickUntil = Date.now() + 700;

            clearTimeout(this.touchTapTimer);
            this.touchTapTimer = setTimeout(() => {
                this.touchTapTriggered = true;
                this.handleTap();
            }, 20);
        }, { passive: false });

        tapButton.addEventListener("touchmove", (e) => {
            e.preventDefault();
        }, { passive: false });

        const unlock = (e) => {
            const stillTouching = Number(e?.touches?.length) || 0;
            if (stillTouching > 0) return;

            this.touchTapLock = false;
            this.touchTapTriggered = false;
            this.touchTapTimer = null;
        };

        tapButton.addEventListener("touchend", unlock, { passive: false });
        tapButton.addEventListener("touchcancel", unlock, { passive: false });
    },

    handleTap() {
        const value = this.getEffectiveCoinsPerClick();

        CryptoZoo.state.coins += value;
        CryptoZoo.state.xp += 1;
        CryptoZoo.state.lastLogin = Date.now();

        this.recalculateLevel();

        CryptoZoo.audio?.play?.("tap");
        CryptoZoo.ui?.animateCoin?.(1);
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    },

    getBaseCoinsPerClick() {
        return Math.max(
            1,
            Number(CryptoZoo.state?.coinsPerClick) ||
            Number(CryptoZoo.config?.clickValue) ||
            1
        );
    },

    getEffectiveCoinsPerClick() {
        return this.getBaseCoinsPerClick() * this.getBoost2xMultiplier();
    },

    getEffectiveZooIncome() {
        const baseIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        return baseIncome * this.getBoost2xMultiplier();
    },

    bindNavigation() {
        return CryptoZoo.navigation?.bind?.();
    },

    showScreen(screenName) {
        const result = CryptoZoo.navigation?.show?.(screenName);

        if (typeof screenName === "string" && screenName) {
            this.activeScreen = screenName;
        }

        return result;
    },

    startIncomeTimer() {
        return CryptoZoo.incomeSystem?.start?.();
    },

    bindBoostShopButton() {
        return CryptoZoo.boostSystem?.bindShopButton?.();
    },

    isBoost2xActive() {
        return CryptoZoo.boostSystem?.isActive?.();
    },

    getBoost2xMultiplier() {
        return CryptoZoo.boostSystem?.getMultiplier?.() || 1;
    },

    getBoost2xTimeLeft() {
        return CryptoZoo.boostSystem?.getTimeLeft?.() || 0;
    },

    activateBoost2x() {
        return CryptoZoo.boostSystem?.activate?.();
    },

    bindAnimalButtons() {
        return CryptoZoo.animalsSystem?.bindButtons?.();
    },

    bindShopButtons() {
        return CryptoZoo.shopSystem?.bindButtons?.();
    },

    bindDailyRewardButton() {
        const btn = document.getElementById("homeDailyBtn");
        if (btn) {
            btn.onclick = () => CryptoZoo.dailyReward?.claim?.();
        }
    },

    applyOfflineEarnings() {
        return CryptoZoo.offline?.applyEarnings?.();
    },

    recalculateZooIncome() {
        const animals = CryptoZoo.config?.animals || {};
        let total = 0;

        Object.keys(animals).forEach((type) => {
            const a = CryptoZoo.state.animals[type] || { count: 0, level: 1 };
            total += a.count * a.level * (animals[type].baseIncome || 0);
        });

        CryptoZoo.state.zooIncome = total;
        return total;
    },

    getLevelRequirement(level) {
        const safeLevel = Math.max(1, Number(level) || 1);
        return 100 + (safeLevel - 1) * 100;
    },

    getLevelProgressData() {
        const xp = Math.max(0, Number(CryptoZoo.state?.xp) || 0);

        let level = 1;
        let req = this.getLevelRequirement(level);
        let used = 0;

        while (xp >= used + req) {
            used += req;
            level += 1;
            req = this.getLevelRequirement(level);
        }

        return {
            level,
            currentXp: Math.max(0, xp - used),
            requiredXp: req,
            totalUsedXp: used
        };
    },

    getLevelReward(level) {
        const safeLevel = Math.max(1, Number(level) || 1);

        const rewardTable = {
            2: { coins: 20, gems: 0 },
            3: { coins: 35, gems: 0 },
            4: { coins: 55, gems: 0 },
            5: { coins: 80, gems: 0 },
            6: { coins: 110, gems: 0 },
            7: { coins: 145, gems: 0 },
            8: { coins: 185, gems: 0 },
            9: { coins: 230, gems: 0 },
            10: { coins: 280, gems: 1 }
        };

        if (rewardTable[safeLevel]) {
            return rewardTable[safeLevel];
        }

        return {
            coins: Math.floor(30 * Math.pow(safeLevel, 1.28)),
            gems: safeLevel % 10 === 0 ? 1 : 0
        };
    },

    awardPendingLevelRewards() {
        CryptoZoo.state = CryptoZoo.state || {};

        const currentLevel = Math.max(1, Number(CryptoZoo.state.level) || 1);
        let lastAwardedLevel = Math.max(
            1,
            Number(CryptoZoo.state.lastAwardedLevel) || 1
        );

        if (lastAwardedLevel >= currentLevel) {
            return false;
        }

        let totalCoins = 0;
        let totalGems = 0;

        for (let level = lastAwardedLevel + 1; level <= currentLevel; level += 1) {
            const reward = this.getLevelReward(level);
            totalCoins += reward.coins;
            totalGems += reward.gems;
        }

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + totalCoins;
        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + totalGems;
        CryptoZoo.state.lastAwardedLevel = currentLevel;

        const rewardText = [
            `Lvl ${CryptoZoo.formatNumber(currentLevel)}`,
            `+${CryptoZoo.formatNumber(totalCoins)} coins`,
            totalGems > 0 ? `+${CryptoZoo.formatNumber(totalGems)} gem` : ""
        ].filter(Boolean).join(" • ");

        CryptoZoo.audio?.play?.("win");
        CryptoZoo.ui?.showToast?.(`🎉 ${rewardText}`);
        return true;
    },

    recalculateLevel() {
        const previousLevel = Math.max(1, Number(CryptoZoo.state?.level) || 1);
        const progress = this.getLevelProgressData();
        const nextLevel = Math.max(previousLevel, progress.level);

        CryptoZoo.state.level = nextLevel;

        if (nextLevel > previousLevel) {
            this.awardPendingLevelRewards();
        }

        return nextLevel;
    },

    recalculateProgress() {
        this.recalculateZooIncome();
        this.recalculateLevel();
        this.normalizeBoostState();
        this.normalizeOfflineBoostState();
    },

    persistAndRender() {
        this.recalculateProgress();
        CryptoZoo.state.lastLogin = Date.now();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    },

    startBoostTimer() {
        if (this.boostTimerStarted) return;
        this.boostTimerStarted = true;

        setInterval(() => {
            this.normalizeBoostState();
            this.normalizeOfflineBoostState();
            CryptoZoo.ui?.renderBoostStatus?.();
            CryptoZoo.ui?.renderDailyRewardStatus?.();

            if (this.activeScreen === "missions") {
                CryptoZoo.ui?.renderExpeditions?.();
            }
        }, 1000);
    },

    startExpeditionTimer() {
        if (this.expeditionTimerStarted) return;
        this.expeditionTimerStarted = true;

        setInterval(() => {
            if (this.activeScreen === "missions") {
                CryptoZoo.ui?.renderExpeditions?.();
            }
        }, 1000);
    }
};