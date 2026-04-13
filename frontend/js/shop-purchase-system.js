window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.shopSystem = {
    DAILY_EXPEDITION_BOOST_COOLDOWN: 24 * 60 * 60 * 1000,
    DAILY_EXPEDITION_BOOST_VALUE: 0.12,

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

    async saveNow() {
        CryptoZoo.state.lastLogin = Date.now();

        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.gameplay?.requestRender?.(true);

        try {
            await CryptoZoo.api?.flushSave?.(true);
        } catch (e) {
            console.error("SHOP SAVE FAIL:", e);
        }
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
        return (Number(CryptoZoo.state?.coins) || 0) >= this.getScaledCoinPrice(item);
    },

    spendPrice(item) {
        const price = this.getScaledCoinPrice(item);

        CryptoZoo.state.coins = Math.max(
            0,
            (Number(CryptoZoo.state?.coins) || 0) - price
        );

        CryptoZoo.dailyMissions?.recordSpendCoins?.(price);
    },

    applyIncomeUpgrade(item) {
        const animals = CryptoZoo.state?.animals || {};
        const maxLevel = Math.max(1, Number(CryptoZoo.config?.limits?.maxLevelPerAnimal) || 25);

        let affected = 0;

        Object.keys(animals).forEach((type) => {
            const animal = animals[type];
            if ((Number(animal?.count) || 0) <= 0) return;

            const currentLevel = Math.max(1, Number(animal?.level) || 1);
            const nextLevel = Math.min(maxLevel, currentLevel + 1);

            if (nextLevel > currentLevel) {
                animal.level = nextLevel;
                affected++;
            }
        });

        CryptoZoo.gameplay?.recalculateProgress?.();

        return affected > 0 ? "+1 lvl (soft boost)" : "Brak zwierząt";
    },

    applyClickUpgrade(item) {
        const bonus = Math.min(2, Math.max(1, Number(item?.clickValueBonus) || 1));

        CryptoZoo.state.coinsPerClick =
            Math.max(1, Number(CryptoZoo.state?.coinsPerClick) || 1) + bonus;

        return `+${CryptoZoo.formatNumber(bonus)} click`;
    },

    applyExpeditionRewardUpgrade() {
        const last = Number(CryptoZoo.state?.dailyExpeditionBoost?.lastPurchaseAt) || 0;

        if (Date.now() - last < this.DAILY_EXPEDITION_BOOST_COOLDOWN) {
            CryptoZoo.ui?.showToast?.("Boost raz na 24h");
            return "Cooldown";
        }

        CryptoZoo.state.dailyExpeditionBoost.activeUntil =
            Date.now() + this.DAILY_EXPEDITION_BOOST_COOLDOWN;

        CryptoZoo.state.dailyExpeditionBoost.lastPurchaseAt = Date.now();

        return "+12% expedition";
    },

    applyItemEffect(item) {
        const type = String(item?.type || "").toLowerCase();

        if (type === "click") return this.applyClickUpgrade(item);
        if (type === "income") return this.applyIncomeUpgrade(item);
        if (type === "expedition") return this.applyExpeditionRewardUpgrade(item);

        return "Kupiono";
    },

    async purchase(itemId) {
        const item = this.getItemById(itemId);

        if (!item) {
            CryptoZoo.ui?.showToast?.("Błąd itemu");
            return false;
        }

        if (!this.canAfford(item)) {
            CryptoZoo.ui?.showToast?.(`Brakuje ${CryptoZoo.formatNumber(this.getScaledCoinPrice(item))}`);
            return false;
        }

        const resultText = this.applyItemEffect(item);
        if (resultText === "Cooldown") return false;

        this.spendPrice(item);
        this.addOwnedCount(item.id, 1);

        await this.saveNow();

        CryptoZoo.ui?.showToast?.(resultText);
        return true;
    },

    bindButtons() {
        const items = CryptoZoo.config?.shopItems || [];

        items.forEach((item) => {
            const btn = document.getElementById(`buy-shop-${item.id}`);
            if (!btn || btn.dataset.bound === "1") return;

            btn.dataset.bound = "1";
            btn.onclick = async () => {
                CryptoZoo.audio?.play?.("click");
                await this.purchase(item.id);
            };
        });
    }
};
EOF
pm2 restart all