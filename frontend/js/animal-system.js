window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.animalsSystem = {
    bindButtons() {
        const animals = CryptoZoo.config?.animals || {};

        Object.keys(animals).forEach((type) => {
            const buyBtn = document.getElementById(`buy-${type}-btn`);
            const upgradeBtn = document.getElementById(`upgrade-${type}-btn`);

            if (buyBtn) {
                buyBtn.onclick = () => {
                    CryptoZoo.audio?.play?.("click");
                    this.buy(type);
                };
            }

            if (upgradeBtn) {
                upgradeBtn.onclick = () => {
                    CryptoZoo.audio?.play?.("click");
                    this.upgrade(type);
                };
            }
        });
    },

    ensureAnimalState(type) {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.animals = CryptoZoo.state.animals || {};

        if (!CryptoZoo.state.animals[type] || typeof CryptoZoo.state.animals[type] !== "object") {
            CryptoZoo.state.animals[type] = { count: 0, level: 1 };
        }

        CryptoZoo.state.animals[type].count = Math.max(
            0,
            Math.floor(Number(CryptoZoo.state.animals[type].count) || 0)
        );

        CryptoZoo.state.animals[type].level = Math.max(
            1,
            Math.floor(Number(CryptoZoo.state.animals[type].level) || 1)
        );

        return CryptoZoo.state.animals[type];
    },

    getMaxOwned() {
        return Math.max(
            1,
            Math.floor(Number(CryptoZoo.config?.limits?.maxOwnedPerAnimal) || 50)
        );
    },

    getMaxLevel() {
        return Math.max(
            1,
            Math.floor(Number(CryptoZoo.config?.limits?.maxLevelPerAnimal) || 100)
        );
    },

    getLocalizedAnimalName(type, config) {
        return (
            CryptoZoo.ui?.getLocalizedAnimalName?.(type, config) ||
            config?.namePl ||
            config?.nameEn ||
            config?.name ||
            String(type || "")
        );
    },

    buy(type) {
        const config = CryptoZoo.config?.animals?.[type];
        if (!config) return false;

        const animal = this.ensureAnimalState(type);
        const maxOwned = this.getMaxOwned();

        if (animal.count >= maxOwned) {
            CryptoZoo.ui?.showToast?.("Osiągnięto limit zwierząt");
            return false;
        }

        const buyCost = Math.max(0, Math.floor(Number(config.buyCost) || 0));
        const currentCoins = Math.max(0, Number(CryptoZoo.state?.coins) || 0);

        if (currentCoins < buyCost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return false;
        }

        CryptoZoo.state.coins = Math.max(0, currentCoins - buyCost);
        animal.count = Math.min(maxOwned, animal.count + 1);
        CryptoZoo.state.lastLogin = Date.now();

        CryptoZoo.dailyMissions?.recordSpendCoins?.(buyCost);

        CryptoZoo.gameplay?.persistAndRender?.();

        const animalName = this.getLocalizedAnimalName(type, config);
        CryptoZoo.ui?.showToast?.(`Kupiono ${animalName}`);

        return true;
    },

    getUpgradeCost(type) {
        const config = CryptoZoo.config?.animals?.[type];
        const animal = this.ensureAnimalState(type);

        if (!config || !animal) return 0;

        const buyCost = Math.max(1, Number(config.buyCost) || 1);
        const level = Math.max(1, Math.floor(Number(animal.level) || 1));
        const count = Math.max(0, Math.floor(Number(animal.count) || 0));

        const levelMultiplier = Math.pow(1.45, level - 1);

        const ownershipDiscount =
            count >= 50 ? 0.90 :
            count >= 25 ? 0.94 :
            count >= 10 ? 0.97 : 1;

        const rawCost = buyCost * 0.8 * levelMultiplier * ownershipDiscount;
        const safeCost = Math.floor(rawCost);

        if (!Number.isFinite(safeCost) || safeCost < 1) {
            return 1;
        }

        return safeCost;
    },

    upgrade(type) {
        const config = CryptoZoo.config?.animals?.[type];
        if (!config) return false;

        const animal = this.ensureAnimalState(type);

        if (animal.count <= 0) {
            CryptoZoo.ui?.showToast?.("Najpierw kup to zwierzę");
            return false;
        }

        const maxLevel = this.getMaxLevel();

        if (animal.level >= maxLevel) {
            CryptoZoo.ui?.showToast?.("Max level osiągnięty");
            return false;
        }

        const cost = this.getUpgradeCost(type);
        const currentCoins = Math.max(0, Number(CryptoZoo.state?.coins) || 0);

        if (currentCoins < cost) {
            CryptoZoo.ui?.showToast?.("Za mało coins");
            return false;
        }

        CryptoZoo.state.coins = Math.max(0, currentCoins - cost);
        animal.level = Math.min(maxLevel, animal.level + 1);
        CryptoZoo.state.lastLogin = Date.now();

        CryptoZoo.dailyMissions?.recordSpendCoins?.(cost);

        CryptoZoo.gameplay?.persistAndRender?.();

        const animalName = this.getLocalizedAnimalName(type, config);
        CryptoZoo.ui?.showToast?.(`Ulepszono ${animalName}`);

        return true;
    }
};