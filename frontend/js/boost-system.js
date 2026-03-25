window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.boostSystem = {
    getBoostShopItem() {
        const items = CryptoZoo.config?.shopItems || [];
        return items.find((item) => {
            const effect = String(item?.effect || "").toLowerCase();
            const type = String(item?.type || "").toLowerCase();

            return effect === "boost2x" || effect === "boost" || type === "boost2x";
        }) || null;
    },

    getBoostCostGems() {
        const shopItem = this.getBoostShopItem();
        const configCost = Math.max(0, Number(shopItem?.gemPrice) || 0);

        if (configCost > 0) {
            return configCost;
        }

        return 1;
    },

    getBoostDurationMs() {
        const shopItem = this.getBoostShopItem();
        const configSeconds = Math.max(0, Number(shopItem?.boostDurationSeconds) || 0);

        if (configSeconds > 0) {
            return configSeconds * 1000;
        }

        return 10 * 60 * 1000;
    },

    isActive() {
        CryptoZoo.gameplay?.normalizeBoostState?.();
        return (Number(CryptoZoo.state?.boost2xActiveUntil) || 0) > Date.now();
    },

    getMultiplier() {
        return this.isActive() ? 2 : 1;
    },

    getTimeLeft() {
        CryptoZoo.gameplay?.normalizeBoostState?.();

        return Math.max(
            0,
            Math.floor(
                ((Number(CryptoZoo.state?.boost2xActiveUntil) || 0) - Date.now()) / 1000
            )
        );
    },

    activate() {
        CryptoZoo.state = CryptoZoo.state || {};

        const boostCostGems = this.getBoostCostGems();
        const boostDurationMs = this.getBoostDurationMs();

        if (this.isActive()) {
            CryptoZoo.ui?.showToast?.(
                `Boost już aktywny: ${CryptoZoo.ui?.formatTimeLeft?.(this.getTimeLeft()) || "00:00:00"}`
            );
            CryptoZoo.ui?.render?.();
            return true;
        }

        if ((Number(CryptoZoo.state.gems) || 0) < boostCostGems) {
            CryptoZoo.ui?.showToast?.(`Potrzebujesz ${CryptoZoo.formatNumber(boostCostGems)} gem`);
            return false;
        }

        CryptoZoo.state.gems = Math.max(
            0,
            (Number(CryptoZoo.state.gems) || 0) - boostCostGems
        );

        CryptoZoo.state.boost2xActiveUntil = Date.now() + boostDurationMs;

        CryptoZoo.gameplay?.persistAndRender?.();
        CryptoZoo.ui?.showToast?.("X2 Boost aktywowany");

        return true;
    },

    bindShopButton() {
        const btn = document.getElementById("buyBoostBtn");
        if (!btn) return false;

        btn.onclick = () => {
            const activated = this.activate();

            if (activated) {
                CryptoZoo.gameplay?.showScreen?.("game");
            }
        };

        return true;
    }
};