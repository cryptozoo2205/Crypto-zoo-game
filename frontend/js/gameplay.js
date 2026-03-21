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
        this.bindAnimalButtons();
        this.bindShopButtons();

        const lastScreen = sessionStorage.getItem("cryptozoo_last_screen") || "game";
        this.showScreen(lastScreen);

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
            playTimeSeconds: 0
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
        CryptoZoo.state.coinsPerClick = Math.max(1, Number(CryptoZoo.state.coinsPerClick) || 1);
        CryptoZoo.state.dailyRewardStreak = Math.min(
            this.dailyRewardMaxStreak,
            Math.max(0, Number(CryptoZoo.state.dailyRewardStreak) || 0)
        );
        CryptoZoo.state.playTimeSeconds = Math.max(
            0,
            Number(CryptoZoo.state.playTimeSeconds) || 0
        );
        CryptoZoo.state.offlineMaxSeconds = Math.max(
            this.maxOfflineSeconds,
            Number(CryptoZoo.state.offlineMaxSeconds) || this.maxOfflineSeconds
        );
        CryptoZoo.state.offlineBoostMultiplier = Math.max(
            1,
            Number(CryptoZoo.state.offlineBoostMultiplier) || 1
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
        let activeUntil = Number(CryptoZoo.state?.offlineBoostActiveUntil) || 0;

        if (activeUntil > 0 && activeUntil < 1000000000000) {
            activeUntil *= 1000;
        }

        CryptoZoo.state.offlineBoostActiveUntil = activeUntil;

        if (activeUntil > 0 && activeUntil <= Date.now()) {
            CryptoZoo.state.offlineBoostActiveUntil = 0;
            CryptoZoo.state.offlineBoostMultiplier = 1;
            CryptoZoo.state.offlineBoost = 1;
        } else {
            CryptoZoo.state.offlineBoostMultiplier = Math.max(
                1,
                Number(CryptoZoo.state?.offlineBoostMultiplier) || 1
            );
            CryptoZoo.state.offlineBoost = CryptoZoo.state.offlineBoostMultiplier;
        }
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
        this.normalizeOfflineBoostState();
        return (Number(CryptoZoo.state?.offlineBoostActiveUntil) || 0) > Date.now();
    },

    getOfflineBoostMultiplier() {
        this.normalizeOfflineBoostState();

        return this.isOfflineBoostActive()
            ? Math.max(1, Number(CryptoZoo.state?.offlineBoostMultiplier) || 1)
            : 1;
    },

    getOfflineBoostTimeLeft() {
        this.normalizeOfflineBoostState();

        return Math.max(
            0,
            Math.floor(
                ((Number(CryptoZoo.state?.offlineBoostActiveUntil) || 0) - Date.now()) / 1000
            )
        );
    },

    activateOfflineBoost(multiplier = 2, durationSeconds = 10 * 60) {
        if (CryptoZoo.offlineSystem?.activateBoost) {
            return CryptoZoo.offlineSystem.activateBoost(multiplier, durationSeconds);
        }

        const safeMultiplier = Math.max(1, Number(multiplier) || 1);
        const safeDurationSeconds = Math.max(60, Number(durationSeconds) || 600);

        CryptoZoo.state.offlineBoostMultiplier = safeMultiplier;
        CryptoZoo.state.offlineBoostActiveUntil = Date.now() + safeDurationSeconds * 1000;
        CryptoZoo.state.offlineBoost = safeMultiplier;

        return true;
    },

    getTapCountFromTouches(touchCount) {
        const safeCount = Number(touchCount) || 1;
        return Math.max(1, Math.min(3, safeCount));
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
        const baseIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        const offlineBoostMultiplier = this.getOfflineBoostMultiplier();

        return baseIncome * offlineBoostMultiplier;
    },

    getOfflineMaxSeconds() {
        return Math.max(
            this.maxOfflineSeconds,
            Number(CryptoZoo.state?.offlineMaxSeconds) || this.maxOfflineSeconds
        );
    },

    formatOfflineDuration(totalSeconds) {
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

    applyOfflineEarnings() {
        if (CryptoZoo.offlineSystem?.applyEarnings) {
            return CryptoZoo.offlineSystem.applyEarnings();
        }

        const now = Date.now();
        const lastLogin = Math.max(0, Number(CryptoZoo.state?.lastLogin) || now);
        const elapsedSeconds = Math.max(0, Math.floor((now - lastLogin) / 1000));
        const maxOfflineSeconds = this.getOfflineMaxSeconds();
        const cappedSeconds = Math.min(elapsedSeconds, maxOfflineSeconds);
        const wasCapped = elapsedSeconds > maxOfflineSeconds;

        if (cappedSeconds <= 0) {
            CryptoZoo.state.lastLogin = now;
            return;
        }

        this.recalculateZooIncome();

        const offlineIncomePerSecond = this.getOfflineIncomePerSecond();
        const offlineCoins = Math.floor(offlineIncomePerSecond * cappedSeconds);

        CryptoZoo.state.lastLogin = now;

        if (offlineCoins <= 0) {
            return;
        }

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + offlineCoins;
        CryptoZoo.state.xp =
            (Number(CryptoZoo.state.xp) || 0) + Math.max(1, Math.floor(cappedSeconds / 60));

        this.recalculateLevel();

        const timeLabel = this.formatOfflineDuration(cappedSeconds);
        const capLabel = wasCapped
            ? ` • limit ${this.formatOfflineDuration(maxOfflineSeconds)}`
            : "";
        const offlineMultiplier = this.getOfflineBoostMultiplier();
        const boostLabel = offlineMultiplier > 1
            ? ` • x${CryptoZoo.formatNumber(offlineMultiplier)} offline`
            : "";

        CryptoZoo.ui?.showToast?.(
            `Offline: ${timeLabel} • +${CryptoZoo.formatNumber(offlineCoins)} coins${capLabel}${boostLabel}`
        );

        CryptoZoo.api?.savePlayer?.();
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
        return CryptoZoo.expeditions?.getUnlockText?.(expeditionOrId) || "";
    },

    startExpedition(id) {
        return CryptoZoo.expeditions?.start?.(id) || false;
    },

    collectExpedition() {
        return CryptoZoo.expeditions?.collect?.() || false;
    },

    getRewardWalletBalance() {
        return Math.max(0, Number(CryptoZoo.state?.rewardWallet) || 0);
    },

    getWithdrawPendingBalance() {
        return Math.max(0, Number(CryptoZoo.state?.withdrawPending) || 0);
    },

    getRewardBalanceAvailableToTransfer() {
        return Math.max(0, Number(CryptoZoo.state?.rewardBalance) || 0);
    },

    transferRewardToWallet(amount) {
        const available = this.getRewardBalanceAvailableToTransfer();

        let transferAmount = Number(amount);

        if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
            transferAmount = available;
        }

        transferAmount = Math.floor(transferAmount);

        if (transferAmount <= 0 || available <= 0) {
            CryptoZoo.ui?.showToast?.("Brak reward do transferu");
            return false;
        }

        if (transferAmount > available) {
            transferAmount = available;
        }

        CryptoZoo.state.rewardBalance =
            Math.max(0, Number(CryptoZoo.state.rewardBalance) || 0) - transferAmount;
        CryptoZoo.state.rewardWallet =
            (Number(CryptoZoo.state.rewardWallet) || 0) + transferAmount;

        this.persistAndRender();
        CryptoZoo.ui?.showToast?.(
            `Przeniesiono ${CryptoZoo.formatNumber(transferAmount)} reward do wallet`
        );

        return true;
    },

    bindAnimalButtons() {
        return CryptoZoo.animalsSystem?.bindButtons?.() || false;
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
        const items = CryptoZoo.config?.shopItems || [];

        items.forEach((item) => {
            const btn = document.getElementById(`buy-shop-${item.id}`);
            if (btn) {
                btn.onclick = () => this.buyShopItem(item.id);
            }
        });

        return true;
    },

    buyShopItem(itemId) {
        const item = (CryptoZoo.config?.shopItems || []).find((x) => x.id === itemId);
        if (!item) return false;

        const coinPrice = Math.max(0, Number(item.price) || 0);
        const gemPrice = Math.max(0, Number(item.gemPrice) || 0);

        const coinsBeforeSpend = Number(CryptoZoo.state.coins) || 0;
        const gemsBeforeSpend = Number(CryptoZoo.state.gems) || 0;

        const isGemPurchase = gemPrice > 0;
        const spendAmountForLevelDrop = isGemPurchase ? 0 : coinPrice;

        if (isGemPurchase) {
            if (gemsBeforeSpend < gemPrice) {
                CryptoZoo.ui?.showToast?.("Za mało gems");
                return false;
            }

            CryptoZoo.state.gems = gemsBeforeSpend - gemPrice;
        } else {
            if (coinsBeforeSpend < coinPrice) {
                CryptoZoo.ui?.showToast?.("Za mało coins");
                return false;
            }

            CryptoZoo.state.coins = coinsBeforeSpend - coinPrice;
        }

        if (item.type === "click") {
            const bonus = Math.max(1, Number(item.clickValueBonus) || 1);
            CryptoZoo.state.coinsPerClick =
                (Number(CryptoZoo.state.coinsPerClick) || 1) + bonus;
        }

        if (item.type === "income") {
            const currentIncome = Number(CryptoZoo.state.zooIncome) || 0;
            CryptoZoo.state.zooIncome = Math.max(1, Math.floor(currentIncome * 1.25));
        }

        if (item.type === "expedition") {
            CryptoZoo.state.expeditionBoost =
                (Number(CryptoZoo.state.expeditionBoost) || 0) + 0.2;
        }

        if (item.type === "offline") {
            const multiplier = Math.max(1, Number(item.offlineMultiplier) || 2);
            const durationSeconds = Math.max(
                60,
                Number(item.offlineDurationSeconds) || 10 * 60
            );
            this.activateOfflineBoost(multiplier, durationSeconds);
        }

        this.applyLevelDropBySpend(spendAmountForLevelDrop, coinsBeforeSpend);
        this.persistAndRender();

        if (item.type === "offline") {
            const multiplier = Math.max(1, Number(item.offlineMultiplier) || 2);
            const durationSeconds = Math.max(
                60,
                Number(item.offlineDurationSeconds) || 10 * 60
            );

            if (isGemPurchase) {
                CryptoZoo.ui?.showToast?.(
                    `Kupiono ${item.name} • ${CryptoZoo.formatNumber(gemPrice)} gem • x${CryptoZoo.formatNumber(multiplier)} offline ${this.formatOfflineDuration(durationSeconds)}`
                );
            } else {
                CryptoZoo.ui?.showToast?.(
                    `Kupiono ${item.name} • x${CryptoZoo.formatNumber(multiplier)} offline ${this.formatOfflineDuration(durationSeconds)}`
                );
            }

            return true;
        }

        if (isGemPurchase) {
            CryptoZoo.ui?.showToast?.(
                `Kupiono ${item.name} za ${CryptoZoo.formatNumber(gemPrice)} gem`
            );
            return true;
        }

        CryptoZoo.ui?.showToast?.(`Kupiono ${item.name}`);
        return true;
    },

    applyLevelDropBySpend(spentAmount, coinsBeforeSpend) {
        const spent = Number(spentAmount) || 0;
        const before = Number(coinsBeforeSpend) || 0;

        if (spent <= 0 || before <= 0) return;

        const spendRatio = spent / before;
        let levelLoss = 0;

        if (spendRatio > 0.60) {
            levelLoss = 3;
        } else if (spendRatio > 0.30) {
            levelLoss = 2;
        } else if (spendRatio > 0.10) {
            levelLoss = 1;
        }

        if (levelLoss > 0) {
            CryptoZoo.state.level = Math.max(
                1,
                (Number(CryptoZoo.state.level) || 1) - levelLoss
            );
        }

        CryptoZoo.state.xp = Math.floor((Number(CryptoZoo.state.xp) || 0) * 0.7);
    },

    recalculateZooIncome() {
        const animals = CryptoZoo.config?.animals || {};
        const stateAnimals = CryptoZoo.state?.animals || {};

        let total = 0;

        Object.keys(animals).forEach((type) => {
            const config = animals[type];
            const animal = stateAnimals[type] || { count: 0, level: 1 };

            total +=
                (Number(animal.count) || 0) *
                (Number(animal.level) || 1) *
                (Number(config.baseIncome) || 0);
        });

        CryptoZoo.state.zooIncome = total;
        return total;
    },

    recalculateLevel() {
        const xp = Number(CryptoZoo.state.xp) || 0;

        let level = 1;
        let requiredXp = 100;
        let spentXp = 0;

        while (xp >= spentXp + requiredXp) {
            spentXp += requiredXp;
            level += 1;
            requiredXp += 100;
        }

        CryptoZoo.state.level = Math.max(Number(CryptoZoo.state.level) || 1, level);
        return CryptoZoo.state.level;
    },

    recalculateProgress() {
        this.recalculateZooIncome();
        this.recalculateLevel();
        this.normalizeBoostState();
        this.normalizeOfflineBoostState();
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