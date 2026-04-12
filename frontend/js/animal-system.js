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
            Math.floor(Number(CryptoZoo.config?.limits?.maxOwnedPerAnimal) || 20)
        );
    },

    getMaxLevel() {
        return Math.max(
            1,
            Math.floor(Number(CryptoZoo.config?.limits?.maxLevelPerAnimal) || 25)
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

    getAnimalTypesInOrder() {
        return Object.keys(CryptoZoo.config?.animals || {});
    },

    getAnimalTierIndex(type) {
        const orderedTypes = this.getAnimalTypesInOrder();
        const index = orderedTypes.findIndex((item) => item === type);
        return index >= 0 ? index : 0;
    },

    getRequiredPlayerLevel(type) {
        const config = CryptoZoo.config?.animals?.[type];
        return Math.max(1, Math.floor(Number(config?.unlockLevel) || 1));
    },

    getRequiredPlayerLevelForUpgrade(type, currentAnimalLevel = 1) {
        const baseUnlockLevel = this.getRequiredPlayerLevel(type);
        const safeAnimalLevel = Math.max(1, Math.floor(Number(currentAnimalLevel) || 1));
        return baseUnlockLevel + Math.floor((safeAnimalLevel - 1) / 2);
    },

    getBuyGrowth(type) {
        const tierIndex = this.getAnimalTierIndex(type);

        const growthByTier = [
            1.32,  // monkey
            1.31,  // panda
            1.30,  // lion
            1.29,  // tiger
            1.28,  // elephant
            1.27,  // giraffe
            1.26,  // zebra
            1.25,  // hippo
            1.24,  // penguin
            1.235, // bear
            1.23,  // crocodile
            1.225, // kangaroo
            1.22   // wolf
        ];

        if (tierIndex < growthByTier.length) {
            return growthByTier[tierIndex];
        }

        return 1.24;
    },

    getBuyCost(type) {
        const config = CryptoZoo.config?.animals?.[type];
        const animal = this.ensureAnimalState(type);

        if (!config || !animal) return 0;

        const baseCost = Math.max(1, Math.floor(Number(config.buyCost) || 1));
        const ownedCount = Math.max(0, Math.floor(Number(animal.count) || 0));
        const growth = this.getBuyGrowth(type);

        const rawCost = baseCost * Math.pow(growth, ownedCount);
        const safeCost = Math.floor(rawCost);

        if (!Number.isFinite(safeCost) || safeCost < 1) {
            return 1;
        }

        return safeCost;
    },

    buy(type) {
        const config = CryptoZoo.config?.animals?.[type];
        if (!config) return false;

        const animal = this.ensureAnimalState(type);
        const maxOwned = this.getMaxOwned();
        const playerLevel = Math.max(1, Math.floor(Number(CryptoZoo.state?.level) || 1));
        const requiredLevel = this.getRequiredPlayerLevel(type);

        if (playerLevel < requiredLevel) {
            CryptoZoo.ui?.showToast?.(`Wymagany lvl ${requiredLevel}`);
            return false;
        }

        if (animal.count >= maxOwned) {
            CryptoZoo.ui?.showToast?.("Osiągnięto limit zwierząt");
            return false;
        }

        const buyCost = this.getBuyCost(type);
        const currentCoins = Math.max(0, Number(CryptoZoo.state?.coins) || 0);

        if (currentCoins < buyCost) {
            CryptoZoo.ui?.showToast?.(
                `Za mało coins • ${CryptoZoo.formatNumber(buyCost)}`
            );
            return false;
        }

        CryptoZoo.state.coins = Math.max(0, currentCoins - buyCost);
        animal.count = Math.min(maxOwned, animal.count + 1);
        CryptoZoo.state.lastLogin = Date.now();

        CryptoZoo.dailyMissions?.recordSpendCoins?.(buyCost);

        CryptoZoo.gameplay?.persistAndRender?.();

        const animalName = this.getLocalizedAnimalName(type, config);
        CryptoZoo.ui?.showToast?.(
            `Kupiono ${animalName} • -${CryptoZoo.formatNumber(buyCost)}`
        );

        return true;
    },

    getUpgradeCost(type) {
        const config = CryptoZoo.config?.animals?.[type];
        const animal = this.ensureAnimalState(type);

        if (!config || !animal) return 0;

        const baseCost = Math.max(1, Math.floor(Number(config.buyCost) || 1));
        const level = Math.max(1, Math.floor(Number(animal.level) || 1));
        const count = Math.max(0, Math.floor(Number(animal.count) || 0));
        const tierIndex = this.getAnimalTierIndex(type);

        const levelMultiplier = Math.pow(1.65, level - 1);
        const countMultiplier = 1 + (count * 0.045);
        const tierMultiplier = 1 + (tierIndex * 0.12);

        const rawCost = baseCost * 0.95 * levelMultiplier * countMultiplier * tierMultiplier;
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

        const playerLevel = Math.max(1, Math.floor(Number(CryptoZoo.state?.level) || 1));
        const requiredPlayerLevel = this.getRequiredPlayerLevelForUpgrade(type, animal.level);

        if (playerLevel < requiredPlayerLevel) {
            CryptoZoo.ui?.showToast?.(`Wymagany lvl ${requiredPlayerLevel}`);
            return false;
        }

        const cost = this.getUpgradeCost(type);
        const currentCoins = Math.max(0, Number(CryptoZoo.state?.coins) || 0);

        if (currentCoins < cost) {
            CryptoZoo.ui?.showToast?.(
                `Za mało coins • ${CryptoZoo.formatNumber(cost)}`
            );
            return false;
        }

        CryptoZoo.state.coins = Math.max(0, currentCoins - cost);
        animal.level = Math.min(maxLevel, animal.level + 1);
        CryptoZoo.state.lastLogin = Date.now();

        CryptoZoo.dailyMissions?.recordSpendCoins?.(cost);

        CryptoZoo.gameplay?.persistAndRender?.();

        const animalName = this.getLocalizedAnimalName(type, config);
        CryptoZoo.ui?.showToast?.(
            `Ulepszono ${animalName} • -${CryptoZoo.formatNumber(cost)}`
        );

        return true;
    }
};