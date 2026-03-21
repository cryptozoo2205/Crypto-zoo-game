window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.gameplay = {
    activeScreen: "game",
    expeditionTimerStarted: false,
    boostTimerStarted: false,
    suppressClickUntil: 0,
    touchTapLock: false,
    maxOfflineSeconds: 3600,

    init() {
        this.ensureState();

        this.bindNavigation();
        this.bindTap();
        this.bindBoostShopButton();
        this.bindDailyRewardButton();
        this.bindAnimalButtons();
        this.bindShopButtons();

        const lastScreen = sessionStorage.getItem("cryptozoo_last_screen") || "game";
        this.showScreen(lastScreen);

        CryptoZoo.incomeSystem?.start?.();
        this.startBoostTimer();
        this.startExpeditionTimer();

        CryptoZoo.ui?.render?.();
    },

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};

        const defaults = {
            coins: 0,
            gems: 0,
            level: 1,
            xp: 0,
            coinsPerClick: 1,
            zooIncome: 0,
            expeditionBoost: 0,
            boost2xActiveUntil: 0,
            lastLogin: Date.now(),
            animals: {}
        };

        Object.keys(defaults).forEach((key) => {
            if (CryptoZoo.state[key] == null) {
                CryptoZoo.state[key] = defaults[key];
            }
        });

        const animals = CryptoZoo.config?.animals || {};
        Object.keys(animals).forEach((type) => {
            if (!CryptoZoo.state.animals[type]) {
                CryptoZoo.state.animals[type] = { count: 0, level: 1 };
            }
        });
    },

    /* ================= NAVIGATION ================= */

    bindNavigation() {
        CryptoZoo.navigation?.bind?.();
    },

    showScreen(screen) {
        CryptoZoo.navigation?.show?.(screen);
    },

    /* ================= TAP ================= */

    bindTap() {
        const btn = document.getElementById("tapButton");
        if (!btn) return;

        btn.onclick = (e) => {
            e.preventDefault();

            if (Date.now() < this.suppressClickUntil) return;

            this.handleTap(1);
        };

        btn.addEventListener("touchstart", (e) => {
            if (this.touchTapLock) return;

            const touches = Math.min(3, e.touches.length);

            this.touchTapLock = true;
            this.suppressClickUntil = Date.now() + 700;

            e.preventDefault();
            this.handleTap(touches);
        }, { passive: false });

        const unlock = () => this.touchTapLock = false;

        btn.addEventListener("touchend", unlock);
        btn.addEventListener("touchcancel", unlock);
    },

    handleTap(count) {
        const value = this.getEffectiveCoinsPerClick(count);

        CryptoZoo.state.coins += value;
        CryptoZoo.state.xp += count;

        this.recalculateLevel();

        CryptoZoo.ui?.animateCoin?.(count);
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    },

    getEffectiveCoinsPerClick(count = 1) {
        const base = CryptoZoo.state.coinsPerClick || 1;
        const boost = this.isBoost2xActive() ? 2 : 1;

        return base * boost * count;
    },

    /* ================= BOOST ================= */

    isBoost2xActive() {
        return (CryptoZoo.state.boost2xActiveUntil || 0) > Date.now();
    },

    activateBoost2x() {
        if (this.isBoost2xActive()) return;

        if (CryptoZoo.state.gems < 1) {
            CryptoZoo.ui?.showToast?.("Za mało gems");
            return;
        }

        CryptoZoo.state.gems -= 1;
        CryptoZoo.state.boost2xActiveUntil = Date.now() + 600000;

        this.persistAndRender();
    },

    bindBoostShopButton() {
        const btn = document.getElementById("buyBoostBtn");
        if (!btn) return;

        btn.onclick = () => {
            this.activateBoost2x();
            this.showScreen("game");
        };
    },

    startBoostTimer() {
        if (this.boostTimerStarted) return;
        this.boostTimerStarted = true;

        setInterval(() => {
            if (!this.isBoost2xActive()) {
                CryptoZoo.state.boost2xActiveUntil = 0;
            }

            CryptoZoo.ui?.render?.();
        }, 1000);
    },

    /* ================= ANIMALS ================= */

    bindAnimalButtons() {
        const animals = CryptoZoo.config.animals;

        Object.keys(animals).forEach((type) => {
            document.getElementById(`buy-${type}-btn`)?.addEventListener("click", () => {
                this.buyAnimal(type);
            });

            document.getElementById(`upgrade-${type}-btn`)?.addEventListener("click", () => {
                this.upgradeAnimal(type);
            });
        });
    },

    buyAnimal(type) {
        const cfg = CryptoZoo.config.animals[type];
        if (!cfg) return;

        if (CryptoZoo.state.coins < cfg.buyCost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        CryptoZoo.state.coins -= cfg.buyCost;
        CryptoZoo.state.animals[type].count++;

        this.persistAndRender();
    },

    upgradeAnimal(type) {
        const animal = CryptoZoo.state.animals[type];
        if (!animal || animal.count <= 0) return;

        const cost = this.getAnimalUpgradeCost(type);

        if (CryptoZoo.state.coins < cost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        CryptoZoo.state.coins -= cost;
        animal.level++;

        this.persistAndRender();
    },

    getAnimalUpgradeCost(type) {
        const cfg = CryptoZoo.config.animals[type];
        const animal = CryptoZoo.state.animals[type];

        return Math.floor(cfg.buyCost * 0.55 * Math.pow(1.42, animal.level - 1));
    },

    /* ================= SHOP ================= */

    bindShopButtons() {
        const items = CryptoZoo.config.shopItems;

        items.forEach((item) => {
            document.getElementById(`buy-shop-${item.id}`)?.addEventListener("click", () => {
                this.buyShopItem(item.id);
            });
        });
    },

    buyShopItem(id) {
        const item = CryptoZoo.config.shopItems.find(i => i.id === id);
        if (!item) return;

        if (item.gemPrice) {
            if (CryptoZoo.state.gems < item.gemPrice) return;
            CryptoZoo.state.gems -= item.gemPrice;
        } else {
            if (CryptoZoo.state.coins < item.price) return;
            CryptoZoo.state.coins -= item.price;
        }

        if (item.type === "click") {
            CryptoZoo.state.coinsPerClick += item.clickValueBonus;
        }

        if (item.type === "income") {
            CryptoZoo.state.zooIncome *= 1.25;
        }

        this.persistAndRender();
    },

    /* ================= DAILY ================= */

    bindDailyRewardButton() {
        document.getElementById("homeDailyBtn")?.addEventListener("click", () => {
            CryptoZoo.dailyReward?.claim?.();
        });
    },

    /* ================= CORE ================= */

    recalculateLevel() {
        const xp = CryptoZoo.state.xp;

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

    persistAndRender() {
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    },

    /* ================= EXPEDITIONS ================= */

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