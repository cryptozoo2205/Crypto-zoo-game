window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.gameplay = {
    activeScreen: "game",
    expeditionTimerStarted: false,

    init() {
        this.bindNavigation();
        this.bindTap();
        this.startExpeditionTimer();

        const lastScreen = sessionStorage.getItem("cryptozoo_last_screen") || "game";
        this.showScreen(lastScreen);

        this.bindAnimalButtons();
        this.bindShopButtons();
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
    },

    bindTap() {
        const tapButton = document.getElementById("tapButton");
        if (!tapButton) return;

        tapButton.onclick = () => {
            const clickValue =
                Number(CryptoZoo.state?.coinsPerClick) ||
                Number(CryptoZoo.config?.clickValue) ||
                1;

            CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + clickValue;

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

    buyShopItem(itemId) {
        const item = (CryptoZoo.config?.shopItems || []).find((x) => x.id === itemId);
        if (!item) return;

        if ((Number(CryptoZoo.state.coins) || 0) < Number(item.price || 0)) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        CryptoZoo.state.coins -= Number(item.price || 0);

        if (item.type === "click") {
            CryptoZoo.state.coinsPerClick = (Number(CryptoZoo.state.coinsPerClick) || 1) + 1;
        }

        if (item.type === "income") {
            CryptoZoo.state.zooIncome = Math.floor((Number(CryptoZoo.state.zooIncome) || 0) * 1.25);
        }

        if (item.type === "expedition") {
            CryptoZoo.state.expeditionBoost = ((Number(CryptoZoo.state.expeditionBoost) || 0) + 0.2);
        }

        if (item.type === "offline") {
            CryptoZoo.state.offlineBoost = 2;
        }

        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.(`Kupiono ${item.name}`);
    },

    buyAnimal(type) {
        const config = CryptoZoo.config?.animals?.[type];
        if (!config) return;

        const coins = Number(CryptoZoo.state?.coins) || 0;

        if (coins < config.buyCost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        if (!CryptoZoo.state.animals[type]) {
            CryptoZoo.state.animals[type] = { count: 0, level: 1 };
        }

        CryptoZoo.state.coins -= Number(config.buyCost) || 0;
        CryptoZoo.state.animals[type].count += 1;

        this.recalculateZooIncome();

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

        if ((Number(CryptoZoo.state.coins) || 0) < cost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        CryptoZoo.state.coins -= cost;
        animal.level += 1;

        this.recalculateZooIncome();

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
        CryptoZoo.state.expedition = null;

        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.("Odebrano nagrodę z ekspedycji");
    },

    startExpeditionTimer() {
        if (this.expeditionTimerStarted) return;
        this.expeditionTimerStarted = true;

        setInterval(() => {
            if (!CryptoZoo.state?.expedition) return;
            CryptoZoo.ui?.render?.();
        }, 1000);
    },

    openBox(type) {
        CryptoZoo.boxes?.open?.(type);
    }
};