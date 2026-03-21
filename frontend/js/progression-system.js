window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.progression = {
    applyLevelDropBySpend(spentAmount, coinsBeforeSpend) {
        CryptoZoo.state = CryptoZoo.state || {};

        const spent = Number(spentAmount) || 0;
        const before = Number(coinsBeforeSpend) || 0;

        if (spent <= 0 || before <= 0) return;

        const spendRatio = spent / before;
        let levelLoss = 0;

        if (spendRatio > 0.60) {
            levelLoss = 3;
        } else if (spendRatio > 0.30) {
            levelLoss = 2;
        } else if (spendRatio > 0.10) {
            levelLoss = 1;
        }

        if (levelLoss > 0) {
            CryptoZoo.state.level = Math.max(
                1,
                (Number(CryptoZoo.state.level) || 1) - levelLoss
            );
        }

        CryptoZoo.state.xp = Math.floor((Number(CryptoZoo.state.xp) || 0) * 0.7);
    },

    recalculateZooIncome() {
        CryptoZoo.state = CryptoZoo.state || {};

        const animals = CryptoZoo.config?.animals || {};
        const stateAnimals = CryptoZoo.state?.animals || {};

        let total = 0;

        Object.keys(animals).forEach((type) => {
            const config = animals[type];
            const animal = stateAnimals[type] || { count: 0, level: 1 };

            total +=
                (Number(animal.count) || 0) *
                (Number(animal.level) || 1) *
                (Number(config.baseIncome) || 0);
        });

        CryptoZoo.state.zooIncome = total;
        return total;
    },

    recalculateLevel() {
        CryptoZoo.state = CryptoZoo.state || {};

        const xp = Number(CryptoZoo.state.xp) || 0;

        let level = 1;
        let requiredXp = 100;
        let spentXp = 0;

        while (xp >= spentXp + requiredXp) {
            spentXp += requiredXp;
            level += 1;
            requiredXp += 100;
        }

        CryptoZoo.state.level = Math.max(Number(CryptoZoo.state.level) || 1, level);
        return CryptoZoo.state.level;
    },

    recalculateProgress() {
        this.recalculateZooIncome();
        this.recalculateLevel();
        CryptoZoo.gameplay?.normalizeBoostState?.();
        CryptoZoo.gameplay?.normalizeOfflineBoostState?.();
    }
};