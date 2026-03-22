window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.shopSystem = {
    bindButtons() {
        const list = document.getElementById("shopList");
        if (!list) return;

        list.onclick = (e) => {
            const btn = e.target.closest("[data-shop-id]");
            if (!btn) return;

            const id = btn.getAttribute("data-shop-id");
            this.buy(id);
        };
    },

    getItem(id) {
        return (CryptoZoo.config?.shopItems || []).find(i => i.id === id);
    },

    buy(id) {
        const item = this.getItem(id);
        if (!item) return;

        if (item.price) {
            if ((CryptoZoo.state.coins || 0) < item.price) {
                CryptoZoo.ui?.showToast?.("Za mało coins");
                return;
            }
            CryptoZoo.state.coins -= item.price;
        }

        if (item.gemPrice) {
            if ((CryptoZoo.state.gems || 0) < item.gemPrice) {
                CryptoZoo.ui?.showToast?.("Za mało gemów");
                return;
            }
            CryptoZoo.state.gems -= item.gemPrice;
        }

        this.applyEffect(item);

        CryptoZoo.audio?.play?.("click");
        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        CryptoZoo.ui?.showToast?.(`Kupiono: ${item.name}`);
    },

    applyEffect(item) {
        const state = CryptoZoo.state;

        switch (item.type) {

            case "click":
                state.coinsPerClick =
                    (Number(state.coinsPerClick) || 1) +
                    (Number(item.clickValueBonus) || 0);
                break;

            case "income":
                Object.keys(state.animals || {}).forEach(type => {
                    state.animals[type].level += item.incomeBonus || 1;
                });
                break;

            case "expedition":
                state.expeditionBoost =
                    (Number(state.expeditionBoost) || 0) +
                    (Number(item.expeditionBonus) || 1);
                break;

            case "offline":
                const now = Date.now();
                const duration = item.offlineDurationSeconds * 1000;

                state.offlineBoostActiveUntil = now + duration;
                state.offlineBoostMultiplier = item.offlineMultiplier || 2;
                state.offlineBoost = state.offlineBoostMultiplier;
                break;
        }

        switch (item.effect) {

            case "extraSpin":
                CryptoZoo.state.wheelSpins =
                    (Number(CryptoZoo.state.wheelSpins) || 0) +
                    (item.spinCount || 1);
                break;

            case "skipWheelCooldown":
                CryptoZoo.state.wheelCooldownUntil = 0;
                break;

            case "coinPack":
                CryptoZoo.state.coins += item.coinPackAmount || 0;
                break;

            case "boost2x":
                const now = Date.now();
                CryptoZoo.state.boost2xActiveUntil =
                    now + (item.boostDurationSeconds * 1000);
                break;
        }
    }
};