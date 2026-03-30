window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.shopSystem = {
    DAILY_EXPEDITION_BOOST_COOLDOWN: 24 * 60 * 60 * 1000,
    DAILY_EXPEDITION_BOOST_VALUE: 0.25, // +25%

    getItemById(itemId) {
        const items = CryptoZoo.config?.shopItems || [];
        return items.find((item) => item.id === itemId) || null;
    },

    ensurePurchaseState() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.shopPurchases = CryptoZoo.state.shopPurchases || {};
        CryptoZoo.state.expeditionStats = CryptoZoo.state.expeditionStats || {
            rareChanceBonus: 0,
            epicChanceBonus: 0,
            timeReductionSeconds: 0,
            timeBoostCharges: []
        };

        CryptoZoo.state.expeditionBoost = Math.max(
            0,
            Number(CryptoZoo.state.expeditionBoost) || 0
        );

        CryptoZoo.state.dailyExpeditionBoost = CryptoZoo.state.dailyExpeditionBoost || {
            activeUntil: 0,
            lastPurchaseAt: 0
        };

        CryptoZoo.state.expeditionStats.rareChanceBonus = Math.max(
            0,
            Number(CryptoZoo.state.expeditionStats.rareChanceBonus) || 0
        );

        CryptoZoo.state.expeditionStats.epicChanceBonus = Math.max(
            0,
            Number(CryptoZoo.state.expeditionStats.epicChanceBonus) || 0
        );

        CryptoZoo.state.expeditionStats.timeReductionSeconds = Math.max(
            0,
            Number(CryptoZoo.state.expeditionStats.timeReductionSeconds) || 0
        );

        if (!Array.isArray(CryptoZoo.state.expeditionStats.timeBoostCharges)) {
            CryptoZoo.state.expeditionStats.timeBoostCharges = [];
        }

        CryptoZoo.state.expeditionStats.timeBoostCharges = CryptoZoo.state.expeditionStats.timeBoostCharges
            .map((value) => Math.max(0, Number(value) || 0))
            .filter((value) => value > 0);

        CryptoZoo.state.offlineBaseHours = Math.max(
            1,
            Math.floor(Number(CryptoZoo.state.offlineBaseHours) || 1)
        );

        CryptoZoo.state.offlineBoostHours = Math.max(
            0,
            Math.min(
                Number(CryptoZoo.gameplay?.maxOfflineBoostHoursFromShop) || 3,
                Math.floor(Number(CryptoZoo.state.offlineBoostHours) || 0)
            )
        );

        CryptoZoo.state.offlineAdsHours = Math.max(
            0,
            Math.floor(Number(CryptoZoo.state.offlineAdsHours) || 0)
        );
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

    isOfflineCapacityItem(item) {
        const effect = String(item?.effect || item?.type || "").toLowerCase();
        const durationSeconds = Math.max(0, Number(item?.offlineDurationSeconds) || 0);

        if (effect !== "offline") return false;

        return durationSeconds >= 3600;
    },

    getOfflineCapacityHoursFromItem(item) {
        const durationSeconds = Math.max(0, Number(item?.offlineDurationSeconds) || 0);

        if (durationSeconds >= 7200) {
            return Math.max(1, Math.floor(durationSeconds / 3600));
        }

        return durationSeconds >= 3600 ? 1 : 0;
    },

    getOwnedCount(itemId) {
        this.ensurePurchaseState();

        const item = this.getItemById(itemId);

        if (this.isOfflineCapacityItem(item)) {
            return Math.max(0, Number(CryptoZoo.state?.offlineBoostHours) || 0);
        }

        return Math.max(0, Number(CryptoZoo.state.shopPurchases[itemId]) || 0);
    },

    addOwnedCount(itemId, amount = 1) {
        this.ensurePurchaseState();
        CryptoZoo.state.shopPurchases[itemId] =
            this.getOwnedCount(itemId) + Math.max(1, Number(amount) || 1);
    },

    getMaxAnimalLevel() {
        return Math.max(1, Number(CryptoZoo.config?.limits?.maxLevelPerAnimal) || 100);
    },

    getMaxOfflineBoostHoursFromShop() {
        return Math.max(
            0,
            Number(CryptoZoo.gameplay?.maxOfflineBoostHoursFromShop) || 3
        );
    },

    canBuyOfflineCapacityItem(item) {
        if (!this.isOfflineCapacityItem(item)) return true;

        const currentHours = Math.max(0, Number(CryptoZoo.state?.offlineBoostHours) || 0);
        const addHours = this.getOfflineCapacityHoursFromItem(item);
        const maxHours = this.getMaxOfflineBoostHoursFromShop();

        return currentHours + addHours <= maxHours;
    },

    shouldTrackOwnedCount(item) {
        const effect = String(item?.effect || "").toLowerCase();
        const type = String(item?.type || "").toLowerCase();

        if (effect === "expedition" || type === "expedition") return false;
        if (effect === "expeditiontime" || type === "expeditiontime") return false;
        if (effect === "coinpack" || effect === "coins") return false;
        if (type === "offline") return false;
        if (effect === "boost2x" || effect === "boost") return false;

        return true;
    },

    getScaledCoinPrice(item) {
        const basePrice = Math.max(0, Number(item?.price) || 0);
        const owned = this.getOwnedCount(item?.id);
        const scale = Math.max(1, Number(item?.priceScale) || 1);

        if (basePrice <= 0) return 0;

        if (!this.shouldTrackOwnedCount(item)) {
            return basePrice;
        }

        return Math.floor(basePrice * Math.pow(scale, owned));
    },

    getCurrentPriceMeta(item) {
        if (!item) {
            return {
                label: "Koszt",
                value: "0",
                type: "coins",
                amount: 0
            };
        }

        const gemPrice = Math.max(0, Number(item.gemPrice) || 0);

        if (gemPrice > 0) {
            return {
                label: "Koszt",
                value: `${CryptoZoo.formatNumber(gemPrice)} gem`,
                type: "gems",
                amount: gemPrice
            };
        }

        const coinPrice = this.getScaledCoinPrice(item);

        return {
            label: "Koszt",
            value: `${CryptoZoo.formatNumber(coinPrice)}`,
            type: "coins",
            amount: coinPrice
        };
    },

    canAfford(item) {
        if (this.isOfflineCapacityItem(item) && !this.canBuyOfflineCapacityItem(item)) {
            return false;
        }

        const meta = this.getCurrentPriceMeta(item);

        if (meta.type === "gems") {
            return (Number(CryptoZoo.state?.gems) || 0) >= meta.amount;
        }

        return (Number(CryptoZoo.state?.coins) || 0) >= meta.amount;
    },

    spendPrice(item) {
        const meta = this.getCurrentPriceMeta(item);

        if (meta.type === "gems") {
            CryptoZoo.state.gems = Math.max(
                0,
                (Number(CryptoZoo.state?.gems) || 0) - meta.amount
            );
            return true;
        }

        CryptoZoo.state.coins = Math.max(
            0,
            (Number(CryptoZoo.state?.coins) || 0) - meta.amount
        );

        CryptoZoo.dailyMissions?.recordSpendCoins?.(meta.amount);

        return true;
    },

    applyExpeditionRewardUpgrade(item) {
        this.ensurePurchaseState();

        if (!this.canBuyDailyBoost()) {
            CryptoZoo.ui?.showToast?.("Boost dostępny raz na 24h");
            return "Cooldown";
        }

        this.applyDailyBoost();

        return "+25% reward z ekspedycji przez 24h";
    },

    applyClickUpgrade(item) {
        const bonus = Math.max(1, Number(item?.clickValueBonus) || 1);

        CryptoZoo.state.coinsPerClick =
            Math.max(1, Number(CryptoZoo.state?.coinsPerClick) || 1) + bonus;

        return `+${CryptoZoo.formatNumber(bonus)} click`;
    },

    applyIncomeUpgrade(item) {
        const incomeBonus = Math.max(1, Number(item?.incomeBonus) || 1);
        const animals = CryptoZoo.state?.animals || {};
        const maxLevel = this.getMaxAnimalLevel();

        let affected = 0;

        Object.keys(animals).forEach((type) => {
            const animal = animals[type];
            const count = Math.max(0, Number(animal?.count) || 0);

            if (count <= 0) return;

            const currentLevel = Math.max(1, Number(animal?.level) || 1);
            const nextLevel = Math.min(maxLevel, currentLevel + incomeBonus);

            if (nextLevel > currentLevel) {
                animal.level = nextLevel;
                affected += 1;
            }
        });

        CryptoZoo.gameplay?.recalculateProgress?.();

        if (affected <= 0) {
            return "Brak posiadanych zwierząt do ulepszenia";
        }

        return `+${CryptoZoo.formatNumber(incomeBonus)} lvl do posiadanych zwierząt`;
    },

    applyExpeditionTimeReduction(item) {
        this.ensurePurchaseState();

        const reductionSeconds = Math.max(0, Number(item?.timeReductionSeconds) || 0);
        if (reductionSeconds <= 0) {
            return "Brak boosta czasu";
        }

        const added = CryptoZoo.expeditions?.addTimeBoostCharge?.(reductionSeconds);
        if (!added) {
            return "Brak boosta czasu";
        }

        const count = CryptoZoo.expeditions?.getTimeBoostChargesCount?.() || 0;
        const label = CryptoZoo.ui?.formatDurationLabel?.(reductionSeconds) || `${reductionSeconds}s`;

        return `+1 boost czasu ekspedycji (${label}) • Charges: ${CryptoZoo.formatNumber(count)}`;
    },

    applyOfflineBoost(item) {
        this.ensurePurchaseState();

        if (this.isOfflineCapacityItem(item)) {
            const addHours = this.getOfflineCapacityHoursFromItem(item);
            const added = CryptoZoo.gameplay?.addOfflineHourBoost?.(addHours);

            if (!added) {
                CryptoZoo.ui?.showToast?.("Masz już maksymalny limit offline 4h");
                return "LimitReached";
            }

            const totalHours = CryptoZoo.gameplay?.getOfflineHoursWithoutAds?.() || 1;
            return `+${CryptoZoo.formatNumber(addHours)}h offline • Limit: ${CryptoZoo.formatNumber(totalHours)}h / 4h`;
        }

        const multiplier = Math.max(2, Number(item?.offlineMultiplier) || 2);
        const durationSeconds = Math.max(60, Number(item?.offlineDurationSeconds) || 600);

        CryptoZoo.state.offlineBoost = multiplier;
        CryptoZoo.state.offlineBoostMultiplier = multiplier;
        CryptoZoo.state.offlineBoostActiveUntil = Date.now() + durationSeconds * 1000;

        CryptoZoo.offline?.normalizeState?.();

        return `Offline x${CryptoZoo.formatNumber(multiplier)} przez ${CryptoZoo.ui?.formatDurationLabel?.(durationSeconds) || `${durationSeconds}s`}`;
    },

    applyCoinPack(item) {
        const amount = Math.max(
            1,
            Number(item?.coinPackAmount) || Number(item?.coinsAmount) || 1000
        );

        CryptoZoo.state.coins = (Number(CryptoZoo.state?.coins) || 0) + amount;
        return `+${CryptoZoo.formatNumber(amount)} coins`;
    },

    applyBoost2x(item) {
        const durationSeconds = Math.max(60, Number(item?.boostDurationSeconds) || 600);

        CryptoZoo.state.boost2xActiveUntil = Date.now() + durationSeconds * 1000;
        CryptoZoo.gameplay?.normalizeBoostState?.();
        CryptoZoo.ui?.renderBoostStatus?.();

        return `X2 Boost przez ${CryptoZoo.ui?.formatDurationLabel?.(durationSeconds) || `${durationSeconds}s`}`;
    },

    applyItemEffect(item) {
        const effect = String(item?.effect || item?.type || "").toLowerCase();

        if (effect === "click") return this.applyClickUpgrade(item);
        if (effect === "income") return this.applyIncomeUpgrade(item);
        if (effect === "expedition") return this.applyExpeditionRewardUpgrade(item);
        if (effect === "expeditiontime") return this.applyExpeditionTimeReduction(item);
        if (effect === "offline") return this.applyOfflineBoost(item);
        if (effect === "coinpack" || effect === "coins") return this.applyCoinPack(item);
        if (effect === "boost2x" || effect === "boost") return this.applyBoost2x(item);

        return item?.name || "Kupiono";
    },

    purchase(itemId) {
        const item = this.getItemById(itemId);

        if (!item) {
            CryptoZoo.ui?.showToast?.("Nie znaleziono przedmiotu");
            return false;
        }

        if (this.isOfflineCapacityItem(item) && !this.canBuyOfflineCapacityItem(item)) {
            CryptoZoo.ui?.showToast?.("Masz już maksymalny limit offline 4h");
            return false;
        }

        if (!this.canAfford(item)) {
            const priceMeta = this.getCurrentPriceMeta(item);
            const text =
                priceMeta.type === "gems"
                    ? `Potrzebujesz ${CryptoZoo.formatNumber(priceMeta.amount)} gem`
                    : `Potrzebujesz ${CryptoZoo.formatNumber(priceMeta.amount)} coins`;

            CryptoZoo.ui?.showToast?.(text);
            return false;
        }

        const resultText = this.applyItemEffect(item);

        if (resultText === "Cooldown" || resultText === "LimitReached") {
            return false;
        }

        this.spendPrice(item);

        if (this.shouldTrackOwnedCount(item)) {
            this.addOwnedCount(item.id, 1);
        }

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

        const buyBoostBtn = document.getElementById("buyBoostBtn");
        if (buyBoostBtn && buyBoostBtn.dataset.bound !== "1") {
            buyBoostBtn.dataset.bound = "1";
            buyBoostBtn.onclick = () => {
                CryptoZoo.audio?.play?.("click");

                const gems = Math.max(0, Number(CryptoZoo.state?.gems) || 0);

                if (CryptoZoo.boostSystem?.isActive?.()) {
                    const left = CryptoZoo.boostSystem?.getTimeLeft?.() || 0;
                    CryptoZoo.ui?.showToast?.(
                        `Boost aktywny: ${CryptoZoo.ui?.formatTimeLeft?.(left) || left}`
                    );
                    return;
                }

                if (gems < 1) {
                    CryptoZoo.ui?.showToast?.("Potrzebujesz 1 gema");
                    return;
                }

                CryptoZoo.state.gems = gems - 1;
                CryptoZoo.state.lastLogin = Date.now();

                CryptoZoo.boostSystem?.activate?.();
                CryptoZoo.ui?.render?.();
                CryptoZoo.api?.savePlayer?.();
            };
        }
    }
};