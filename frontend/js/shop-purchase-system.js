window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.shopSystem = {
    bindButtons() {
        const items = CryptoZoo.config?.shopItems || [];

        items.forEach((item) => {
            const btn = document.getElementById(`buy-shop-${item.id}`);
            if (btn) {
                btn.onclick = () => this.buy(item.id);
            }
        });
    },

    buy(itemId) {
        const item = (CryptoZoo.config?.shopItems || []).find((x) => x.id === itemId);
        if (!item) return false;

        CryptoZoo.state = CryptoZoo.state || {};

        const coinPrice = Math.max(0, Number(item.price) || 0);
        const gemPrice = Math.max(0, Number(item.gemPrice) || 0);

        const coinsBeforeSpend = Number(CryptoZoo.state.coins) || 0;
        const gemsBeforeSpend = Number(CryptoZoo.state.gems) || 0;

        const isGemPurchase = gemPrice > 0;
        const spendAmountForLevelDrop = isGemPurchase ? 0 : coinPrice;

        if (isGemPurchase) {
            if (gemsBeforeSpend < gemPrice) {
                CryptoZoo.ui?.showToast?.("Za mało gems");
                return false;
            }

            CryptoZoo.state.gems = gemsBeforeSpend - gemPrice;
        } else {
            if (coinsBeforeSpend < coinPrice) {
                CryptoZoo.ui?.showToast?.("Za mało coins");
                return false;
            }

            CryptoZoo.state.coins = coinsBeforeSpend - coinPrice;
        }

        if (item.type === "click") {
            const bonus = Math.max(1, Number(item.clickValueBonus) || 1);
            CryptoZoo.state.coinsPerClick =
                (Number(CryptoZoo.state.coinsPerClick) || 1) + bonus;
        }

        if (item.type === "income") {
            const currentIncome = Number(CryptoZoo.state.zooIncome) || 0;
            CryptoZoo.state.zooIncome = Math.max(1, Math.floor(currentIncome * 1.25));
        }

        if (item.type === "expedition") {
            CryptoZoo.state.expeditionBoost =
                (Number(CryptoZoo.state.expeditionBoost) || 0) + 0.2;
        }

        if (item.type === "offline") {
            const multiplier = Math.max(1, Number(item.offlineMultiplier) || 2);
            const durationSeconds = Math.max(60, Number(item.offlineDurationSeconds) || 10 * 60);

            CryptoZoo.gameplay?.activateOfflineBoost?.(multiplier, durationSeconds);
        }

        CryptoZoo.gameplay?.applyLevelDropBySpend?.(spendAmountForLevelDrop, coinsBeforeSpend);
        CryptoZoo.gameplay?.persistAndRender?.();

        if (item.type === "offline") {
            const multiplier = Math.max(1, Number(item.offlineMultiplier) || 2);
            const durationSeconds = Math.max(60, Number(item.offlineDurationSeconds) || 10 * 60);

            if (isGemPurchase) {
                CryptoZoo.ui?.showToast?.(
                    `Kupiono ${item.name} • ${CryptoZoo.formatNumber(gemPrice)} gem • x${CryptoZoo.formatNumber(multiplier)} offline ${CryptoZoo.gameplay?.formatOfflineDuration?.(durationSeconds) || durationSeconds + "s"}`
                );
            } else {
                CryptoZoo.ui?.showToast?.(
                    `Kupiono ${item.name} • x${CryptoZoo.formatNumber(multiplier)} offline ${CryptoZoo.gameplay?.formatOfflineDuration?.(durationSeconds) || durationSeconds + "s"}`
                );
            }

            return true;
        }

        if (isGemPurchase) {
            CryptoZoo.ui?.showToast?.(
                `Kupiono ${item.name} za ${CryptoZoo.formatNumber(gemPrice)} gem`
            );
            return true;
        }

        CryptoZoo.ui?.showToast?.(`Kupiono ${item.name}`);
        return true;
    }
};