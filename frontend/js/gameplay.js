window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.gameplay = {
    activeScreen: "game",
    expeditionTimerStarted: false,
    incomeTimerStarted: false,
    boostTimerStarted: false,
    suppressClickUntil: 0,
    touchTapLock: false,

    init() {
        this.ensureState();
        this.recalculateProgress();
        this.bindNavigation();
        this.bindTap();
        this.bindBoostShopButton();

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

        if (typeof CryptoZoo.state.coins !== "number") CryptoZoo.state.coins = Number(CryptoZoo.state.coins) || 0;
        if (typeof CryptoZoo.state.gems !== "number") CryptoZoo.state.gems = Number(CryptoZoo.state.gems) || 0;
        if (typeof CryptoZoo.state.rewardBalance !== "number") CryptoZoo.state.rewardBalance = Number(CryptoZoo.state.rewardBalance) || 0;
        if (typeof CryptoZoo.state.level !== "number") CryptoZoo.state.level = Number(CryptoZoo.state.level) || 1;
        if (typeof CryptoZoo.state.coinsPerClick !== "number") CryptoZoo.state.coinsPerClick = Math.max(1, Number(CryptoZoo.state.coinsPerClick) || 1);
        if (typeof CryptoZoo.state.zooIncome !== "number") CryptoZoo.state.zooIncome = Number(CryptoZoo.state.zooIncome) || 0;
        if (typeof CryptoZoo.state.expeditionBoost !== "number") CryptoZoo.state.expeditionBoost = Number(CryptoZoo.state.expeditionBoost) || 0;
        if (typeof CryptoZoo.state.offlineBoost !== "number") CryptoZoo.state.offlineBoost = Number(CryptoZoo.state.offlineBoost) || 1;
        if (typeof CryptoZoo.state.xp !== "number") CryptoZoo.state.xp = Number(CryptoZoo.state.xp) || 0;
        if (typeof CryptoZoo.state.boost2xActiveUntil !== "number") {
            CryptoZoo.state.boost2xActiveUntil = Number(CryptoZoo.state.boost2xActiveUntil) || 0;
        }

        CryptoZoo.state.boost2xActiveUntil = this.normalizeBoostTimestamp(CryptoZoo.state.boost2xActiveUntil);
    },

    normalizeBoostTimestamp(value) {
        let safeValue = Number(value) || 0;
        if (safeValue <= 0) return 0;
        if (safeValue < 1000000000000) safeValue *= 1000;
        return safeValue;
    },

    normalizeBoostState() {
        CryptoZoo.state.boost2xActiveUntil = this.normalizeBoostTimestamp(CryptoZoo.state?.boost2xActiveUntil);

        if (CryptoZoo.state.boost2xActiveUntil > 0 && CryptoZoo.state.boost2xActiveUntil <= Date.now()) {
            CryptoZoo.state.boost2xActiveUntil = 0;
        }
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
        return Math.max(0, Math.floor(((Number(CryptoZoo.state?.boost2xActiveUntil) || 0) - Date.now()) / 1000));
    },

    getTapCountFromTouches(touchCount) {
        const safeCount = Number(touchCount) || 1;
        return Math.max(1, Math.min(3, safeCount));
    },

    getBaseCoinsPerClick() {
        return Math.max(
            Number(CryptoZoo.state?.coinsPerClick) ||
            Number(CryptoZoo.config?.clickValue) ||
            1
        );
    },

    // ✅ FIX CLICK (TYLKO TO ZMIENIONE)
    getEffectiveCoinsPerClick(tapCount = 1) {
        const touches = this.getTapCountFromTouches(tapCount);
        const base = this.getBaseCoinsPerClick() * this.getBoost2xMultiplier();

        return Math.min(base * touches, base * 2);
    },

    getEffectiveZooIncome() {
        return (Number(CryptoZoo.state?.zooIncome) || 0) * this.getBoost2xMultiplier();
    },

    handleTap(tapCount = 1) {
        const safeTapCount = this.getTapCountFromTouches(tapCount);
        const value = this.getEffectiveCoinsPerClick(safeTapCount);

        CryptoZoo.state.coins += value;
        CryptoZoo.state.xp += safeTapCount;

        this.recalculateLevel();

        CryptoZoo.ui?.animateCoin?.();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    },

    bindTap() {
        const tapButton = document.getElementById("tapButton");
        if (!tapButton) return;

        tapButton.onclick = () => this.handleTap(1);

        tapButton.addEventListener("touchstart", (e) => {
            e.preventDefault();
            this.handleTap(e.touches.length);
        }, { passive: false });
    },

    bindAnimalButtons() {
        const animals = CryptoZoo.config?.animals || {};

        Object.keys(animals).forEach((type) => {
            document.getElementById(`buy-${type}-btn`)?.addEventListener("click", () => this.buyAnimal(type));
            document.getElementById(`upgrade-${type}-btn`)?.addEventListener("click", () => this.upgradeAnimal(type));
        });
    },

    buyAnimal(type) {
        const config = CryptoZoo.config.animals[type];
        const cost = config.buyCost;

        if (CryptoZoo.state.coins < cost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        CryptoZoo.state.coins -= cost;
        CryptoZoo.state.animals[type].count++;

        this.recalculateZooIncome();

        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    },

    upgradeAnimal(type) {
        const animal = CryptoZoo.state.animals[type];
        const cost = Math.floor(CryptoZoo.config.animals[type].buyCost * animal.level * 0.7);

        if (CryptoZoo.state.coins < cost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        CryptoZoo.state.coins -= cost;
        animal.level++;

        this.recalculateZooIncome();

        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    },

    recalculateZooIncome() {
        const animals = CryptoZoo.config.animals;
        let total = 0;

        Object.keys(animals).forEach((type) => {
            const a = CryptoZoo.state.animals[type];
            total += a.count * a.level * animals[type].baseIncome;
        });

        CryptoZoo.state.zooIncome = total;
    },

    recalculateLevel() {
        let xp = CryptoZoo.state.xp;
        let level = 1;
        let req = 100;
        let spent = 0;

        while (xp >= spent + req) {
            spent += req;
            level++;
            req += 100;
        }

        CryptoZoo.state.level = level;
    },

    startIncomeTimer() {
        if (this.incomeTimerStarted) return;
        this.incomeTimerStarted = true;

        setInterval(() => {
            CryptoZoo.state.coins += this.getEffectiveZooIncome();
            CryptoZoo.ui?.render?.();
            CryptoZoo.api?.savePlayer?.();
        }, 1000);
    },

    startBoostTimer() {
        if (this.boostTimerStarted) return;
        this.boostTimerStarted = true;

        setInterval(() => {
            this.normalizeBoostState();
            CryptoZoo.ui?.render?.();
        }, 1000);
    }
};