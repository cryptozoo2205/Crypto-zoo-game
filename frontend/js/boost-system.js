window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.boostSystem = {
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

        const boostCostGems = 1;
        const boostDurationMs = 10 * 60 * 1000;

        if (this.isActive()) {
            CryptoZoo.ui?.showToast?.(
                `Boost już aktywny: ${CryptoZoo.ui?.formatTimeLeft?.(this.getTimeLeft()) || "00:00:00"}`
            );
            CryptoZoo.ui?.render?.();
            return true;
        }

        if ((Number(CryptoZoo.state.gems) || 0) < boostCostGems) {
            CryptoZoo.ui?.showToast?.("Za mało gems");
            return false;
        }

        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) - boostCostGems;
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