window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.expeditions = {
    getAll() {
        return Array.isArray(CryptoZoo.config?.expeditions)
            ? CryptoZoo.config.expeditions
            : [];
    },

    getById(id) {
        return this.getAll().find((exp) => String(exp.id) === String(id)) || null;
    },

    ensureExpeditionStats() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.expeditionStats = CryptoZoo.state.expeditionStats || {
            rareChanceBonus: 0,
            epicChanceBonus: 0,
            timeReductionSeconds: 0,
            timeBoostCharges: []
        };

        CryptoZoo.state.expeditionStats.rareChanceBonus = Math.max(
            0,
            Number(CryptoZoo.state.expeditionStats.rareChanceBonus) || 0
        );

        CryptoZoo.state.expeditionStats.epicChanceBonus = Math.max(
            0,
            Number(CryptoZoo.state.expeditionStats.epicChanceBonus) || 0
        );

        CryptoZoo.state.expeditionStats.timeReductionSeconds = Math.max(
            0,
            Number(CryptoZoo.state.expeditionStats.timeReductionSeconds) || 0
        );

        if (!Array.isArray(CryptoZoo.state.expeditionStats.timeBoostCharges)) {
            CryptoZoo.state.expeditionStats.timeBoostCharges = [];
        }

        CryptoZoo.state.expeditionStats.timeBoostCharges = CryptoZoo.state.expeditionStats.timeBoostCharges
            .map((value) => Math.max(0, Number(value) || 0))
            .filter((value) => value > 0)
            .sort((a, b) => a - b);
    },

    ensureActiveExpeditionShape() {
        CryptoZoo.state = CryptoZoo.state || {};

        if (!CryptoZoo.state.expedition || typeof CryptoZoo.state.expedition !== "object") {
            return null;
        }

        const expedition = CryptoZoo.state.expedition;

        expedition.id = String(expedition.id || "");
        expedition.name = String(expedition.name || "Expedition");

        expedition.startTime = Math.max(0, Number(expedition.startTime) || 0);
        expedition.endTime = Math.max(0, Number(expedition.endTime) || 0);

        expedition.baseDuration = Math.max(
            60,
            Number(expedition.baseDuration) ||
            Number(expedition.duration) ||
            60
        );

        expedition.duration = Math.max(
            60,
            Number(expedition.duration) ||
            expedition.baseDuration ||
            60
        );

        expedition.timeReductionUsed = Math.max(
            0,
            Number(expedition.timeReductionUsed) || 0
        );

        expedition.rewardRarity = this.normalizeRewardRarity(expedition.rewardRarity);
        expedition.rewardCoins = Math.max(0, Math.floor(Number(expedition.rewardCoins) || 0));
        expedition.rewardGems = Math.max(0, Math.floor(Number(expedition.rewardGems) || 0));

        if (expedition.endTime > 0 && expedition.startTime > 0 && expedition.endTime < expedition.startTime) {
            expedition.endTime = expedition.startTime + expedition.duration * 1000;
        }

        return expedition;
    },

    normalizeRewardRarity(rarity) {
        const safeRarity = String(rarity || "common").toLowerCase();
        if (safeRarity === "rare") return "rare";
        if (safeRarity === "epic") return "epic";
        return "common";
    },

    getRareChanceBonus() {
        this.ensureExpeditionStats();
        return Math.max(0, Number(CryptoZoo.state.expeditionStats.rareChanceBonus) || 0);
    },

    getEpicChanceBonus() {
        this.ensureExpeditionStats();
        return Math.max(0, Number(CryptoZoo.state.expeditionStats.epicChanceBonus) || 0);
    },

    getLegacyTimeReductionSeconds() {
        this.ensureExpeditionStats();
        return Math.max(0, Number(CryptoZoo.state.expeditionStats.timeReductionSeconds) || 0);
    },

    getTimeBoostCharges() {
        this.ensureExpeditionStats();
        return Array.isArray(CryptoZoo.state.expeditionStats.timeBoostCharges)
            ? CryptoZoo.state.expeditionStats.timeBoostCharges
            : [];
    },

    getTimeBoostChargesCount() {
        return this.getTimeBoostCharges().length;
    },

    addTimeBoostCharge(seconds) {
        this.ensureExpeditionStats();

        const safeSeconds = Math.max(0, Number(seconds) || 0);
        if (safeSeconds <= 0) return false;

        CryptoZoo.state.expeditionStats.timeBoostCharges.push(safeSeconds);
        CryptoZoo.state.expeditionStats.timeBoostCharges.sort((a, b) => a - b);

        return true;
    },

    peekBestTimeBoostCharge(baseDuration) {
        const charges = this.getTimeBoostCharges();
        if (!charges.length) return 0;

        const safeBaseDuration = Math.max(60, Number(baseDuration) || 60);
        const maxAllowedReduction = Math.max(0, safeBaseDuration - 60);

        if (maxAllowedReduction <= 0) {
            return 0;
        }

        let best = 0;

        charges.forEach((charge) => {
            const safeCharge = Math.max(0, Number(charge) || 0);
            const applied = Math.min(safeCharge, maxAllowedReduction);

            if (applied > best) {
                best = applied;
            }
        });

        return best;
    },

    consumeBestTimeBoostCharge(baseDuration) {
        this.ensureExpeditionStats();

        const charges = this.getTimeBoostCharges();
        if (!charges.length) {
            return 0;
        }

        const safeBaseDuration = Math.max(60, Number(baseDuration) || 60);
        const maxAllowedReduction = Math.max(0, safeBaseDuration - 60);

        if (maxAllowedReduction <= 0) {
            return 0;
        }

        let bestApplied = 0;
        let bestIndex = -1;

        charges.forEach((charge, index) => {
            const safeCharge = Math.max(0, Number(charge) || 0);
            const applied = Math.min(safeCharge, maxAllowedReduction);

            if (applied > bestApplied) {
                bestApplied = applied;
                bestIndex = index;
            }
        });

        if (bestIndex === -1 || bestApplied <= 0) {
            return 0;
        }

        CryptoZoo.state.expeditionStats.timeBoostCharges.splice(bestIndex, 1);
        return bestApplied;
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
        return !!this.ensureActiveExpeditionShape();
    },

    getActiveExpedition() {
        return this.ensureActiveExpeditionShape();
    },

    getExpeditionBoostMultiplier() {
        const boostLevel = Math.max(0, Number(CryptoZoo.state?.expeditionBoost) || 0);
        return 1 + boostLevel;
    },

    getEffectiveDurationSeconds(expeditionConfig) {
        return Math.max(
            60,
            Number(expeditionConfig?.baseDuration) ||
            Number(expeditionConfig?.duration) ||
            60
        );
    },

    getEffectiveRareChance(expedition) {
        const baseRareChance = Math.max(0, Number(expedition?.rareChance) || 0);
        const bonus = this.getRareChanceBonus();
        return Math.min(0.80, baseRareChance + bonus);
    },

    getEffectiveEpicChance(expedition) {
        const baseEpicChance = Math.max(0, Number(expedition?.epicChance) || 0);
        const bonus = this.getEpicChanceBonus();
        return Math.min(0.35, baseEpicChance + bonus);
    },

    getEffectiveGemChance(expedition, rewardRarity = "common") {
        const baseGemChance = Math.max(0, Number(expedition?.gemChance) || 0);

        let chance = baseGemChance;
        if (rewardRarity === "rare") chance += 0.02;
        if (rewardRarity === "epic") chance += 0.05;

        return Math.min(0.16, chance);
    },

    rollRewardRarity(expedition) {
        const epicChance = this.getEffectiveEpicChance(expedition);
        const rareChance = this.getEffectiveRareChance(expedition);
        const roll = Math.random();

        if (roll < epicChance) return "epic";
        if (roll < epicChance + rareChance) return "rare";
        return "common";
    },

    getRewardBalanceAmount(expedition) {
        if (!expedition) return 0;

        const durationSeconds = Math.max(
            60,
            Number(expedition.baseDuration) ||
            Number(expedition.duration) ||
            60
        );

        const hours = durationSeconds / 3600;

        // FINAL ECONOMY:
        // reward liczony z bazowego czasu ekspedycji,
        // nie z czasu po skróceniu, żeby time boost oszczędzał czas,
        // ale nie ucinał wypłaty
        let base = 0.0015 + hours * 0.0205;

        const rarity = this.normalizeRewardRarity(expedition.rewardRarity);
        let rarityMultiplier = 1;

        if (rarity === "rare") rarityMultiplier = 1.35;
        if (rarity === "epic") rarityMultiplier = 1.90;

        const boostMultiplier = this.getExpeditionBoostMultiplier();

        let reward = base * rarityMultiplier * boostMultiplier;
        reward = Math.min(reward, 0.95);

        return Number(reward.toFixed(3));
    },

    getCoinsReward(expeditionConfig, rewardRarity) {
        const baseCoins = Math.max(0, Number(expeditionConfig?.baseCoins) || 0);
        const boostMultiplier = this.getExpeditionBoostMultiplier();

        let rarityMultiplier = 1;
        if (rewardRarity === "rare") rarityMultiplier = 1.35;
        if (rewardRarity === "epic") rarityMultiplier = 1.95;

        return Math.max(0, Math.floor(baseCoins * rarityMultiplier * boostMultiplier));
    },

    getGemsReward(expeditionConfig, rewardRarity) {
        const chance = this.getEffectiveGemChance(expeditionConfig, rewardRarity);

        if (Math.random() >= chance) {
            return 0;
        }

        if (rewardRarity === "epic") {
            return Math.random() < 0.20 ? 2 : 1;
        }

        return 1;
    },

    buildActiveExpedition(expeditionConfig) {
        const now = Date.now();
        const baseDuration = this.getEffectiveDurationSeconds(expeditionConfig);
        const rewardRarity = this.rollRewardRarity(expeditionConfig);
        const rewardCoins = this.getCoinsReward(expeditionConfig, rewardRarity);
        const rewardGems = this.getGemsReward(expeditionConfig, rewardRarity);

        return {
            id: String(expeditionConfig?.id || ""),
            name: String(
                expeditionConfig?.namePl ||
                expeditionConfig?.name ||
                "Expedition"
            ),
            startTime: now,
            endTime: now + baseDuration * 1000,
            duration: baseDuration,
            baseDuration,
            timeReductionUsed: 0,
            rewardRarity,
            rewardCoins,
            rewardGems
        };
    },

    start(expeditionId) {
        CryptoZoo.state = CryptoZoo.state || {};
        this.ensureExpeditionStats();

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

        CryptoZoo.dailyMissions?.recordStartExpedition?.(1);
        CryptoZoo.audio?.play?.("click");
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.(`🌍 Start: ${expeditionConfig.namePl || expeditionConfig.name}`);

        return true;
    },

    useTimeBoostOnActiveExpedition() {
        CryptoZoo.state = CryptoZoo.state || {};
        this.ensureExpeditionStats();

        const expedition = this.getActiveExpedition();
        if (!expedition) {
            CryptoZoo.ui?.showToast?.("Brak aktywnej ekspedycji");
            return false;
        }

        const remainingSeconds = Math.max(
            0,
            Math.floor((Number(expedition.endTime) - Date.now()) / 1000)
        );

        if (remainingSeconds <= 0) {
            CryptoZoo.ui?.showToast?.("Ekspedycja jest już gotowa");
            return false;
        }

        const reductionSeconds = this.consumeBestTimeBoostCharge(remainingSeconds);

        if (reductionSeconds <= 0) {
            CryptoZoo.ui?.showToast?.("Brak dostępnego boosta czasu");
            return false;
        }

        expedition.endTime = Math.max(
            Date.now(),
            Number(expedition.endTime) - reductionSeconds * 1000
        );

        expedition.duration = Math.max(
            60,
            Math.floor((Number(expedition.endTime) - Number(expedition.startTime)) / 1000)
        );

        expedition.timeReductionUsed = Math.max(
            0,
            Number(expedition.timeReductionUsed) || 0
        ) + reductionSeconds;

        CryptoZoo.audio?.play?.("click");
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.(
            `⏩ Skrócono o ${CryptoZoo.ui?.formatDurationLabel?.(reductionSeconds) || `${reductionSeconds}s`}`
        );

        return true;
    },

    canCollect() {
        const expedition = this.getActiveExpedition();
        if (!expedition) return false;

        return Date.now() >= Math.max(0, Number(expedition.endTime) || 0);
    },

    collect() {
        CryptoZoo.state = CryptoZoo.state || {};

        const expedition = this.getActiveExpedition();
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
        const rewardBalance = Math.max(0, this.getRewardBalanceAmount(expedition));

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