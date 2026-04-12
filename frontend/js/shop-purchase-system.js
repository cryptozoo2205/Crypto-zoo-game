window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.shopSystem = {
    DAILY_EXPEDITION_BOOST_COOLDOWN: 24 * 60 * 60 * 1000,
    DAILY_EXPEDITION_BOOST_VALUE: 0.15, // ↓ było 0.25

    getItemById(itemId) {
        const items = CryptoZoo.config?.shopItems || [];
        return items.find((item) => item.id === itemId) || null;
    },

    ensurePurchaseState() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.shopPurchases = CryptoZoo.state.shopPurchases || {};
        CryptoZoo.state.shopItemCharges = CryptoZoo.state.shopItemCharges || {};

        CryptoZoo.state.dailyExpeditionBoost = CryptoZoo.state.dailyExpeditionBoost || {
            activeUntil: 0,
            lastPurchaseAt: 0
        };
    },

    isDailyBoostActive() {
        return (Number(CryptoZoo.state?.dailyExpeditionBoost?.activeUntil) || 0) > Date.now();
    },

    canBuyDailyBoost() {
        const last = Number(CryptoZoo.state?.dailyExpeditionBoost?.lastPurchaseAt) || 0;
        return Date.now() - last >= this.DAILY_EXPEDITION_BOOST_COOLDOWN;
    },

    getDailyBoostMultiplier() {
        return this.isDailyBoostActive() ? 1 + this.DAILY_EXPEDITION_BOOST_VALUE : 1;
    },

    applyDailyBoost() {
        CryptoZoo.state.dailyExpeditionBoost.activeUntil =
            Date.now() + this.DAILY_EXPEDITION_BOOST_COOLDOWN;

        CryptoZoo.state.dailyExpeditionBoost.lastPurchaseAt = Date.now();
    },

    getOwnedCount(itemId) {
        this.ensurePurchaseState();
        return Math.max(0, Number(CryptoZoo.state.shopPurchases[itemId]) || 0);
    },

    addOwnedCount(itemId, amount = 1) {
        this.ensurePurchaseState();
        CryptoZoo.state.shopPurchases[itemId] =
            this.getOwnedCount(itemId) + Math.max(1, Number(amount) || 1);
    },

    getScaledCoinPrice(item) {
        const basePrice = Math.max(0, Number(item?.price) || 0);
        const owned = this.getOwnedCount(item?.id);
        const scale = Math.max(1, Number(item?.priceScale) || 1);

        return Math.floor(basePrice * Math.pow(scale, owned));
    },

    canAfford(item) {
        const price = this.getScaledCoinPrice(item);
        return (Number(CryptoZoo.state?.coins) || 0) >= price;
    },

    spendPrice(item) {
        const price = this.getScaledCoinPrice(item);

        CryptoZoo.state.coins = Math.max(
            0,
            (Number(CryptoZoo.state?.coins) || 0) - price
        );

        CryptoZoo.dailyMissions?.recordSpendCoins?.(price);
    },

    // 🔥 NAJWAŻNIEJSZE — NERF GLOBAL INCOME BOOST
    applyIncomeUpgrade(item) {
        const incomeBonus = Math.max(1, Number(item?.incomeBonus) || 1);
        const animals = CryptoZoo.state?.animals || {};
        const maxLevel = Math.max(1, Number(CryptoZoo.config?.limits?.maxLevelPerAnimal) || 25);

        let affected = 0;

        Object.keys(animals).forEach((type) => {
            const animal = animals[type];
            const count = Math.max(0, Number(animal?.count) || 0);

            if (count <= 0) return;

            const currentLevel = Math.max(1, Number(animal?.level) || 1);

            // 🔥 ZAMIAST +lvl → mały boost (max +2)
            const safeBonus = Math.min(2, incomeBonus);

            const nextLevel = Math.min(maxLevel, currentLevel + safeBonus);

            if (nextLevel > currentLevel) {
                animal.level = nextLevel;
                affected += 1;
            }
        });

        CryptoZoo.gameplay?.recalculateProgress?.();

        if (affected <= 0) {
            return "Brak zwierząt";
        }

        return `Mały boost income`;
    },

    applyClickUpgrade(item) {
        const bonus = Math.max(1, Number(item?.clickValueBonus) || 1);

        CryptoZoo.state.coinsPerClick =
            Math.max(1, Number(CryptoZoo.state?.coinsPerClick) || 1) + bonus;

        return `+${CryptoZoo.formatNumber(bonus)} click`;
    },

    applyExpeditionRewardUpgrade() {
        if (!this.canBuyDailyBoost()) {
            CryptoZoo.ui?.showToast?.("Boost raz na 24h");
            return "Cooldown";
        }

        this.applyDailyBoost();
        return "+15% expedition";
    },

    applyItemEffect(item) {
        const type = String(item?.type || "").toLowerCase();

        if (type === "click") return this.applyClickUpgrade(item);
        if (type === "income") return this.applyIncomeUpgrade(item);
        if (type === "expedition") return this.applyExpeditionRewardUpgrade(item);

        return "Kupiono";
    },

    purchase(itemId) {
        const item = this.getItemById(itemId);

        if (!item) {
            CryptoZoo.ui?.showToast?.("Błąd itemu");
            return false;
        }

        if (!this.canAfford(item)) {
            const price = this.getScaledCoinPrice(item);
            CryptoZoo.ui?.showToast?.(`Brakuje ${CryptoZoo.formatNumber(price)}`);
            return false;
        }

        const resultText = this.applyItemEffect(item);

        if (resultText === "Cooldown") return false;

        this.spendPrice(item);
        this.addOwnedCount(item.id, 1);

        CryptoZoo.state.lastLogin = Date.now();

        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        CryptoZoo.ui?.showToast?.(resultText);
        return true;
    },

    bindButtons() {
        const items = CryptoZoo.config?.shopItems || [];

        items.forEach((item) => {
            const btn = document.getElementById(`buy-shop-${item.id}`);
            if (!btn || btn.dataset.bound === "1") return;

            btn.dataset.bound = "1";
            btn.onclick = () => {
                CryptoZoo.audio?.play?.("click");
                this.purchase(item.id);
            };
        });
    }
};