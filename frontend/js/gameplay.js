window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.gameplay = {
    activeScreen: "game",
    expeditionTimerStarted: false,
    incomeTimerStarted: false,
    boostTimerStarted: false,

    init() {
        this.ensureState();
        this.bindNavigation();
        this.bindTap();
        this.bindBoostShopButton();
        this.startIncomeTimer();
        this.startExpeditionTimer();
        this.startBoostTimer();

        const lastScreen = sessionStorage.getItem("cryptozoo_last_screen") || "game";
        this.showScreen(lastScreen);

        this.recalculateProgress();
        this.bindAnimalButtons();
        this.bindShopButtons();
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
        if (typeof CryptoZoo.state.coinsPerClick !== "number") CryptoZoo.state.coinsPerClick = Number(CryptoZoo.state.coinsPerClick) || 1;
        if (typeof CryptoZoo.state.zooIncome !== "number") CryptoZoo.state.zooIncome = Number(CryptoZoo.state.zooIncome) || 0;
        if (typeof CryptoZoo.state.expeditionBoost !== "number") CryptoZoo.state.expeditionBoost = Number(CryptoZoo.state.expeditionBoost) || 0;
        if (typeof CryptoZoo.state.offlineBoost !== "number") CryptoZoo.state.offlineBoost = Number(CryptoZoo.state.offlineBoost) || 1;
        if (typeof CryptoZoo.state.xp !== "number") CryptoZoo.state.xp = Number(CryptoZoo.state.xp) || 0;
        if (typeof CryptoZoo.state.boost2xActiveUntil !== "number") CryptoZoo.state.boost2xActiveUntil = Number(CryptoZoo.state.boost2xActiveUntil) || 0;
    },

    isBoost2xActive() {
        return (Number(CryptoZoo.state.boost2xActiveUntil) || 0) > Date.now();
    },

    getBoost2xMultiplier() {
        return this.isBoost2xActive() ? 2 : 1;
    },

    getBoost2xTimeLeft() {
        const leftMs = (Number(CryptoZoo.state.boost2xActiveUntil) || 0) - Date.now();
        return Math.max(0, Math.floor(leftMs / 1000));
    },

    activateBoost2x() {
        const boostCostGems = 1;
        const boostDurationMs = 10 * 60 * 1000;

        if ((Number(CryptoZoo.state.gems) || 0) < boostCostGems) {
            CryptoZoo.ui?.showToast?.("Za mało gems");
            return;
        }

        CryptoZoo.state.gems -= boostCostGems;
        CryptoZoo.state.boost2xActiveUntil = Date.now() + boostDurationMs;

        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.("X2 Boost aktywowany");
    },

    bindBoostShopButton() {
        const btn = document.getElementById("buyBoostBtn");
        if (!btn) return;

        btn.onclick = () => {
            this.activateBoost2x();
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
            CryptoZoo.ui?.renderRanking?.();
        }

        if (screenName === "missions") {
            CryptoZoo.ui?.renderExpeditions?.();
        }

        if (screenName === "shop") {
            this.bindBoostShopButton();
        }
    },

    bindTap() {
        const tapButton = document.getElementById("tapButton");
        if (!tapButton) return;

        tapButton.onclick = () => {
            const baseClickValue =
                Number(CryptoZoo.state?.coinsPerClick) ||
                Number(CryptoZoo.config?.clickValue) ||
                1;

            const clickValue = baseClickValue * this.getBoost2xMultiplier();

            CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + clickValue;
            CryptoZoo.state.xp = (Number(CryptoZoo.state.xp) || 0) + 1;

            this.recalculateLevel();

            CryptoZoo.ui?.animateCoin?.();
            CryptoZoo.ui?.render?.();
            CryptoZoo.api?.savePlayer?.();
        };
    },

    bindAnimalButtons() {
        const animals = CryptoZoo.config?.animals || {};

        Object.keys(animals).forEach((type) => {
            const buyBtn = document.getElementById(`buy-${type}-btn`);
            const upgradeBtn = document.getElementById(`upgrade-${type}-btn`);

            if (buyBtn) {
                buyBtn.onclick = () => this.buyAnimal(type);
            }

            if (upgradeBtn) {
                upgradeBtn.onclick = () => this.upgradeAnimal(type);
            }
        });
    },

    bindShopButtons() {
        const items = CryptoZoo.config?.shopItems || [];

        items.forEach((item) => {
            const btn = document.getElementById(`buy-shop-${item.id}`);
            if (btn) {
                btn.onclick = () => this.buyShopItem(item.id);
            }
        });
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
            CryptoZoo.state.level = Math.max(1, (Number(CryptoZoo.state.level) || 1) - levelLoss);
        }

        CryptoZoo.state.xp = Math.floor((Number(CryptoZoo.state.xp) || 0) * 0.7);
    },

    buyShopItem(itemId) {
        const item = (CryptoZoo.config?.shopItems || []).find((x) => x.id === itemId);
        if (!item) return;

        const price = Number(item.price || 0);
        const coinsBeforeSpend = Number(CryptoZoo.state.coins) || 0;

        if (coinsBeforeSpend < price) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        CryptoZoo.state.coins -= price;

        if (item.type === "click") {
            CryptoZoo.state.coinsPerClick = (Number(CryptoZoo.state.coinsPerClick) || 1) + 1;
        }

        if (item.type === "income") {
            const currentIncome = Number(CryptoZoo.state.zooIncome) || 0;
            CryptoZoo.state.zooIncome = Math.max(1, Math.floor(currentIncome * 1.25));
        }

        if (item.type === "expedition") {
            CryptoZoo.state.expeditionBoost = (Number(CryptoZoo.state.expeditionBoost) || 0) + 0.2;
        }

        if (item.type === "offline") {
            CryptoZoo.state.offlineBoost = 2;
        }

        this.applyLevelDropBySpend(price, coinsBeforeSpend);
        this.recalculateProgress();

        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.(`Kupiono ${item.name}`);
    },

    buyAnimal(type) {
        const config = CryptoZoo.config?.animals?.[type];
        if (!config) return;

        const buyCost = Number(config.buyCost || 0);
        const coinsBeforeSpend = Number(CryptoZoo.state?.coins) || 0;

        if (coinsBeforeSpend < buyCost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        if (!CryptoZoo.state.animals[type]) {
            CryptoZoo.state.animals[type] = { count: 0, level: 1 };
        }

        CryptoZoo.state.coins -= buyCost;
        CryptoZoo.state.animals[type].count += 1;

        this.applyLevelDropBySpend(buyCost, coinsBeforeSpend);
        this.recalculateProgress();

        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.(`Kupiono ${config.name}`);
    },

    getAnimalUpgradeCost(type) {
        const config = CryptoZoo.config?.animals?.[type];
        const animal = CryptoZoo.state?.animals?.[type];

        if (!config || !animal) return 0;

        const level = Number(animal.level) || 1;
        return Math.floor((Number(config.buyCost) || 0) * level * 0.7);
    },

    upgradeAnimal(type) {
        const config = CryptoZoo.config?.animals?.[type];
        const animal = CryptoZoo.state?.animals?.[type];

        if (!config || !animal) return;

        const cost = this.getAnimalUpgradeCost(type);
        const coinsBeforeSpend = Number(CryptoZoo.state.coins) || 0;

        if (coinsBeforeSpend < cost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        CryptoZoo.state.coins -= cost;
        animal.level += 1;

        this.applyLevelDropBySpend(cost, coinsBeforeSpend);
        this.recalculateProgress();

        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.(`Ulepszono ${config.name}`);
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
    },

    recalculateProgress() {
        this.recalculateZooIncome();
        this.recalculateLevel();
    },

    startIncomeTimer() {
        if (this.incomeTimerStarted) return;
        this.incomeTimerStarted = true;

        setInterval(() => {
            const baseIncome = Number(CryptoZoo.state?.zooIncome) || 0;
            if (baseIncome <= 0) return;

            const income = baseIncome * this.getBoost2xMultiplier();

            CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + income;
            CryptoZoo.state.xp = (Number(CryptoZoo.state.xp) || 0) + 1;

            this.recalculateLevel();

            CryptoZoo.ui?.render?.();
            CryptoZoo.api?.savePlayer?.();
        }, 1000);
    },

    startBoostTimer() {
        if (this.boostTimerStarted) return;
        this.boostTimerStarted = true;

        setInterval(() => {
            CryptoZoo.ui?.render?.();
        }, 1000);
    },

    startExpedition(id) {
        const expedition = (CryptoZoo.config?.expeditions || []).find((e) => e.id === id);
        if (!expedition) return;

        if (CryptoZoo.state.expedition) {
            CryptoZoo.ui?.showToast?.("Ekspedycja już trwa");
            return;
        }

        const now = Date.now();
        const rareRoll = Math.random();
        const epicRoll = Math.random();

        let rewardRarity = "common";
        let coinsMultiplier = 1;
        let gemsMultiplier = 1;

        if (epicRoll < expedition.epicChance) {
            rewardRarity = "epic";
            coinsMultiplier = 2.2;
            gemsMultiplier = 2;
        } else if (rareRoll < expedition.rareChance) {
            rewardRarity = "rare";
            coinsMultiplier = 1.5;
            gemsMultiplier = 1.5;
        }

        const bonus = 1 + (Number(CryptoZoo.state.expeditionBoost) || 0);

        CryptoZoo.state.expedition = {
            id: expedition.id,
            name: expedition.name,
            startTime: now,
            endTime: now + expedition.duration * 1000,
            rewardRarity,
            rewardCoins: Math.floor((Number(expedition.baseCoins) || 0) * coinsMultiplier * bonus),
            rewardGems: Math.floor((Number(expedition.baseGems) || 0) * gemsMultiplier * bonus)
        };

        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.("Ekspedycja rozpoczęta");
    },

    collectExpedition() {
        const expedition = CryptoZoo.state?.expedition;
        if (!expedition) {
            CryptoZoo.ui?.showToast?.("Brak aktywnej ekspedycji");
            return;
        }

        if (Date.now() < expedition.endTime) {
            CryptoZoo.ui?.showToast?.("Ekspedycja jeszcze trwa");
            return;
        }

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + (Number(expedition.rewardCoins) || 0);
        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + (Number(expedition.rewardGems) || 0);
        CryptoZoo.state.xp = (Number(CryptoZoo.state.xp) || 0) + 5;

        CryptoZoo.state.expedition = null;

        this.recalculateLevel();

        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.("Odebrano nagrodę z ekspedycji");
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

    openBox(type) {
        CryptoZoo.boxes?.open?.(type);
    }
};