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

        // Lżejszy, grywalny scaling zamiast brutalnego 1.62^lvl
        let growth = 1.18;

        if (buyCost >= 1000) growth = 1.185;
        if (buyCost >= 10000) growth = 1.19;
        if (buyCost >= 100000) growth = 1.195;
        if (buyCost >= 1000000) growth = 1.20;

        // Delikatne podbicie dopiero na wyższych poziomach
        if (level >= 10) growth += 0.005;
        if (level >= 25) growth += 0.005;
        if (level >= 50) growth += 0.005;

        // Im więcej sztuk masz, tym upgrade trochę przyjaźniejszy
        let ownershipDiscount = 1;
        if (count >= 5) ownershipDiscount = 0.98;
        if (count >= 10) ownershipDiscount = 0.95;
        if (count >= 25) ownershipDiscount = 0.92;
        if (count >= 50) ownershipDiscount = 0.90;

        const baseUpgradeCost = buyCost * 0.35;
        const rawCost = baseUpgradeCost * Math.pow(growth, level - 1) * ownershipDiscount;

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