window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.expeditions = {
    collectInProgress: false,

    getAll() {
        return Array.isArray(CryptoZoo.config?.expeditions)
            ? CryptoZoo.config.expeditions
            : [];
    },

    getById(id) {
        return this.getAll().find((exp) => String(exp.id) === String(id)) || null;
    },

    t(key, fallback) {
        const translated = CryptoZoo.lang?.t?.(key);
        if (translated && translated !== key) {
            return translated;
        }
        return fallback || key;
    },

    getBackendOfflineMessage() {
        const isPl = (CryptoZoo.lang?.current || "en") === "pl";
        return isPl
            ? "Backend ekspedycji offline — pełne działanie wróci po podpięciu VPS"
            : "Expedition backend offline — full functionality will return after VPS setup";
    },

    isBackendOfflineError(error) {
        const message = String(error?.message || "").toLowerCase();

        return (
            message.includes("failed to fetch") ||
            message.includes("networkerror") ||
            message.includes("load failed") ||
            message.includes("request timeout") ||
            message.includes("http 404") ||
            message.includes("api route not found")
        );
    },

    showExpeditionError(error, fallbackMessage) {
        console.error("Expedition error:", error);

        if (this.isBackendOfflineError(error)) {
            CryptoZoo.ui?.showToast?.(this.getBackendOfflineMessage());
            return;
        }

        CryptoZoo.ui?.showToast?.(error?.message || fallbackMessage);
    },

    getExpeditionDisplayName(expeditionConfig) {
        if (!expeditionConfig) {
            return "Expedition";
        }

        const currentLang = CryptoZoo.lang?.current || "en";

        if (currentLang === "pl" && expeditionConfig.namePl) {
            return String(expeditionConfig.namePl);
        }

        if (currentLang === "en" && expeditionConfig.nameEn) {
            return String(expeditionConfig.nameEn);
        }

        return String(
            expeditionConfig.nameEn ||
            expeditionConfig.namePl ||
            expeditionConfig.name ||
            "Expedition"
        );
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

        CryptoZoo.state.expeditionBoost = Math.max(
            0,
            Number(CryptoZoo.state.expeditionBoost) || 0
        );

        CryptoZoo.state.expeditionBoostActiveUntil = Math.max(
            0,
            Number(CryptoZoo.state.expeditionBoostActiveUntil) || 0
        );

        if (
            CryptoZoo.state.expeditionBoostActiveUntil > 0 &&
            CryptoZoo.state.expeditionBoostActiveUntil <= Date.now()
        ) {
            CryptoZoo.state.expeditionBoost = 0;
            CryptoZoo.state.expeditionBoostActiveUntil = 0;
        }
    },

    normalizeSelectedAnimals(selectedAnimals) {
        if (!Array.isArray(selectedAnimals)) {
            return [];
        }

        return selectedAnimals
            .map((entry) => {
                if (typeof entry === "string") {
                    return {
                        type: String(entry),
                        count: 1
                    };
                }

                return {
                    type: String(entry?.type || ""),
                    count: Math.max(1, Math.floor(Number(entry?.count) || 1))
                };
            })
            .filter((entry) => entry.type);
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
        expedition.selectedAnimals = this.normalizeSelectedAnimals(expedition.selectedAnimals);
        expedition.startCostCoins = Math.max(0, Math.floor(Number(expedition.startCostCoins) || 0));

        expedition.claimed = Boolean(expedition.claimed);
        expedition.collectedAt = Math.max(0, Number(expedition.collectedAt) || 0);

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

        CryptoZoo.api?.savePlayer?.();
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

    getUnlockRequirement(expedition) {
        if (!expedition) return 1;
        return Math.max(1, Number(expedition.unlockLevel) || 1);
    },

    getStartCostCoins(expedition) {
        return Math.max(0, Math.floor(Number(expedition?.startCostCoins) || 0));
    },

    getCurrentCoins() {
        return Math.max(0, Math.floor(Number(CryptoZoo.state?.coins) || 0));
    },

    canAffordStart(expedition) {
        const cost = this.getStartCostCoins(expedition);
        const coins = this.getCurrentCoins();
        return coins >= cost;
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

    isDepositExpeditionBoostActive() {
        this.ensureExpeditionStats();
        return (Number(CryptoZoo.state?.expeditionBoostActiveUntil) || 0) > Date.now();
    },

    getExpeditionBoostMultiplier() {
        this.ensureExpeditionStats();

        if (!this.isDepositExpeditionBoostActive()) {
            return 1;
        }

        const boostLevel = Math.max(0, Number(CryptoZoo.state?.expeditionBoost) || 0);

        return 1 + Math.min(0.2, boostLevel * 0.2);
    },

    getTotalExpeditionRewardMultiplier() {
        const baseMultiplier = this.getExpeditionBoostMultiplier();
        const dailyMultiplier = Math.max(
            1,
            Number(CryptoZoo.shopSystem?.getDailyBoostMultiplier?.() || 1)
        );

        return baseMultiplier * dailyMultiplier;
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
        return Math.min(0.45, baseRareChance + bonus);
    },

    getEffectiveEpicChance(expedition) {
        const baseEpicChance = Math.max(0, Number(expedition?.epicChance) || 0);
        const bonus = this.getEpicChanceBonus();
        return Math.min(0.18, baseEpicChance + bonus);
    },

    getEffectiveGemChance(expedition, rewardRarity = "common") {
        const baseGemChance = Math.max(0, Number(expedition?.gemChance) || 0);

        let chance = baseGemChance;
        if (rewardRarity === "rare") chance += 0.012;
        if (rewardRarity === "epic") chance += 0.03;

        return Math.min(0.10, chance);
    },

    rollRewardRarity(expedition) {
        const epicChance = this.getEffectiveEpicChance(expedition);
        const rareChance = this.getEffectiveRareChance(expedition);
        const roll = Math.random();

        if (roll < epicChance) return "epic";
        if (roll < epicChance + rareChance) return "rare";
        return "common";
    },

    getRewardTierMultiplier(expedition) {
        const expeditionId = String(expedition?.id || "").toLowerCase();

        const tierMap = {
            forest: 1.00,
            river: 1.02,
            volcano: 1.04,
            canyon: 1.07,
            glacier: 1.10,
            jungle: 1.13,
            temple: 1.17,
            oasis: 1.21,
            kingdom: 1.26
        };

        return Number(tierMap[expeditionId]) || 1.00;
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
        const tierMultiplier = this.getRewardTierMultiplier(expedition);

        const rarity = this.normalizeRewardRarity(expedition.rewardRarity);
        let rarityMultiplier = 1;

        if (rarity === "rare") rarityMultiplier = 1.18;
        if (rarity === "epic") rarityMultiplier = 1.42;

        const boostMultiplier = this.getTotalExpeditionRewardMultiplier();

        let reward = hours * 0.012 * tierMultiplier * rarityMultiplier * boostMultiplier;
        reward = Math.min(reward, 0.45);

        return Number(reward.toFixed(3));
    },

    canCollect() {
        const expedition = this.getActiveExpedition();
        if (!expedition) return false;
        if (expedition.claimed) return false;

        return Date.now() >= Math.max(0, Number(expedition.endTime) || 0);
    },

    async start(expeditionId, selectedAnimals = []) {
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

        const startCostCoins = this.getStartCostCoins(expeditionConfig);

        if (!this.canAffordStart(expeditionConfig)) {
            CryptoZoo.ui?.showToast?.(
                `Potrzebujesz ${CryptoZoo.formatNumber(startCostCoins)} coins`
            );
            return false;
        }

        try {
            const response = await CryptoZoo.api.expeditionStart(
                expeditionId,
                this.normalizeSelectedAnimals(selectedAnimals)
            );

            if (response?.player) {
                CryptoZoo.dailyMissions?.recordStartExpedition?.(1);
                CryptoZoo.audio?.play?.("click");
                CryptoZoo.gameplay?.recalculateProgress?.();
                CryptoZoo.ui?.render?.();
                CryptoZoo.ui?.showToast?.(
                    `🌍 Start: ${this.getExpeditionDisplayName(expeditionConfig)} • -${CryptoZoo.formatNumber(startCostCoins)} coins`
                );
                return true;
            }

            return false;
        } catch (error) {
            this.showExpeditionError(error, "Błąd startu ekspedycji");
            return false;
        }
    },

    async useTimeBoostOnActiveExpedition() {
        CryptoZoo.state = CryptoZoo.state || {};
        this.ensureExpeditionStats();

        const expedition = this.getActiveExpedition();
        if (!expedition) {
            CryptoZoo.ui?.showToast?.("Brak aktywnej ekspedycji");
            return false;
        }

        if (expedition.claimed) {
            CryptoZoo.ui?.showToast?.("Nagroda z tej ekspedycji została już odebrana");
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

        const reductionSeconds = this.peekBestTimeBoostCharge(expedition.baseDuration || expedition.duration || 60);

        if (reductionSeconds <= 0) {
            CryptoZoo.ui?.showToast?.("Brak dostępnego boosta czasu");
            return false;
        }

        try {
            const response = await CryptoZoo.api.expeditionUseTimeReduction(reductionSeconds);
            const usedReductionSeconds = Math.max(
                0,
                Number(response?.reductionSeconds) || reductionSeconds
            );

            CryptoZoo.audio?.play?.("click");
            CryptoZoo.ui?.render?.();
            CryptoZoo.ui?.showToast?.(
                `⏩ Skrócono o ${CryptoZoo.ui?.formatDurationLabel?.(usedReductionSeconds) || `${usedReductionSeconds}s`}`
            );

            return true;
        } catch (error) {
            this.showExpeditionError(error, "Błąd skrócenia ekspedycji");
            return false;
        }
    },

    async collect() {
        CryptoZoo.state = CryptoZoo.state || {};

        if (this.collectInProgress) {
            return false;
        }

        const expedition = this.getActiveExpedition();
        if (!expedition) {
            CryptoZoo.ui?.showToast?.("Brak aktywnej ekspedycji");
            return false;
        }

        if (expedition.claimed || Number(expedition.collectedAt) > 0) {
            CryptoZoo.ui?.showToast?.("Nagroda z tej ekspedycji została już odebrana");
            return false;
        }

        if (!this.canCollect()) {
            CryptoZoo.ui?.showToast?.("Ekspedycja jeszcze trwa");
            return false;
        }

        this.collectInProgress = true;

        try {
            const response = await CryptoZoo.api.expeditionCollect();
            const rewards = response?.rewards || {};

            const coins = Math.max(0, Number(rewards.coins) || 0);
            const gems = Math.max(0, Number(rewards.gems) || 0);
            const rewardBalance = Math.max(0, Number(rewards.rewardBalance) || 0);

            CryptoZoo.audio?.play?.("win");
            CryptoZoo.gameplay?.recalculateProgress?.();
            CryptoZoo.ui?.render?.();

            const rewardText = [
                `+${CryptoZoo.formatNumber(coins)} coins`,
                gems > 0 ? `+${CryptoZoo.formatNumber(gems)} gem` : "",
                rewardBalance > 0 ? `+${rewardBalance.toFixed(3)} reward` : ""
            ].filter(Boolean).join(" • ");

            CryptoZoo.ui?.showToast?.(`🎁 Expedition complete • ${rewardText}`);
            return true;
        } catch (error) {
            this.showExpeditionError(error, "Błąd odbioru nagrody");
            return false;
        } finally {
            setTimeout(() => {
                this.collectInProgress = false;
            }, 250);
        }
    }
};