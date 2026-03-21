window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.gameplay = {
    activeScreen: "game",
    expeditionTimerStarted: false,
    boostTimerStarted: false,
    suppressClickUntil: 0,
    touchTapLock: false,
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

        const lastScreen = sessionStorage.getItem("cryptozoo_last_screen") || "game";
        this.showScreen(lastScreen);

        this.bindAnimalButtons();
        this.bindShopButtons();

        this.startIncomeTimer();
        this.startExpeditionTimer();
        this.startBoostTimer();

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

        const numericDefaults = {
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
            playTimeSeconds: 0
        };

        Object.keys(numericDefaults).forEach((key) => {
            if (typeof CryptoZoo.state[key] !== "number") {
                CryptoZoo.state[key] = Number(CryptoZoo.state[key]) || numericDefaults[key];
            }
        });

        if (typeof CryptoZoo.state.dailyRewardClaimDayKey !== "string") {
            CryptoZoo.state.dailyRewardClaimDayKey = String(CryptoZoo.state.dailyRewardClaimDayKey || "");
        }

        CryptoZoo.state.coinsPerClick = Math.max(1, Number(CryptoZoo.state.coinsPerClick) || 1);
        CryptoZoo.state.level = Math.max(1, Number(CryptoZoo.state.level) || 1);
        CryptoZoo.state.dailyRewardStreak = Math.min(
            this.dailyRewardMaxStreak,
            Math.max(0, Number(CryptoZoo.state.dailyRewardStreak) || 0)
        );
        CryptoZoo.state.playTimeSeconds = Math.max(0, Number(CryptoZoo.state.playTimeSeconds) || 0);

        CryptoZoo.state.offlineMaxSeconds = Math.max(
            this.maxOfflineSeconds,
            Number(CryptoZoo.state.offlineMaxSeconds) || this.maxOfflineSeconds
        );

        CryptoZoo.state.offlineBoostMultiplier = Math.max(
            1,
            Number(CryptoZoo.state.offlineBoostMultiplier) || 1
        );

        CryptoZoo.state.offlineBoostActiveUntil = Number(CryptoZoo.state.offlineBoostActiveUntil) || 0;
        CryptoZoo.state.boost2xActiveUntil = this.normalizeBoostTimestamp(
            CryptoZoo.state.boost2xActiveUntil
        );

        this.normalizeBoostState();
        this.normalizeOfflineBoostState();
    },

    normalizeBoostTimestamp(value) {
        let safeValue = Number(value) || 0;

        if (safeValue <= 0) {
            return 0;
        }

        if (safeValue < 1000000000000) {
            safeValue *= 1000;
        }

        return safeValue;
    },

    normalizeBoostState() {
        CryptoZoo.state = CryptoZoo.state || {};
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
        return CryptoZoo.offline?.normalizeState?.();
    },

    isBoost2xActive() {
        return CryptoZoo.boostSystem?.isActive?.() || false;
    },

    getBoost2xMultiplier() {
        return CryptoZoo.boostSystem?.getMultiplier?.() || 1;
    },

    getBoost2xTimeLeft() {
        return CryptoZoo.boostSystem?.getTimeLeft?.() || 0;
    },

    activateBoost2x() {
        return CryptoZoo.boostSystem?.activate?.() || false;
    },

    bindBoostShopButton() {
        return CryptoZoo.boostSystem?.bindShopButton?.() || false;
    },

    isOfflineBoostActive() {
        return CryptoZoo.offline?.isActive?.() || false;
    },

    getOfflineBoostMultiplier() {
        return CryptoZoo.offline?.getMultiplier?.() || 1;
    },

    getOfflineBoostTimeLeft() {
        return CryptoZoo.offline?.getTimeLeft?.() || 0;
    },

    activateOfflineBoost(multiplier = 2, durationSeconds = 10 * 60) {
        return CryptoZoo.offline?.activate?.(multiplier, durationSeconds) || false;
    },

    getTapCountFromTouches(touchCount) {
        return CryptoZoo.tapSystem?.getTapCountFromTouches?.(touchCount) || 1;
    },

    handleTap(tapCount = 1) {
        return CryptoZoo.tapSystem?.handleTap?.(tapCount) || false;
    },

    bindTap() {
        return CryptoZoo.tapSystem?.bind?.() || false;
    },

    getBaseCoinsPerClick() {
        return Math.max(
            0,
            Number(CryptoZoo.state?.coinsPerClick) ||
            Number(CryptoZoo.config?.clickValue) ||
            1
        );
    },

    getEffectiveCoinsPerClick(tapCount = 1) {
        const touches = this.getTapCountFromTouches(tapCount);
        return this.getBaseCoinsPerClick() * this.getBoost2xMultiplier() * touches;
    },

    getBaseZooIncome() {
        this.recalculateZooIncome();
        return Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
    },

    getEffectiveZooIncome() {
        return this.getBaseZooIncome() * this.getBoost2xMultiplier();
    },

    getOfflineIncomePerSecond() {
        return CryptoZoo.offline?.getIncomePerSecond?.() || 0;
    },

    getOfflineMaxSeconds() {
        return CryptoZoo.offline?.getMaxSeconds?.() || this.maxOfflineSeconds;
    },

    formatOfflineDuration(totalSeconds) {
        return CryptoZoo.offline?.formatDuration?.(totalSeconds) || "0s";
    },

    applyOfflineEarnings() {
        return CryptoZoo.offline?.applyEarnings?.();
    },

    getDailyRewardCooldownMs() {
        return CryptoZoo.dailyReward?.getCooldownMs?.() || this.dailyRewardCooldownMs;
    },

    getDayKeyFromTimestamp(timestamp = Date.now()) {
        return CryptoZoo.dailyReward?.getDayKeyFromTimestamp?.(timestamp) || "";
    },

    getYesterdayDayKey() {
        return CryptoZoo.dailyReward?.getYesterdayDayKey?.() || "";
    },

    getDailyRewardStreak() {
        return CryptoZoo.dailyReward?.getStreak?.() || 0;
    },

    getDailyRewardTimeLeftMs() {
        return CryptoZoo.dailyReward?.getTimeLeftMs?.() || 0;
    },

    canClaimDailyReward() {
        return CryptoZoo.dailyReward?.canClaim?.() || false;
    },

    getDailyRewardCoinsAmount() {
        return CryptoZoo.dailyReward?.getCoinsAmount?.() || 0;
    },

    getDailyRewardGemsAmount() {
        return CryptoZoo.dailyReward?.getGemsAmount?.() || 0;
    },

    getDailyRewardBalanceAmount() {
        return CryptoZoo.dailyReward?.getRewardBalanceAmount?.() || 0;
    },

    updateDailyRewardStreak() {
        return CryptoZoo.dailyReward?.updateStreak?.() || 1;
    },

    claimDailyReward() {
        return CryptoZoo.dailyReward?.claim?.() || false;
    },

    bindDailyRewardButton() {
        const btn = document.getElementById("homeDailyBtn");
        if (!btn) return false;

        btn.onclick = () => {
            this.claimDailyReward();
        };

        return true;
    },

    getExpeditionRewardBalanceAmount(expedition) {
        return CryptoZoo.expeditions?.getRewardBalanceAmount?.(expedition) || 0;
    },

    getExpeditionUnlockRequirement(expeditionOrId) {
        return CryptoZoo.expeditions?.getUnlockRequirement?.(expeditionOrId) || 1;
    },

    isExpeditionUnlocked(expeditionOrId) {
        return CryptoZoo.expeditions?.isUnlocked?.(expeditionOrId) || false;
    },

    getExpeditionUnlockText(expeditionOrId) {
        return CryptoZoo.expeditions?.getUnlockText?.(expeditionOrId) || "Odblokuj poziom 1";
    },

    startExpedition(id) {
        return CryptoZoo.expeditions?.start?.(id) || false;
    },

    collectExpedition() {
        return CryptoZoo.expeditions?.collect?.() || false;
    },

    getRewardWalletBalance() {
        return CryptoZoo.rewardWallet?.getWalletBalance?.() || 0;
    },

    getWithdrawPendingBalance() {
        return CryptoZoo.rewardWallet?.getWithdrawPendingBalance?.() || 0;
    },

    getRewardBalanceAvailableToTransfer() {
        return CryptoZoo.rewardWallet?.getTransferableBalance?.() || 0;
    },

    transferRewardToWallet(amount) {
        return CryptoZoo.rewardWallet?.transferToWallet?.(amount) || false;
    },

    applyLevelDropBySpend(spentAmount, coinsBeforeSpend) {
        return CryptoZoo.progression?.applyLevelDropBySpend?.(spentAmount, coinsBeforeSpend);
    },

    recalculateZooIncome() {
        return CryptoZoo.progression?.recalculateZooIncome?.() || 0;
    },

    recalculateLevel() {
        return CryptoZoo.progression?.recalculateLevel?.() || 1;
    },

    recalculateProgress() {
        return CryptoZoo.progression?.recalculateProgress?.();
    },

    bindAnimalButtons() {
        return CryptoZoo.animalsSystem?.bindButtons?.();
    },

    buyAnimal(type) {
        return CryptoZoo.animalsSystem?.buy?.(type) || false;
    },

    getAnimalUpgradeCost(type) {
        return CryptoZoo.animalsSystem?.getUpgradeCost?.(type) || 0;
    },

    upgradeAnimal(type) {
        return CryptoZoo.animalsSystem?.upgrade?.(type) || false;
    },

    bindShopButtons() {
        return CryptoZoo.shopSystem?.bindButtons?.();
    },

    buyShopItem(itemId) {
        return CryptoZoo.shopSystem?.buy?.(itemId) || false;
    },

    bindNavigation() {
        return CryptoZoo.navigation?.bind?.() || false;
    },

    showScreen(screenName) {
        return CryptoZoo.navigation?.show?.(screenName) || false;
    },

    startIncomeTimer() {
        return CryptoZoo.incomeSystem?.start?.() || false;
    },

    startBoostTimer() {
        if (this.boostTimerStarted) return;
        this.boostTimerStarted = true;

        setInterval(() => {
            const previousBoostValue = Number(CryptoZoo.state?.boost2xActiveUntil) || 0;
            const previousOfflineValue = Number(CryptoZoo.state?.offlineBoostActiveUntil) || 0;

            this.normalizeBoostState();
            this.normalizeOfflineBoostState();

            const currentBoostValue = Number(CryptoZoo.state?.boost2xActiveUntil) || 0;
            const currentOfflineValue = Number(CryptoZoo.state?.offlineBoostActiveUntil) || 0;

            if (previousBoostValue > 0 && currentBoostValue === 0) {
                CryptoZoo.api?.savePlayer?.();
            }

            if (previousOfflineValue > 0 && currentOfflineValue === 0) {
                CryptoZoo.api?.savePlayer?.();
            }

            CryptoZoo.ui?.render?.();
        }, 1000);
    },

    startExpeditionTimer() {
        if (this.expeditionTimerStarted) return;
        this.expeditionTimerStarted = true;

        setInterval(() => {
            if (!CryptoZoo.state?.expedition) return;
            if (this.activeScreen !== "missions") return;

            CryptoZoo.ui?.renderExpeditions?.();
        }, 1000);
    },

    persistAndRender() {
        this.normalizeBoostState();
        this.normalizeOfflineBoostState();
        this.recalculateProgress();

        CryptoZoo.state.lastLogin = Date.now();

        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    },

    openBox(type) {
        CryptoZoo.boxes?.open?.(type);
    }
};