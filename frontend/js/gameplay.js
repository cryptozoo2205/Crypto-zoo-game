window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.gameplay = {
    activeScreen: "game",
    expeditionTimerStarted: false,
    incomeTimerStarted: false,
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

        if (typeof CryptoZoo.state.coins !== "number") {
            CryptoZoo.state.coins = Number(CryptoZoo.state.coins) || 0;
        }

        if (typeof CryptoZoo.state.gems !== "number") {
            CryptoZoo.state.gems = Number(CryptoZoo.state.gems) || 0;
        }

        if (typeof CryptoZoo.state.rewardBalance !== "number") {
            CryptoZoo.state.rewardBalance = Number(CryptoZoo.state.rewardBalance) || 0;
        }

        if (typeof CryptoZoo.state.rewardWallet !== "number") {
            CryptoZoo.state.rewardWallet = Number(CryptoZoo.state.rewardWallet) || 0;
        }

        if (typeof CryptoZoo.state.withdrawPending !== "number") {
            CryptoZoo.state.withdrawPending = Number(CryptoZoo.state.withdrawPending) || 0;
        }

        if (typeof CryptoZoo.state.level !== "number") {
            CryptoZoo.state.level = Number(CryptoZoo.state.level) || 1;
        }

        if (typeof CryptoZoo.state.coinsPerClick !== "number") {
            CryptoZoo.state.coinsPerClick = Math.max(1, Number(CryptoZoo.state.coinsPerClick) || 1);
        }

        if (typeof CryptoZoo.state.zooIncome !== "number") {
            CryptoZoo.state.zooIncome = Number(CryptoZoo.state.zooIncome) || 0;
        }

        if (typeof CryptoZoo.state.expeditionBoost !== "number") {
            CryptoZoo.state.expeditionBoost = Number(CryptoZoo.state.expeditionBoost) || 0;
        }

        if (typeof CryptoZoo.state.offlineMaxSeconds !== "number") {
            CryptoZoo.state.offlineMaxSeconds = this.maxOfflineSeconds;
        }

        if (typeof CryptoZoo.state.offlineBoostMultiplier !== "number") {
            CryptoZoo.state.offlineBoostMultiplier = 1;
        }

        if (typeof CryptoZoo.state.offlineBoostActiveUntil !== "number") {
            CryptoZoo.state.offlineBoostActiveUntil = 0;
        }

        if (typeof CryptoZoo.state.offlineBoost !== "number") {
            CryptoZoo.state.offlineBoost = 1;
        }

        if (typeof CryptoZoo.state.xp !== "number") {
            CryptoZoo.state.xp = Number(CryptoZoo.state.xp) || 0;
        }

        if (typeof CryptoZoo.state.boost2xActiveUntil !== "number") {
            CryptoZoo.state.boost2xActiveUntil = Number(CryptoZoo.state.boost2xActiveUntil) || 0;
        }

        if (typeof CryptoZoo.state.lastLogin !== "number") {
            CryptoZoo.state.lastLogin = Number(CryptoZoo.state.lastLogin) || Date.now();
        }

        if (typeof CryptoZoo.state.lastDailyRewardAt !== "number") {
            CryptoZoo.state.lastDailyRewardAt = Number(CryptoZoo.state.lastDailyRewardAt) || 0;
        }

        if (typeof CryptoZoo.state.dailyRewardStreak !== "number") {
            CryptoZoo.state.dailyRewardStreak = Math.max(0, Number(CryptoZoo.state.dailyRewardStreak) || 0);
        }

        if (typeof CryptoZoo.state.dailyRewardClaimDayKey !== "string") {
            CryptoZoo.state.dailyRewardClaimDayKey = String(CryptoZoo.state.dailyRewardClaimDayKey || "");
        }

        CryptoZoo.state.dailyRewardStreak = Math.min(
            this.dailyRewardMaxStreak,
            Math.max(0, Number(CryptoZoo.state.dailyRewardStreak) || 0)
        );

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
        return CryptoZoo.offline?.normalizeState?.();
    },

    isBoost2xActive() {
        this.normalizeBoostState();
        return (Number(CryptoZoo.state?.boost2xActiveUntil) || 0) > Date.now();
    },

    getBoost2xMultiplier() {
        return this.isBoost2xActive() ? 2 : 1;
    },

    getBoost2xTimeLeft() {
        this.normalizeBoostState();

        return Math.max(
            0,
            Math.floor(
                ((Number(CryptoZoo.state?.boost2xActiveUntil) || 0) - Date.now()) / 1000
            )
        );
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
        const base = this.getBaseCoinsPerClick() * this.getBoost2xMultiplier();

        return base * touches;
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

    getExpeditionRewardBalanceAmount(expedition) {
        return CryptoZoo.expeditions?.getRewardBalanceAmount?.(expedition) || 0;
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

    getExpeditionUnlockRequirement(expeditionOrId) {
        return CryptoZoo.expeditions?.getUnlockRequirement?.(expeditionOrId) || 1;
    },

    isExpeditionUnlocked(expeditionOrId) {
        return CryptoZoo.expeditions?.isUnlocked?.(expeditionOrId) || false;
    },

    getExpeditionUnlockText(expeditionOrId) {
        return CryptoZoo.expeditions?.getUnlockText?.(expeditionOrId) || "Odblokuj poziom 1";
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

    bindDailyRewardButton() {
        const btn = document.getElementById("homeDailyBtn");
        if (!btn) return;

        btn.onclick = () => {
            this.claimDailyReward();
        };
    },

    persistAndRender() {
        this.normalizeBoostState();
        this.normalizeOfflineBoostState();
        this.recalculateProgress();
        CryptoZoo.state.lastLogin = Date.now();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    },

    activateBoost2x() {
        const boostCostGems = 1;
        const boostDurationMs = 10 * 60 * 1000;

        if (this.isBoost2xActive()) {
            CryptoZoo.ui?.showToast?.(
                `Boost już aktywny: ${CryptoZoo.ui?.formatTimeLeft?.(this.getBoost2xTimeLeft()) || "00:00:00"}`
            );
            CryptoZoo.ui?.render?.();
            return true;
        }

        if ((Number(CryptoZoo.state.gems) || 0) < boostCostGems) {
            CryptoZoo.ui?.showToast?.("Za mało gems");
            return false;
        }

        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) - boostCostGems;
        CryptoZoo.state.boost2xActiveUntil = Date.now() + boostDurationMs;

        this.persistAndRender();
        CryptoZoo.ui?.showToast?.("X2 Boost aktywowany");

        return true;
    },

    bindBoostShopButton() {
        const btn = document.getElementById("buyBoostBtn");
        if (!btn) return;

        btn.onclick = () => {
            const activated = this.activateBoost2x();

            if (activated) {
                this.showScreen("game");
            }
        };
    },

    bindNavigation() {
        const navButtons = document.querySelectorAll("[data-nav]");

        navButtons.forEach((button) => {
            button.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();

                const screenName = button.getAttribute("data-nav");
                this.showScreen(screenName);
            };
        });
    },

    showScreen(screenName) {
        const screens = document.querySelectorAll('main section[id^="screen-"]');
        const navButtons = document.querySelectorAll("[data-nav]");

        screens.forEach((screen) => {
            screen.classList.add("hidden");
            screen.classList.remove("active-screen");
        });

        navButtons.forEach((button) => {
            button.classList.remove("active-nav");
        });

        const targetScreen = document.getElementById(`screen-${screenName}`);
        if (targetScreen) {
            targetScreen.classList.remove("hidden");
            targetScreen.classList.add("active-screen");
        }

        const activeButton = document.querySelector(`[data-nav="${screenName}"]`);
        if (activeButton) {
            activeButton.classList.add("active-nav");
        }

        this.activeScreen = screenName;
        sessionStorage.setItem("cryptozoo_last_screen", screenName);

        if (screenName === "ranking") {
            CryptoZoo.uiRanking?.renderRanking?.();
        }

        if (screenName === "missions") {
            CryptoZoo.ui?.renderExpeditions?.();
        }

        if (screenName === "shop") {
            this.bindBoostShopButton();
        }

        CryptoZoo.ui?.render?.();
    },

    handleTap(tapCount = 1) {
        const safeTapCount = this.getTapCountFromTouches(tapCount);
        const clickValue = this.getEffectiveCoinsPerClick(safeTapCount);

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + clickValue;
        CryptoZoo.state.xp = (Number(CryptoZoo.state.xp) || 0) + safeTapCount;

        this.recalculateLevel();

        CryptoZoo.ui?.animateCoin?.(safeTapCount);
        CryptoZoo.state.lastLogin = Date.now();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    },

    bindTap() {
        const tapButton = document.getElementById("tapButton");
        if (!tapButton) return;

        tapButton.onclick = (event) => {
            if (event) {
                event.preventDefault();
            }

            if (Date.now() < this.suppressClickUntil) {
                return;
            }

            this.handleTap(1);
        };

        tapButton.addEventListener(
            "touchstart",
            (event) => {
                if (this.touchTapLock) {
                    event.preventDefault();
                    return;
                }

                const touches = this.getTapCountFromTouches(event.touches?.length || 1);

                this.touchTapLock = true;
                this.suppressClickUntil = Date.now() + 700;
                event.preventDefault();
                this.handleTap(touches);
            },
            { passive: false }
        );

        const unlockTouchTap = () => {
            this.touchTapLock = false;
        };

        tapButton.addEventListener("touchend", unlockTouchTap, { passive: true });
        tapButton.addEventListener("touchcancel", unlockTouchTap, { passive: true });
    },

    startIncomeTimer() {
        if (this.incomeTimerStarted) return;
        this.incomeTimerStarted = true;

        setInterval(() => {
            this.recalculateProgress();

            const baseIncome = Number(CryptoZoo.state?.zooIncome) || 0;
            if (baseIncome <= 0) {
                CryptoZoo.state.lastLogin = Date.now();
                CryptoZoo.ui?.renderHome?.();
                return;
            }

            const income = baseIncome * this.getBoost2xMultiplier();

            CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + income;
            CryptoZoo.state.xp = (Number(CryptoZoo.state.xp) || 0) + 1;
            CryptoZoo.state.lastLogin = Date.now();

            this.recalculateLevel();

            CryptoZoo.ui?.render?.();
            CryptoZoo.api?.savePlayer?.();
        }, 1000);
    },

    startBoostTimer() {
        if (this.boostTimerStarted) return;
        this.boostTimerStarted = true;

        setInterval(() => {
            const previousBoostValue = Number(CryptoZoo.state?.boost2xActiveUntil) || 0;
            const previousOfflineValue = Number(CryptoZoo.state?.offlineBoostActiveUntil) || 0;

            this.normalizeBoostState();
            this.normalizeOfflineBoostState();
            CryptoZoo.state.lastLogin = Date.now();

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

    startExpedition(id) {
        return CryptoZoo.expeditions?.start?.(id) || false;
    },

    collectExpedition() {
        return CryptoZoo.expeditions?.collect?.() || false;
    },

    startExpeditionTimer() {
        if (this.expeditionTimerStarted) return;
        this.expeditionTimerStarted = true;

        setInterval(() => {
            if (!CryptoZoo.state?.expedition) return;
            if (this.activeScreen !== "missions") return;

            CryptoZoo.state.lastLogin = Date.now();
            CryptoZoo.ui?.renderExpeditions?.();
        }, 1000);
    },

    openBox(type) {
        CryptoZoo.boxes?.open?.(type);
    }
};