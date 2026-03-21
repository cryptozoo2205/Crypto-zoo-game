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

        CryptoZoo.navigation?.bind?.();

        this.bindTap();
        this.bindBoostShopButton();
        this.bindDailyRewardButton();
        this.bindAnimalButtons();
        this.bindShopButtons();

        const lastScreen = sessionStorage.getItem("cryptozoo_last_screen") || "game";
        CryptoZoo.navigation?.show?.(lastScreen);

        CryptoZoo.incomeSystem?.start?.();
        this.startBoostTimer();
        this.startExpeditionTimer();

        CryptoZoo.ui?.render?.();
    },

    /* ================= STATE ================= */

    ensureState() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.animals = CryptoZoo.state.animals || {};

        const defaults = {
            coins: 0,
            gems: 0,
            rewardBalance: 0,
            level: 1,
            coinsPerClick: 1,
            zooIncome: 0,
            expeditionBoost: 0,
            xp: 0,
            boost2xActiveUntil: 0,
            lastLogin: Date.now(),
            dailyRewardStreak: 0,
            playTimeSeconds: 0
        };

        Object.keys(defaults).forEach((key) => {
            if (typeof CryptoZoo.state[key] !== "number") {
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

    /* ================= CLICK ================= */

    getEffectiveCoinsPerClick(tapCount = 1) {
        const base = Math.max(1, CryptoZoo.state.coinsPerClick || 1);
        const boost = this.getBoost2xMultiplier();
        return base * boost * Math.max(1, Math.min(3, tapCount));
    },

    bindTap() {
        const btn = document.getElementById("tapButton");
        if (!btn) return;

        btn.onclick = () => this.handleTap(1);

        btn.addEventListener("touchstart", (e) => {
            e.preventDefault();
            const touches = Math.min(3, e.touches?.length || 1);
            this.handleTap(touches);
        }, { passive: false });
    },

    handleTap(tapCount = 1) {
        const value = this.getEffectiveCoinsPerClick(tapCount);

        CryptoZoo.state.coins += value;
        CryptoZoo.state.xp += tapCount;

        this.recalculateLevel();

        CryptoZoo.ui?.animateCoin?.(tapCount);
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    },

    /* ================= BOOST ================= */

    isBoost2xActive() {
        return (CryptoZoo.state.boost2xActiveUntil || 0) > Date.now();
    },

    getBoost2xMultiplier() {
        return this.isBoost2xActive() ? 2 : 1;
    },

    getBoost2xTimeLeft() {
        return Math.max(0, Math.floor(
            ((CryptoZoo.state.boost2xActiveUntil || 0) - Date.now()) / 1000
        ));
    },

    activateBoost2x() {
        if (this.isBoost2xActive()) return true;

        if ((CryptoZoo.state.gems || 0) < 1) {
            CryptoZoo.ui?.showToast?.("Za mało gems");
            return false;
        }

        CryptoZoo.state.gems -= 1;
        CryptoZoo.state.boost2xActiveUntil = Date.now() + 10 * 60 * 1000;

        this.persistAndRender();
        CryptoZoo.ui?.showToast?.("X2 Boost aktywowany");

        return true;
    },

    bindBoostShopButton() {
        const btn = document.getElementById("buyBoostBtn");
        if (!btn) return;

        btn.onclick = () => {
            if (this.activateBoost2x()) {
                CryptoZoo.navigation?.show?.("game");
            }
        };
    },

    /* ================= OFFLINE ================= */

    applyOfflineEarnings() {
        const now = Date.now();
        const last = CryptoZoo.state.lastLogin || now;

        const seconds = Math.min(
            Math.floor((now - last) / 1000),
            this.maxOfflineSeconds
        );

        if (seconds <= 0) return;

        const income = this.getEffectiveZooIncome();
        const coins = income * seconds;

        CryptoZoo.state.coins += coins;
        CryptoZoo.state.lastLogin = now;

        CryptoZoo.ui?.showToast?.(
            `Offline +${CryptoZoo.formatNumber(coins)}`
        );
    },

    /* ================= INCOME ================= */

    getEffectiveZooIncome() {
        this.recalculateZooIncome();
        return (CryptoZoo.state.zooIncome || 0) * this.getBoost2xMultiplier();
    },

    recalculateZooIncome() {
        let total = 0;
        const animals = CryptoZoo.config?.animals || {};
        const state = CryptoZoo.state.animals || {};

        Object.keys(animals).forEach(type => {
            const a = state[type] || { count: 0, level: 1 };
            total += a.count * a.level * animals[type].baseIncome;
        });

        CryptoZoo.state.zooIncome = total;
    },

    /* ================= LEVEL ================= */

    recalculateLevel() {
        let xp = CryptoZoo.state.xp || 0;
        let level = 1;
        let req = 100;
        let spent = 0;

        while (xp >= spent + req) {
            spent += req;
            level++;
            req += 100;
        }

        CryptoZoo.state.level = Math.max(CryptoZoo.state.level || 1, level);
    },

    /* ================= ANIMALS ================= */

    bindAnimalButtons() {
        const animals = CryptoZoo.config?.animals || {};

        Object.keys(animals).forEach(type => {
            document.getElementById(`buy-${type}-btn`)?.addEventListener("click", () => {
                this.buyAnimal(type);
            });

            document.getElementById(`upgrade-${type}-btn`)?.addEventListener("click", () => {
                this.upgradeAnimal(type);
            });
        });
    },

    buyAnimal(type) {
        const config = CryptoZoo.config.animals[type];
        if (!config) return;

        if (CryptoZoo.state.coins < config.buyCost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        CryptoZoo.state.coins -= config.buyCost;
        CryptoZoo.state.animals[type].count++;

        this.persistAndRender();
    },

    upgradeAnimal(type) {
        const a = CryptoZoo.state.animals[type];
        if (!a || a.count <= 0) return;

        const cost = this.getAnimalUpgradeCost(type);

        if (CryptoZoo.state.coins < cost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return;
        }

        CryptoZoo.state.coins -= cost;
        a.level++;

        this.persistAndRender();
    },

    getAnimalUpgradeCost(type) {
        const a = CryptoZoo.state.animals[type];
        const base = CryptoZoo.config.animals[type].buyCost;

        return Math.floor(base * 0.5 * Math.pow(1.4, a.level));
    },

    /* ================= SHOP ================= */

    bindShopButtons() {
        const items = CryptoZoo.config.shopItems || [];

        items.forEach(item => {
            document.getElementById(`buy-shop-${item.id}`)?.addEventListener("click", () => {
                this.buyShopItem(item.id);
            });
        });
    },

    buyShopItem(id) {
        const item = CryptoZoo.config.shopItems.find(x => x.id === id);
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

    /* ================= EXPEDITIONS ================= */

    startExpedition(id) {
        return CryptoZoo.expeditionsSystem?.start?.(id);
    },

    collectExpedition() {
        return CryptoZoo.expeditionsSystem?.collect?.();
    },

    isExpeditionUnlocked(exp) {
        return CryptoZoo.state.level >= this.getExpeditionUnlockRequirement(exp);
    },

    getExpeditionUnlockRequirement(exp) {
        return Math.floor((exp.duration || 0) / 1000 / 600) || 1;
    },

    getExpeditionRewardBalanceAmount(expedition) {
        return Math.floor((expedition?.endTime - expedition?.startTime) / 10000) || 0;
    },

    startExpeditionTimer() {
        if (this.expeditionTimerStarted) return;
        this.expeditionTimerStarted = true;

        setInterval(() => {
            if (this.activeScreen === "missions") {
                CryptoZoo.ui?.renderExpeditions?.();
            }
        }, 1000);
    },

    /* ================= DAILY ================= */

    bindDailyRewardButton() {
        document.getElementById("homeDailyBtn")?.addEventListener("click", () => {
            CryptoZoo.dailyReward?.claim?.();
        });
    },

    /* ================= CORE ================= */

    persistAndRender() {
        this.recalculateZooIncome();
        this.recalculateLevel();

        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
    }
};