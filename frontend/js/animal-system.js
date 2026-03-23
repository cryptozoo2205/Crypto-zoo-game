window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.animalsSystem = {
    bindButtons() {
        const animals = CryptoZoo.config?.animals || {};

        Object.keys(animals).forEach((type) => {
            const buyBtn = document.getElementById(`buy-${type}-btn`);
            const upgradeBtn = document.getElementById(`upgrade-${type}-btn`);

            if (buyBtn) {
                buyBtn.onclick = () => this.buy(type);
            }

            if (upgradeBtn) {
                upgradeBtn.onclick = () => this.upgrade(type);
            }
        });
    },

    buy(type) {
        const config = CryptoZoo.config?.animals?.[type];
        if (!config) return false;

        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.animals = CryptoZoo.state.animals || {};

        const buyCost = Math.max(0, Number(config.buyCost) || 0);

        if ((Number(CryptoZoo.state?.coins) || 0) < buyCost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return false;
        }

        if (!CryptoZoo.state.animals[type]) {
            CryptoZoo.state.animals[type] = { count: 0, level: 1 };
        }

        CryptoZoo.state.coins = Math.max(
            0,
            (Number(CryptoZoo.state.coins) || 0) - buyCost
        );

        CryptoZoo.state.animals[type].count =
            Math.max(0, Number(CryptoZoo.state.animals[type].count) || 0) + 1;

        CryptoZoo.gameplay?.persistAndRender?.();
        CryptoZoo.ui?.showToast?.(`Kupiono ${config.name}`);

        return true;
    },

    getUpgradeCost(type) {
        const config = CryptoZoo.config?.animals?.[type];
        const animal = CryptoZoo.state?.animals?.[type];

        if (!config || !animal) return 0;

        const buyCost = Math.max(1, Number(config.buyCost) || 1);
        const level = Math.max(1, Number(animal.level) || 1);
        const count = Math.max(0, Number(animal.count) || 0);

        const levelMultiplier = Math.pow(1.62, level - 1);
        const ownershipDiscount = count >= 25 ? 0.94 : count >= 10 ? 0.97 : 1;

        const rawCost = buyCost * 0.9 * levelMultiplier * ownershipDiscount;
        return Math.max(1, Math.floor(rawCost));
    },

    upgrade(type) {
        const config = CryptoZoo.config?.animals?.[type];
        const animal = CryptoZoo.state?.animals?.[type];

        if (!config || !animal) return false;

        if ((Number(animal.count) || 0) <= 0) {
            CryptoZoo.ui?.showToast?.("Najpierw kup to zwierzę");
            return false;
        }

        const cost = this.getUpgradeCost(type);

        if ((Number(CryptoZoo.state?.coins) || 0) < cost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return false;
        }

        CryptoZoo.state.coins = Math.max(
            0,
            (Number(CryptoZoo.state.coins) || 0) - cost
        );

        animal.level = Math.max(1, Number(animal.level) || 1) + 1;

        CryptoZoo.gameplay?.persistAndRender?.();
        CryptoZoo.ui?.showToast?.(`Ulepszono ${config.name}`);

        return true;
    }
};