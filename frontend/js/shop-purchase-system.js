window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.shopSystem = {
    getItemById(itemId) {
        const items = CryptoZoo.config?.shopItems || [];
        return items.find((item) => item.id === itemId) || null;
    },

    ensurePurchaseState() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.shopPurchases = CryptoZoo.state.shopPurchases || {};
        CryptoZoo.state.minigames = CryptoZoo.state.minigames || {};
        CryptoZoo.state.expeditionStats = CryptoZoo.state.expeditionStats || {
            rareChanceBonus: 0,
            epicChanceBonus: 0,
            timeReductionSeconds: 0
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

        Object.keys(animals).forEach((type) => {
            animals[type].level = Math.max(1, Number(animals[type]?.level) || 1) + incomeBonus;
        });

        CryptoZoo.gameplay?.recalculateProgress?.();
        return `Zoo income +${CryptoZoo.formatNumber(incomeBonus)} lvl`;
    },

    applyExpeditionRewardUpgrade(item) {
        this.ensurePurchaseState();

        const rareBonus = Math.max(0, Number(item?.rareChanceBonus) || 0);
        const epicBonus = Math.max(0, Number(item?.epicChanceBonus) || 0);

        CryptoZoo.state.expeditionStats.rareChanceBonus =
            Math.max(0, Number(CryptoZoo.state.expeditionStats.rareChanceBonus) || 0) + rareBonus;

        CryptoZoo.state.expeditionStats.epicChanceBonus =
            Math.max(0, Number(CryptoZoo.state.expeditionStats.epicChanceBonus) || 0) + epicBonus;

        if (epicBonus > 0) {
            return "Większa szansa na Epic nagrody";
        }

        if (rareBonus > 0) {
            return "Większa szansa na Rare nagrody";
        }

        const bonus = Math.max(1, Number(item?.expeditionBonus) || 1);
        CryptoZoo.state.expeditionBoost =
            Math.max(0, Number(CryptoZoo.state?.expeditionBoost) || 0) + bonus;

        return `Expedition reward boost +${CryptoZoo.formatNumber(bonus)}`;
    },

    applyExpeditionTimeReduction(item) {
        this.ensurePurchaseState();

        const reductionSeconds = Math.max(0, Number(item?.timeReductionSeconds) || 0);
        if (reductionSeconds <= 0) {
            return "Brak skrócenia czasu";
        }

        const changed = CryptoZoo.expeditions?.addTimeReduction?.(reductionSeconds);

        if (!changed) {
            return "Brak skrócenia czasu";
        }

        return `Ekspedycje krótsze o ${CryptoZoo.ui?.formatDurationLabel?.(reductionSeconds) || `${reductionSeconds}s`}`;
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

    applyExtraSpin(item) {
        this.ensurePurchaseState();

        const count = Math.max(1, Number(item?.spinCount) || 1);

        CryptoZoo.state.minigames.extraWheelSpins =
            Math.max(0, Number(CryptoZoo.state.minigames.extraWheelSpins) || 0) + count;

        if ((Number(CryptoZoo.state.minigames.wheelCooldownUntil) || 0) > 0) {
            CryptoZoo.state.minigames.wheelCooldownUntil = 0;
        }

        CryptoZoo.minigames?.renderCooldowns?.();
        CryptoZoo.minigames?.renderWheelState?.();

        return count > 1
            ? `+${CryptoZoo.formatNumber(count)} extra spins`
            : "+1 extra spin";
    },

    applySkipWheelCooldown() {
        this.ensurePurchaseState();

        CryptoZoo.state.minigames.wheelCooldownUntil = 0;

        CryptoZoo.minigames?.renderCooldowns?.();
        CryptoZoo.minigames?.renderWheelState?.();

        return "Wheel cooldown skipped";
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

        if (effect === "extraspin") {
            return this.applyExtraSpin(item);
        }

        if (effect === "skipwheelcooldown") {
            return this.applySkipWheelCooldown(item);
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