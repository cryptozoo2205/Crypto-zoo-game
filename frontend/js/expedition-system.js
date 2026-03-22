window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.expeditions = {
    getAll() {
        return Array.isArray(CryptoZoo.config?.expeditions)
            ? CryptoZoo.config.expeditions
            : [];
    },

    getById(id) {
        return this.getAll().find((exp) => exp.id === id) || null;
    },

    getUnlockRequirement(expedition) {
        if (!expedition) return 1;
        return Math.max(1, Number(expedition.unlockLevel) || 1);
    },

    isUnlocked(expedition) {
        const requiredLevel = this.getUnlockRequirement(expedition);
        const playerLevel = Math.max(1, Number(CryptoZoo.state?.level) || 1);
        return playerLevel >= requiredLevel;
    },

    hasActiveExpedition() {
        return !!CryptoZoo.state?.expedition;
    },

    getExpeditionBoostMultiplier() {
        const boostLevel = Math.max(0, Number(CryptoZoo.state?.expeditionBoost) || 0);
        return 1 + boostLevel * 0.15;
    },

    rollRewardRarity(expedition) {
        const rareChance = Math.max(0, Number(expedition?.rareChance) || 0);
        const epicChance = Math.max(0, Number(expedition?.epicChance) || 0);
        const roll = Math.random();

        if (roll < epicChance) return "epic";
        if (roll < epicChance + rareChance) return "rare";
        return "common";
    },

    getRewardBalanceAmount(expedition) {
        if (!expedition) return 0;

        const durationMs = Math.max(
            0,
            Number(expedition.endTime || 0) - Number(expedition.startTime || 0)
        );

        const durationSeconds = Math.max(
            60,
            Math.floor(durationMs > 0 ? durationMs / 1000 : Number(expedition.duration) || 0)
        );

        const hours = durationSeconds / 3600;

        let base = 0.015 + hours * 0.045;

        const rarity = String(expedition.rewardRarity || "common");
        let rarityMultiplier = 1;

        if (rarity === "rare") rarityMultiplier = 1.6;
        if (rarity === "epic") rarityMultiplier = 2.6;

        const boostMultiplier = this.getExpeditionBoostMultiplier();

        let reward = base * rarityMultiplier * boostMultiplier;

        reward = Math.min(reward, 1.25);

        return Number(reward.toFixed(3));
    },

    getCoinsReward(expeditionConfig, rewardRarity) {
        const baseCoins = Math.max(0, Number(expeditionConfig?.baseCoins) || 0);
        const boostMultiplier = this.getExpeditionBoostMultiplier();

        let rarityMultiplier = 1;
        if (rewardRarity === "rare") rarityMultiplier = 1.4;
        if (rewardRarity === "epic") rarityMultiplier = 2.0;

        return Math.floor(baseCoins * rarityMultiplier * boostMultiplier);
    },

    getGemsReward(expeditionConfig, rewardRarity) {
        const baseGems = Math.max(0, Number(expeditionConfig?.baseGems) || 0);
        const boostMultiplier = this.getExpeditionBoostMultiplier();

        let gems = Math.floor(baseGems * boostMultiplier);

        if (rewardRarity === "rare") gems += 1;
        if (rewardRarity === "epic") gems += 2;

        return Math.min(gems, 5);
    },

    buildActiveExpedition(expeditionConfig) {
        const now = Date.now();
        const rewardRarity = this.rollRewardRarity(expeditionConfig);
        const rewardCoins = this.getCoinsReward(expeditionConfig, rewardRarity);
        const rewardGems = this.getGemsReward(expeditionConfig, rewardRarity);

        return {
            id: expeditionConfig.id,
            name: expeditionConfig.name,
            startTime: now,
            endTime: now + Math.max(1, Number(expeditionConfig.duration) || 0) * 1000,
            rewardRarity,
            rewardCoins,
            rewardGems
        };
    },

    start(expeditionId) {
        CryptoZoo.state = CryptoZoo.state || {};

        if (this.hasActiveExpedition()) {
            CryptoZoo.ui?.showToast?.("Masz już aktywną ekspedycję");
            return false;
        }

        const expeditionConfig = this.getById(expeditionId);
        if (!expeditionConfig) {
            CryptoZoo.ui?.showToast?.("Nie znaleziono ekspedycji");
            return false;
        }

        if (!this.isUnlocked(expeditionConfig)) {
            const requiredLevel = this.getUnlockRequirement(expeditionConfig);
            CryptoZoo.ui?.showToast?.(`Wymagany poziom: ${CryptoZoo.formatNumber(requiredLevel)}`);
            return false;
        }

        CryptoZoo.state.expedition = this.buildActiveExpedition(expeditionConfig);

        CryptoZoo.audio?.play?.("click");
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.(`🌍 Start: ${expeditionConfig.name}`);

        return true;
    },

    canCollect() {
        const expedition = CryptoZoo.state?.expedition;
        if (!expedition) return false;

        return Date.now() >= Math.max(0, Number(expedition.endTime) || 0);
    },

    collect() {
        CryptoZoo.state = CryptoZoo.state || {};

        const expedition = CryptoZoo.state.expedition;
        if (!expedition) {
            CryptoZoo.ui?.showToast?.("Brak aktywnej ekspedycji");
            return false;
        }

        if (!this.canCollect()) {
            CryptoZoo.ui?.showToast?.("Ekspedycja jeszcze trwa");
            return false;
        }

        const coins = Math.max(0, Number(expedition.rewardCoins) || 0);
        const gems = Math.max(0, Number(expedition.rewardGems) || 0);
        const rewardBalance = this.getRewardBalanceAmount(expedition);

        CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + coins;
        CryptoZoo.state.gems = (Number(CryptoZoo.state.gems) || 0) + gems;
        CryptoZoo.state.rewardBalance = Number(
            ((Number(CryptoZoo.state.rewardBalance) || 0) + rewardBalance).toFixed(3)
        );

        CryptoZoo.state.expedition = null;

        CryptoZoo.audio?.play?.("win");
        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        const rewardText = [
            `+${CryptoZoo.formatNumber(coins)} coins`,
            gems > 0 ? `+${CryptoZoo.formatNumber(gems)} gem` : "",
            rewardBalance > 0 ? `+${rewardBalance.toFixed(3)} reward` : ""
        ].filter(Boolean).join(" • ");

        CryptoZoo.ui?.showToast?.(`🎁 Expedition complete • ${rewardText}`);
        return true;
    }
};