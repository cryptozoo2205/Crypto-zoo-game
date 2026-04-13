window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.animalsSystem = {
    bindButtons() {
        const animals = CryptoZoo.config?.animals || {};

        Object.keys(animals).forEach((type) => {
            const buyBtn = document.getElementById(`buy-${type}-btn`);
            const upgradeBtn = document.getElementById(`upgrade-${type}-btn`);

            if (buyBtn) {
                buyBtn.onclick = async () => {
                    CryptoZoo.audio?.play?.("click");
                    await this.buy(type);
                };
            }

            if (upgradeBtn) {
                upgradeBtn.onclick = async () => {
                    CryptoZoo.audio?.play?.("click");
                    await this.upgrade(type);
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

        return baseUnlockLevel + Math.floor((safeAnimalLevel - 1) * 0.75);
    },

    getBuyGrowth(type) {
        const tierIndex = this.getAnimalTierIndex(type);

        const growthByTier = [
            1.55,
            1.54,
            1.53,
            1.52,
            1.51,
            1.50,
            1.49,
            1.48,
            1.47,
            1.465,
            1.46,
            1.455,
            1.45
        ];

        return growthByTier[tierIndex] || 1.35;
    },

    getBuyCost(type) {
        const config = CryptoZoo.config?.animals?.[type];
        const animal = this.ensureAnimalState(type);

        if (!config || !animal) return 0;

        const baseCost = Math.max(1, Math.floor(Number(config.buyCost) || 1));
        const ownedCount = Math.max(0, Math.floor(Number(animal.count) || 0));
        const growth = this.getBuyGrowth(type);

        let cost = baseCost * Math.pow(growth, ownedCount);

        if (ownedCount > 10) {
            cost *= 1 + ((ownedCount - 10) * 0.15);
        }

        if (type === "monkey" && ownedCount > 15) {
            cost *= 1 + ((ownedCount - 15) * 0.35);
        }

        return Math.floor(cost);
    },

    async saveNow() {
        
        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.gameplay?.requestRender?.(true);

        try {
            await CryptoZoo.api?.flushSave?.(true);
        } catch (error) {
            console.error("Immediate animal save failed:", error);
        }
    },

    async buy(type) {
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
        animal.count += 1;

        await this.saveNow();

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

        let cost =
            baseCost *
            Math.pow(1.65, level - 1) *
            (1 + count * 0.08) *
            (1 + tierIndex * 0.18);

        if (level > 10) {
            cost *= Math.pow(1.4, level - 10);
        }

        return Math.floor(cost);
    },

    async upgrade(type) {
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
        animal.level += 1;

        await this.saveNow();

        const animalName = this.getLocalizedAnimalName(type, config);
        CryptoZoo.ui?.showToast?.(
            `Ulepszono ${animalName} • -${CryptoZoo.formatNumber(cost)}`
        );

        return true;
    }
};
