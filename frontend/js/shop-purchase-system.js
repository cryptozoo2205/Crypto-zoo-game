window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.shopSystem = {
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

    getMaxAnimalLevel() {
        return Math.max(1, Number(CryptoZoo.config?.limits?.maxLevelPerAnimal) || 100);
    },

    shouldTrackOwnedCount(item) {
        const effect = String(item?.effect || "").toLowerCase();
        const type = String(item?.type || "").toLowerCase();

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

    applyExpeditionRewardUpgrade(item) {
        this.ensurePurchaseState();

        const rareBonus = Math.max(0, Number(item?.rareChanceBonus) || 0);
        const epicBonus = Math.max(0, Number(item?.epicChanceBonus) || 0);

        if (rareBonus > 0 || epicBonus > 0) {
            CryptoZoo.state.expeditionStats.rareChanceBonus =
                Math.max(0, Number(CryptoZoo.state.expeditionStats.rareChanceBonus) || 0) + rareBonus;

            CryptoZoo.state.expeditionStats.epicChanceBonus =
                Math.max(0, Number(CryptoZoo.state.expeditionStats.epicChanceBonus) || 0) + epicBonus;

            const parts = [];
            if (rareBonus > 0) parts.push(`+${Math.round(rareBonus * 100)}% Rare`);
            if (epicBonus > 0) parts.push(`+${Math.round(epicBonus * 100)}% Epic`);
            return `Expedition luck ${parts.join(" • ")}`;
        }

        const bonus = Math.max(1, Number(item?.expeditionBonus) || 1);
        CryptoZoo.state.expeditionBoost =
            Math.max(0, Number(CryptoZoo.state?.expeditionBoost) || 0) + bonus;

        return `+15% coins i reward wallet z ekspedycji`;
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

        if (effect === "click") {
            return this.applyClickUpgrade(item);
        }

        if (effect === "income") {
            return this.applyIncomeUpgrade(item);
        }

        if (effect === "expedition") {
            return this.applyExpeditionRewardUpgrade(item);
        }

        if (effect === "expeditiontime") {
            return this.applyExpeditionTimeReduction(item);
        }

        if (effect === "offline") {
            return this.applyOfflineBoost(item);
        }

        if (effect === "coinpack" || effect === "coins") {
            return this.applyCoinPack(item);
        }

        if (effect === "boost2x" || effect === "boost") {
            return this.applyBoost2x(item);
        }

        return item?.name || "Kupiono";
    },

    purchase(itemId) {
        const item = this.getItemById(itemId);

        if (!item) {
            CryptoZoo.ui?.showToast?.("Nie znaleziono przedmiotu");
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

        this.spendPrice(item);

        const resultText = this.applyItemEffect(item);

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