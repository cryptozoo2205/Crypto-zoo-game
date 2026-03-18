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
            1,
            Number(CryptoZoo.state?.coinsPerClick) ||
            Number(CryptoZoo.config?.clickValue) ||
            1
        );
    },

    // 🔥 FIX: ograniczenie click power
    getEffectiveCoinsPerClick(tapCount = 1) {
        const touches = this.getTapCountFromTouches(tapCount);
        const base = this.getBaseCoinsPerClick() * this.getBoost2xMultiplier();

        const capped = Math.min(base * touches, base * 2); // MAX x2 zamiast x3

        return capped;
    },

    getBaseZooIncome() {
        this.recalculateZooIncome();
        return Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
    },

    getEffectiveZooIncome() {
        return this.getBaseZooIncome() * this.getBoost2xMultiplier();
    },

    persistAndRender() {
        this.normalizeBoostState();
        this.recalculateProgress();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    },

    activateBoost2x() {
        const boostCostGems = 1;
        const boostDurationMs = 10 * 60 * 1000;

        if (this.isBoost2xActive()) {
            CryptoZoo.ui?.showToast?.("Boost już aktywny");
            return true;
        }

        if ((Number(CryptoZoo.state.gems) || 0) < boostCostGems) {
            CryptoZoo.ui?.showToast?.("Za mało gems");
            return false;
        }

        CryptoZoo.state.gems -= boostCostGems;
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
            if (activated) this.showScreen("game");
        };
    },

    bindNavigation() {
        const navButtons = document.querySelectorAll("[data-nav]");

        navButtons.forEach((button) => {
            button.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.showScreen(button.getAttribute("data-nav"));
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

        const target = document.getElementById(`screen-${screenName}`);
        if (target) {
            target.classList.remove("hidden");
            target.classList.add("active-screen");
        }

        document.querySelector(`[data-nav="${screenName}"]`)?.classList.add("active-nav");

        this.activeScreen = screenName;
        sessionStorage.setItem("cryptozoo_last_screen", screenName);

        CryptoZoo.ui?.render?.();
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

        tapButton.onclick = (event) => {
            event.preventDefault();
            if (Date.now() < this.suppressClickUntil) return;
            this.handleTap(1);
        };

        tapButton.addEventListener("touchstart", (event) => {
            if (this.touchTapLock) return;

            const touches = this.getTapCountFromTouches(event.touches?.length || 1);

            this.touchTapLock = true;
            this.suppressClickUntil = Date.now() + 700;
            event.preventDefault();
            this.handleTap(touches);
        }, { passive: false });

        tapButton.addEventListener("touchend", () => this.touchTapLock = false);
        tapButton.addEventListener("touchcancel", () => this.touchTapLock = false);
    },

    recalculateZooIncome() {
        const animals = CryptoZoo.config?.animals || {};
        const stateAnimals = CryptoZoo.state?.animals || {};

        let total = 0;

        Object.keys(animals).forEach((type) => {
            const config = animals[type];
            const animal = stateAnimals[type] || { count: 0, level: 1 };

            total += animal.count * animal.level * config.baseIncome;
        });

        CryptoZoo.state.zooIncome = total;
    },

    recalculateLevel() {
        const xp = Number(CryptoZoo.state.xp) || 0;

        let level = 1;
        let requiredXp = 100;
        let spentXp = 0;

        while (xp >= spentXp + requiredXp) {
            spentXp += requiredXp;
            level++;
            requiredXp += 100;
        }

        CryptoZoo.state.level = Math.max(CryptoZoo.state.level, level);
    },

    recalculateProgress() {
        this.recalculateZooIncome();
        this.recalculateLevel();
        this.normalizeBoostState();
    },

    startIncomeTimer() {
        if (this.incomeTimerStarted) return;
        this.incomeTimerStarted = true;

        setInterval(() => {
            this.recalculateProgress();

            const income = this.getEffectiveZooIncome();

            CryptoZoo.state.coins += income;
            CryptoZoo.state.xp += 1;

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
            CryptoZoo.ui?.render?.();
        }, 1000);
    }
};