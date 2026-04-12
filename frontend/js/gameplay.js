window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.gameplay = {
    activeScreen: "game",
    expeditionTimerStarted: false,
    boostTimerStarted: false,
    suppressClickUntil: 0,
    touchBurstActive: false,
    touchReleaseTimer: null,

    maxOfflineSeconds: 15 * 60,
    baseOfflineHours: 0.25,
    maxOfflineHoursWithoutAds: 4,
    maxOfflineBoostHoursFromShop: 0,
    maxOfflineAdsHours: 6,

    dailyRewardCooldownMs: 24 * 60 * 60 * 1000,
    dailyRewardMaxStreak: 7,
    tapTouchIds: null,
    tapAreaPadding: 28,

    tapSaveTimer: null,
    tapSaveDelayMs: 1200,
    tapSaveInFlight: false,
    tapSaveQueued: false,

    renderTimer: null,
    renderDelayMs: 120,
    renderQueued: false,
    lastRenderAt: 0,
    minRenderGapMs: 120,

    enableTapEffects: true,

    tapAntiCheatEnabled: true,
    maxAcceptedTapsPerSecond: 18,
    maxAcceptedTapBurst: 3,
    minHumanTapIntervalMs: 22,
    suspiciousTapStrikeLimit: 6,
    suspiciousTapStrikeWindowMs: 2500,
    temporaryTapBlockMs: 1500,
    antiCheatToastCooldownMs: 2500,
    tapEventHistory: [],
    tapStrikeTimestamps: [],
    lastAcceptedTapAt: 0,
    tapBlockUntil: 0,
    antiCheatToastAt: 0,

    init() {
        this.ensureState();
        this.resetTapAntiCheat();
        this.recalculateProgress();
        this.applyOfflineEarnings();

        this.bindNavigation();
        this.bindTap();
        this.bindBoostShopButton();
        this.bindDailyRewardButton();
        this.bindAnimalButtons();
        this.bindShopButtons();

        const lastScreen = sessionStorage.getItem("cryptozoo_last_screen") || "game";
        this.showScreen(lastScreen, true);
        this.requestRender(true);

        this.startIncomeTimer();
        this.startExpeditionTimer();
        this.startBoostTimer();

        CryptoZoo.dailyReward?.startTimer?.();
    },

    // ======================
    // 🔥 XP NERF
    // ======================
    getTapXpGain(amount = 1) {
        const safeAmount = Math.max(1, Math.floor(Number(amount) || 1));
        return safeAmount * 0.08; // było 1 → teraz 0.08
    },

    handleTap(amount = 1) {
        const safeAmount = Math.max(1, Math.floor(Number(amount) || 1));
        const valuePerTap = this.getEffectiveCoinsPerClick();
        const totalCoins = valuePerTap * safeAmount;
        const totalXp = this.getTapXpGain(safeAmount);

        CryptoZoo.state.coins += totalCoins;
        CryptoZoo.state.xp += totalXp;
        CryptoZoo.state.lastLogin = Date.now();

        this.recalculateLevel();

        CryptoZoo.dailyMissions?.recordTap?.(safeAmount);

        CryptoZoo.audio?.play?.("tap");

        if (this.enableTapEffects) {
            CryptoZoo.ui?.animateCoin?.(safeAmount);
        }

        this.requestRender();
        this.scheduleTapSave();
    },

    // ======================
    // 🔥 INCOME NERF
    // ======================
    getAnimalIncomeMultiplier(level = 1) {
        const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
        return 1 + ((safeLevel - 1) * 0.025); // było 0.12
    },

    recalculateZooIncome() {
        const animals = CryptoZoo.config?.animals || {};
        const maxOwnedPerAnimal = Math.max(
            1,
            Number(CryptoZoo.config?.limits?.maxOwnedPerAnimal) || 20
        );
        const maxLevelPerAnimal = Math.max(
            1,
            Number(CryptoZoo.config?.limits?.maxLevelPerAnimal) || 25
        );

        let total = 0;

        Object.keys(animals).forEach((type) => {
            const a = CryptoZoo.state.animals[type] || { count: 0, level: 1 };

            const count = Math.min(maxOwnedPerAnimal, a.count);
            const level = Math.min(maxLevelPerAnimal, a.level);
            const base = animals[type]?.baseIncome || 0;

            total += count * base * this.getAnimalIncomeMultiplier(level);
        });

        // 🔥 soft cap żeby nie wyjebało
        if (total > 1e9) total *= 0.5;

        CryptoZoo.state.zooIncome = Math.floor(total);
        return CryptoZoo.state.zooIncome;
    },

    // ======================
    // 🔥 LEVEL WALL
    // ======================
    getLevelRequirement(level) {
        const l = Math.max(1, Math.floor(Number(level) || 1));
        return Math.floor(900 * Math.pow(l, 2.05));
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
    },

    scheduleTapSave() {
        clearTimeout(this.tapSaveTimer);
        this.tapSaveTimer = setTimeout(() => {
            CryptoZoo.api?.savePlayer?.();
        }, this.tapSaveDelayMs);
    },

    requestRender(force = false) {
        const now = Date.now();

        if (force) {
            CryptoZoo.ui?.render?.();
            return;
        }

        clearTimeout(this.renderTimer);

        this.renderTimer = setTimeout(() => {
            CryptoZoo.ui?.render?.();
        }, this.renderDelayMs);
    }
};