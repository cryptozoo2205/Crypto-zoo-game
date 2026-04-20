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

    getItemChargeCount(itemId) {
        this.ensurePurchaseState();
        return Math.max(0, Number(CryptoZoo.state.shopItemCharges[itemId]) || 0);
    },

    addItemCharges(itemId, amount = 1) {
        this.ensurePurchaseState();

        const safeAmount = Math.max(1, Number(amount) || 1);
        CryptoZoo.state.shopItemCharges[itemId] =
            this.getItemChargeCount(itemId) + safeAmount;

        this.saveNow();
    },

    consumeItemCharge(itemId, amount = 1) {
        this.ensurePurchaseState();

        const safeAmount = Math.max(1, Number(amount) || 1);
        const current = this.getItemChargeCount(itemId);

        if (current < safeAmount) {
            return false;
        }

        CryptoZoo.state.shopItemCharges[itemId] = Math.max(0, current - safeAmount);
        this.saveNow();
        return true;
    },

    isDailyBoostActive() {
        this.ensurePurchaseState();
        return (Number(CryptoZoo.state?.dailyExpeditionBoost?.activeUntil) || 0) > Date.now();
    },

    canBuyDailyBoost() {
        this.ensurePurchaseState();

        const last = Number(CryptoZoo.state?.dailyExpeditionBoost?.lastPurchaseAt) || 0;
        return Date.now() - last >= this.DAILY_EXPEDITION_BOOST_COOLDOWN;
    },

    getDailyBoostTimeLeftMs() {
        this.ensurePurchaseState();
        return Math.max(
            0,
            (Number(CryptoZoo.state?.dailyExpeditionBoost?.activeUntil) || 0) - Date.now()
        );
    },

    getDailyBoostMultiplier() {
        return this.isDailyBoostActive()
            ? 1 + Math.max(0, Number(this.DAILY_EXPEDITION_BOOST_VALUE) || 0)
            : 1;
    },

    getEffectivePriceScale(item) {
        const explicitScale = Number(item?.priceScale);

        if (Number.isFinite(explicitScale) && explicitScale > 1) {
            return explicitScale;
        }

        const type = String(item?.type || "").toLowerCase();
        const effect = String(item?.effect || "").toLowerCase();
        const itemId = String(item?.id || "").toLowerCase();

        if (type === "click" || itemId.startsWith("click")) {
            return 1.35;
        }

        if (type === "income" || itemId.startsWith("income")) {
            return 1.28;
        }

        if (type === "expeditiontime" || effect === "expeditiontime") {
            return 1.18;
        }

        if (type === "expedition" || itemId.startsWith("expedition")) {
            return 1;
        }

        return 1.2;
    },

    getScaledCoinPrice(item) {
        const basePrice = Math.max(0, Number(item?.price) || 0);
        const owned = this.getOwnedCount(item?.id);
        const scale = this.getEffectivePriceScale(item);

        if (basePrice <= 0) {
            return 0;
        }

        if (scale <= 1) {
            return Math.floor(basePrice);
        }

        return Math.floor(basePrice * Math.pow(scale, owned));
    },

    getCurrentPriceMeta(item) {
        if (!item) {
            return {
                label: "Koszt",
                value: "0"
            };
        }

        const gemPrice = Math.max(0, Number(item.gemPrice) || 0);
        if (gemPrice > 0) {
            return {
                label: "Koszt",
                value: `${CryptoZoo.formatNumber(gemPrice)} gemy`
            };
        }

        return {
            label: "Koszt",
            value: CryptoZoo.formatNumber(this.getScaledCoinPrice(item))
        };
    },

    canAfford(item) {
        const gemPrice = Math.max(0, Number(item?.gemPrice) || 0);

        if (gemPrice > 0) {
            return (Number(CryptoZoo.state?.gems) || 0) >= gemPrice;
        }

        return (Number(CryptoZoo.state?.coins) || 0) >= this.getScaledCoinPrice(item);
    },

    spendPrice(item) {
        const gemPrice = Math.max(0, Number(item?.gemPrice) || 0);

        if (gemPrice > 0) {
            CryptoZoo.state.gems = Math.max(
                0,
                (Number(CryptoZoo.state?.gems) || 0) - gemPrice
            );
            return;
        }

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
            const nextLevel = Math.min(
                maxLevel,
                currentLevel + Math.max(1, Number(item?.incomeBonus) || 1)
            );

            if (nextLevel > currentLevel) {
                animal.level = nextLevel;
                affected++;
            }
        });

        CryptoZoo.gameplay?.recalculateProgress?.();

        return affected > 0
            ? `+${CryptoZoo.formatNumber(Math.max(1, Number(item?.incomeBonus) || 1))} lvl`
            : "Brak zwierząt";
    },

    applyClickUpgrade(item) {
        const bonus = Math.max(1, Number(item?.clickValueBonus) || 1);

        CryptoZoo.state.coinsPerClick =
            Math.max(1, Number(CryptoZoo.state?.coinsPerClick) || 1) + bonus;

        return `+${CryptoZoo.formatNumber(bonus)} click`;
    },

    applyExpeditionRewardUpgrade() {
        this.ensurePurchaseState();

        if (this.isDailyBoostActive()) {
            CryptoZoo.ui?.showToast?.("Boost ekspedycji już aktywny");
            return "Cooldown";
        }

        if (!this.canBuyDailyBoost()) {
            CryptoZoo.ui?.showToast?.("Boost raz na 24h");
            return "Cooldown";
        }

        const now = Date.now();

        CryptoZoo.state.dailyExpeditionBoost.activeUntil =
            now + this.DAILY_EXPEDITION_BOOST_COOLDOWN;

        CryptoZoo.state.dailyExpeditionBoost.lastPurchaseAt = now;

        return "+12% expedition";
    },

    applyExpeditionTimeCharge(item) {
        const itemId = String(item?.id || "").trim();
        if (!itemId) {
            return "Błąd itemu";
        }

        this.addItemCharges(itemId, 1);

        return `+1 ${CryptoZoo.ui?.t?.("charge", "ładunek") || "ładunek"}`;
    },

    applyItemEffect(item) {
        const type = String(item?.type || "").toLowerCase();
        const effect = String(item?.effect || "").toLowerCase();

        if (type === "click") return this.applyClickUpgrade(item);
        if (type === "income") return this.applyIncomeUpgrade(item);
        if (type === "expedition") return this.applyExpeditionRewardUpgrade(item);
        if (type === "expeditiontime" || effect === "expeditiontime") {
            return this.applyExpeditionTimeCharge(item);
        }

        return "Kupiono";
    },

    async purchase(itemId) {
        const item = this.getItemById(itemId);

        if (!item) {
            CryptoZoo.ui?.showToast?.("Błąd itemu");
            return false;
        }

        if (!this.canAfford(item)) {
            const gemPrice = Math.max(0, Number(item?.gemPrice) || 0);

            if (gemPrice > 0) {
                CryptoZoo.ui?.showToast?.(`Brakuje ${CryptoZoo.formatNumber(gemPrice)} gemów`);
            } else {
                CryptoZoo.ui?.showToast?.(`Brakuje ${CryptoZoo.formatNumber(this.getScaledCoinPrice(item))}`);
            }

            return false;
        }

        const resultText = this.applyItemEffect(item);
        if (resultText === "Cooldown") return false;

        this.spendPrice(item);
        this.addOwnedCount(item.id, 1);

        await this.saveNow();

        CryptoZoo.ui?.renderShopItems?.();
        CryptoZoo.ui?.render?.();
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