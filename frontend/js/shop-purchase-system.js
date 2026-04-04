window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.shopSystem = {
    DAILY_EXPEDITION_BOOST_COOLDOWN: 24 * 60 * 60 * 1000,
    DAILY_EXPEDITION_BOOST_VALUE: 0.25,

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

        CryptoZoo.state.expeditionStats.timeBoostCharges =
            CryptoZoo.state.expeditionStats.timeBoostCharges || [];
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

        const coinPrice = Math.max(0, Number(item.price) || 0);

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
            CryptoZoo.state.gems -= meta.amount;
            return;
        }

        CryptoZoo.state.coins -= meta.amount;
    },

    applyItemEffect(item) {
        const effect = String(item?.effect || item?.type || "").toLowerCase();

        if (effect === "click") {
            CryptoZoo.state.coinsPerClick += Number(item.clickValueBonus) || 1;
            return;
        }

        if (effect === "income") {
            const animals = CryptoZoo.state.animals || {};
            Object.values(animals).forEach((a) => {
                a.level += Number(item.incomeBonus) || 1;
            });
            return;
        }

        if (effect === "expeditiontime") {
            const seconds = Number(item.timeReductionSeconds) || 0;
            CryptoZoo.expeditions?.addTimeBoostCharge?.(seconds);
            return;
        }

        if (effect === "coinpack") {
            CryptoZoo.state.coins += Number(item.coinPackAmount) || 0;
            return;
        }
    },

    purchase(itemId) {
        const item = this.getItemById(itemId);

        if (!item) {
            CryptoZoo.ui?.showToast?.("Nie znaleziono przedmiotu");
            return false;
        }

        if (!this.canAfford(item)) {
            CryptoZoo.ui?.showToast?.("Brak środków");
            return false;
        }

        this.applyItemEffect(item);
        this.spendPrice(item);

        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

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

        // 🔥 X2 BOOST (TU ZMIANA NA 3 GEMY)
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

                if (gems < 3) {
                    CryptoZoo.ui?.showToast?.("Potrzebujesz 3 gemy");
                    return;
                }

                CryptoZoo.state.gems = gems - 3;
                CryptoZoo.state.lastLogin = Date.now();

                CryptoZoo.boostSystem?.activate?.();
                CryptoZoo.ui?.render?.();
                CryptoZoo.api?.savePlayer?.();
            };
        }
    }
};