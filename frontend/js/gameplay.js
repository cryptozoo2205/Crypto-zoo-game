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

    // ================= STATE =================
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
            dailyRewardClaimDayKey: ""
        };

        Object.keys(defaults).forEach((key) => {
            if (typeof CryptoZoo.state[key] !== "number" && typeof defaults[key] === "number") {
                CryptoZoo.state[key] = Number(CryptoZoo.state[key]) || defaults[key];
            }
            if (typeof CryptoZoo.state[key] !== "string" && typeof defaults[key] === "string") {
                CryptoZoo.state[key] = String(CryptoZoo.state[key] || defaults[key]);
            }
        });

        CryptoZoo.state.coinsPerClick = Math.max(1, CryptoZoo.state.coinsPerClick);
        CryptoZoo.state.dailyRewardStreak = Math.min(this.dailyRewardMaxStreak, Math.max(0, CryptoZoo.state.dailyRewardStreak));

        this.normalizeBoostState();
        this.normalizeOfflineBoostState();
    },

    normalizeBoostTimestamp(value) {
        let v = Number(value) || 0;
        if (v <= 0) return 0;
        if (v < 1000000000000) v *= 1000;
        return v;
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

    // ================= BOOST =================
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

    // ================= TAP =================
    handleTap(tapCount = 1) {
        return CryptoZoo.tapSystem?.handleTap?.(tapCount) || false;
    },

    bindTap() {
        return CryptoZoo.tapSystem?.bind?.() || false;
    },

    getTapCountFromTouches(touchCount) {
        return CryptoZoo.tapSystem?.getTapCountFromTouches?.(touchCount) || 1;
    },

    // ================= INCOME =================
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

    // ================= OFFLINE =================
    getOfflineIncomePerSecond() {
        return CryptoZoo.offline?.getIncomePerSecond?.() || 0;
    },

    getOfflineMaxSeconds() {
        return CryptoZoo.offline?.getMaxSeconds?.() || this.maxOfflineSeconds;
    },

    formatOfflineDuration(seconds) {
        return CryptoZoo.offline?.formatDuration?.(seconds) || "0s";
    },

    applyOfflineEarnings() {
        return CryptoZoo.offline?.applyEarnings?.();
    },

    // ================= DAILY =================
    getDailyRewardCooldownMs() {
        return CryptoZoo.dailyReward?.getCooldownMs?.() || this.dailyRewardCooldownMs;
    },

    canClaimDailyReward() {
        return CryptoZoo.dailyReward?.canClaim?.() || false;
    },

    claimDailyReward() {
        return CryptoZoo.dailyReward?.claim?.() || false;
    },

    bindDailyRewardButton() {
        const btn = document.getElementById("homeDailyBtn");
        if (!btn) return;

        btn.onclick = () => {
            this.claimDailyReward();
        };
    },

    // ================= PROGRESSION =================
    recalculateZooIncome() {
        return CryptoZoo.progression?.recalculateZooIncome?.() || 0;
    },

    recalculateLevel() {
        return CryptoZoo.progression?.recalculateLevel?.() || 1;
    },

    recalculateProgress() {
        return CryptoZoo.progression?.recalculateProgress?.();
    },

    applyLevelDropBySpend(spent, before) {
        return CryptoZoo.progression?.applyLevelDropBySpend?.(spent, before);
    },

    // ================= ANIMALS =================
    bindAnimalButtons() {
        return CryptoZoo.animalsSystem?.bindButtons?.();
    },

    buyAnimal(type) {
        return CryptoZoo.animalsSystem?.buy?.(type) || false;
    },

    upgradeAnimal(type) {
        return CryptoZoo.animalsSystem?.upgrade?.(type) || false;
    },

    getAnimalUpgradeCost(type) {
        return CryptoZoo.animalsSystem?.getUpgradeCost?.(type) || 0;
    },

    // ================= SHOP =================
    bindShopButtons() {
        return CryptoZoo.shopSystem?.bindButtons?.();
    },

    buyShopItem(id) {
        return CryptoZoo.shopSystem?.buy?.(id) || false;
    },

    // ================= NAV =================
    bindNavigation() {
        return CryptoZoo.navigation?.bind?.() || false;
    },

    showScreen(screen) {
        return CryptoZoo.navigation?.show?.(screen) || false;
    },

    // ================= TIMERS =================
    startIncomeTimer() {
        if (this.incomeTimerStarted) return;
        this.incomeTimerStarted = true;

        setInterval(() => {
            this.recalculateProgress();

            const income = this.getEffectiveZooIncome();
            if (income <= 0) return;

            CryptoZoo.state.coins += income;
            CryptoZoo.state.xp += 1;
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
            this.normalizeBoostState();
            this.normalizeOfflineBoostState();
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

    // ================= EXPEDITIONS =================
    startExpedition(id) {
        return CryptoZoo.expeditions?.start?.(id) || false;
    },

    collectExpedition() {
        return CryptoZoo.expeditions?.collect?.() || false;
    },

    // ================= SAVE =================
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