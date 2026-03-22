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
        return 1 + boostLevel * 0.15; // 🔧 nerf z 0.2 → 0.15
    },

    rollRewardRarity(expedition) {
        const rareChance = Math.max(0, Number(expedition?.rareChance) || 0);
        const epicChance = Math.max(0, Number(expedition?.epicChance) || 0);

        const roll = Math.random();

        if (roll < epicChance) return "epic";
        if (roll < epicChance + rareChance) return "rare";
        return "common";
    },

    // 🔥 KLUCZOWY BALANS REWARD BALANCE
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

        // 🔧 NOWY BALANS (wolniejszy, stabilny)
        let base = 0.015 + hours * 0.045;

        const rarity = expedition.rewardRarity || "common";

        let rarityMultiplier = 1;
        if (rarity === "rare") rarityMultiplier = 1.6;
        if (rarity === "epic") rarityMultiplier = 2.6;

        const boost = this.getExpeditionBoostMultiplier();

        let reward = base * rarityMultiplier * boost;

        // 🔒 HARD CAP (ważne!)
        reward = Math.min(reward, 1.25);

        return Number(reward.toFixed(3));
    },

    getCoinsReward(expeditionConfig, rarity) {
        const baseCoins = Math.max(0, Number(expeditionConfig?.baseCoins) || 0);
        const boost = this.getExpeditionBoostMultiplier();

        let mult = 1;
        if (rarity === "rare") mult = 1.4;
        if (rarity === "epic") mult = 2;

        return Math.floor(baseCoins * mult * boost);
    },

    // 🔥 GEM BALANS (ważne)
    getGemsReward(expeditionConfig, rarity) {
        const base = Math.max(0, Number(expeditionConfig?.baseGems) || 0);
        const boost = this.getExpeditionBoostMultiplier();

        let gems = Math.floor(base * boost);

        if (rarity === "rare") gems += 1;
        if (rarity === "epic") gems += 2;

        // 🔒 LIMIT żeby nie spamować gemów
        return Math.min(gems, 5);
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

        const now = Date.now();
        const rarity = this.rollRewardRarity(expeditionConfig);

        const coins = this.getCoinsReward(expeditionConfig, rarity);
        const gems = this.getGemsReward(expeditionConfig, rarity);

        CryptoZoo.state.expedition = {
            id: expeditionConfig.id,
            name: expeditionConfig.name,
            startTime: now,
            endTime: now + Math.max(1, Number(expeditionConfig.duration) || 0) * 1000,
            rewardRarity: rarity,
            rewardCoins: coins,
            rewardGems: gems
        };

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
        const reward = this.getRewardBalanceAmount(expedition);

        CryptoZoo.state.coins += coins;
        CryptoZoo.state.gems += gems;
        CryptoZoo.state.rewardBalance =
            Number(((Number(CryptoZoo.state.rewardBalance) || 0) + reward).toFixed(3));

        CryptoZoo.state.expedition = null;

        CryptoZoo.audio?.play?.("win");
        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        const text = [
            `+${CryptoZoo.formatNumber(coins)} coins`,
            gems > 0 ? `+${gems} gem` : "",
            reward > 0 ? `+${reward.toFixed(3)} reward` : ""
        ].filter(Boolean).join(" • ");

        CryptoZoo.ui?.showToast?.(`🎁 Expedition complete • ${text}`);

        return true;
    }
};