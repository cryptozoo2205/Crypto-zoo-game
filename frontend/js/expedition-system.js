window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.expeditions = {
    collectInProgress: false,

    DAILY_REWARD_FREE_CAP: 0.08,
    DAILY_REWARD_PREMIUM_CAP: 0.25,
    BASE_REWARD_PER_HOUR: 0.008,
    MIN_REWARD_PREVIEW: 0.001,
    MAX_REWARD_PER_EXPEDITION: 0.12,

    getAll() {
        return Array.isArray(CryptoZoo.config?.expeditions)
            ? CryptoZoo.config.expeditions
            : [];
    },

    getById(id) {
        return this.getAll().find((exp) => String(exp.id) === String(id)) || null;
    },

    getRegionId(expedition) {
        return String(expedition?.regionId || "jungle");
    },

    getAllByRegion(regionId) {
        const safeRegionId = String(regionId || "").trim();
        return this.getAll().filter((expedition) => {
            return this.getRegionId(expedition) === safeRegionId;
        });
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
            ? "Backend ekspedycji offline — uruchomiono lokalny tryb testowy"
            : "Expedition backend offline — local test mode enabled";
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

    isLocalTestEnvironment() {
        const host = String(window.location?.hostname || "").toLowerCase();

        return (
            host.includes("github.io") ||
            host === "localhost" ||
            host === "127.0.0.1"
        );
    },

    canUseLocalFallback() {
        return this.isLocalTestEnvironment();
    },

    showExpeditionError(error, fallbackMessage) {
        console.error("Expedition error:", error);

        if (this.isBackendOfflineError(error)) {
            CryptoZoo.ui?.showToast?.(this.getBackendOfflineMessage());
            return;
        }

        CryptoZoo.ui?.showToast?.(error?.message || fallbackMessage);
    },

    showFallbackStartToast(expeditionConfig, startCostCoins) {
        const expeditionName = this.getExpeditionDisplayName(expeditionConfig);

        CryptoZoo.ui?.showToast?.(
            `🌍 Start: ${expeditionName} • -${CryptoZoo.formatNumber(startCostCoins)} coins`
        );
    },

    showFallbackEnabledToastOnce() {
        if (this._fallbackToastShown) return;
        this._fallbackToastShown = true;
        CryptoZoo.ui?.showToast?.(this.getBackendOfflineMessage());
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

    ensureRewardDailyState() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.rewardDaily = CryptoZoo.state.rewardDaily || {};

        if (typeof CryptoZoo.state.rewardBalance !== "number") {
            CryptoZoo.state.rewardBalance = Number(CryptoZoo.state.rewardBalance) || 0;
        }
    },

    getTodayRewardKey() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    },

    getDailyRewardCap() {
        const isPremium = Boolean(CryptoZoo.state?.isPremium);
        return isPremium ? this.DAILY_REWARD_PREMIUM_CAP : this.DAILY_REWARD_FREE_CAP;
    },

    getTodayRewardEarned() {
        this.ensureRewardDailyState();
        const key = this.getTodayRewardKey();
        return Math.max(0, Number(CryptoZoo.state.rewardDaily[key]) || 0);
    },

    getRemainingDailyRewardCap() {
        const cap = this.getDailyRewardCap();
        const earned = this.getTodayRewardEarned();
        return Math.max(0, Number((cap - earned).toFixed(3)));
    },

    applyRewardDiminishing(amount) {
        const safeAmount = Math.max(0, Number(amount) || 0);
        const todayEarned = this.getTodayRewardEarned();

        if (todayEarned >= 0.06) {
            return safeAmount * 0.25;
        }

        if (todayEarned >= 0.04) {
            return safeAmount * 0.5;
        }

        return safeAmount;
    },

    applyRewardCap(amount) {
        this.ensureRewardDailyState();

        const safeAmount = Math.max(0, Number(amount) || 0);
        if (safeAmount <= 0) {
            return 0;
        }

        const key = this.getTodayRewardKey();
        const current = this.getTodayRewardEarned();
        const cap = this.getDailyRewardCap();

        if (current >= cap) {
            return 0;
        }

        const allowed = Math.min(safeAmount, cap - current);
        CryptoZoo.state.rewardDaily[key] = Number((current + allowed).toFixed(3));

        return Number(allowed.toFixed(3));
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

        CryptoZoo.state.shopItemCharges = CryptoZoo.state.shopItemCharges || {};

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

        this.ensureRewardDailyState();
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
        const configExpedition = this.getById(expedition.id);

        expedition.id = String(expedition.id || "");
        expedition.regionId = String(
            expedition.regionId ||
            configExpedition?.regionId ||
            "jungle"
        );
        expedition.name = String(
            expedition.name ||
            configExpedition?.nameEn ||
            configExpedition?.namePl ||
            configExpedition?.name ||
            "Expedition"
        );

        expedition.startTime = Math.max(0, Number(expedition.startTime) || 0);
        expedition.endTime = Math.max(0, Number(expedition.endTime) || 0);

        expedition.baseDuration = Math.max(
            60,
            Number(expedition.baseDuration) ||
            Number(configExpedition?.baseDuration) ||
            Number(configExpedition?.duration) ||
            Number(expedition.duration) ||
            60
        );

        expedition.duration = Math.max(
            60,
            Number(expedition.duration) ||
            Number(configExpedition?.duration) ||
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
        expedition.rewardBalance = Math.max(0, Number(expedition.rewardBalance) || 0);
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

    getLegacyTimeBoostCharges() {
        this.ensureExpeditionStats();

        return Array.isArray(CryptoZoo.state.expeditionStats.timeBoostCharges)
            ? CryptoZoo.state.expeditionStats.timeBoostCharges
            : [];
    },

    getShopTimeBoostItems() {
        const items = Array.isArray(CryptoZoo.config?.shopItems)
            ? CryptoZoo.config.shopItems
            : [];

        return items
            .filter((item) => {
                const type = String(item?.type || "").toLowerCase();
                const effect = String(item?.effect || "").toLowerCase();

                return type === "expeditiontime" || effect === "expeditiontime";
            })
            .map((item) => ({
                id: String(item.id || ""),
                seconds: Math.max(0, Number(item.timeReductionSeconds) || 0),
                item
            }))
            .filter((entry) => entry.id && entry.seconds > 0)
            .sort((a, b) => a.seconds - b.seconds);
    },

    getShopTimeBoostChargeCount(itemId) {
        this.ensureExpeditionStats();
        return Math.max(0, Number(CryptoZoo.state?.shopItemCharges?.[itemId]) || 0);
    },

    getAvailableTimeBoostOptions() {
        this.ensureExpeditionStats();

        const options = [];
        const shopItems = this.getShopTimeBoostItems();

        shopItems.forEach((entry) => {
            const count = this.getShopTimeBoostChargeCount(entry.id);

            if (count > 0) {
                options.push({
                    source: "shop",
                    key: entry.id,
                    itemId: entry.id,
                    seconds: entry.seconds,
                    count,
                    item: entry.item
                });
            }
        });

        const legacyCounts = new Map();
        this.getLegacyTimeBoostCharges().forEach((seconds) => {
            const safeSeconds = Math.max(0, Number(seconds) || 0);
            if (safeSeconds <= 0) return;
            legacyCounts.set(safeSeconds, (legacyCounts.get(safeSeconds) || 0) + 1);
        });

        Array.from(legacyCounts.entries())
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .forEach(([seconds, count]) => {
                options.push({
                    source: "legacy",
                    key: `legacy_${seconds}`,
                    itemId: "",
                    seconds: Math.max(0, Number(seconds) || 0),
                    count: Math.max(0, Number(count) || 0),
                    item: null
                });
            });

        return options.sort((a, b) => Number(a.seconds || 0) - Number(b.seconds || 0));
    },

    getTimeBoostCharges() {
        const options = this.getAvailableTimeBoostOptions();
        const flatCharges = [];

        options.forEach((option) => {
            const seconds = Math.max(0, Number(option?.seconds) || 0);
            const count = Math.max(0, Number(option?.count) || 0);

            for (let i = 0; i < count; i += 1) {
                if (seconds > 0) {
                    flatCharges.push(seconds);
                }
            }
        });

        return flatCharges.sort((a, b) => a - b);
    },

    getTimeBoostChargesCount() {
        return this.getAvailableTimeBoostOptions().reduce((sum, option) => {
            return sum + Math.max(0, Number(option?.count) || 0);
        }, 0);
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

    getTimeBoostOptionByKey(optionKey) {
        const safeKey = String(optionKey || "").trim();
        if (!safeKey) return null;

        return this.getAvailableTimeBoostOptions().find((option) => {
            return String(option.key || "") === safeKey;
        }) || null;
    },

    consumeSpecificTimeBoostCharge(optionKey, baseDuration) {
        this.ensureExpeditionStats();

        const option = this.getTimeBoostOptionByKey(optionKey);
        if (!option) {
            return 0;
        }

        const safeBaseDuration = Math.max(60, Number(baseDuration) || 60);
        const maxAllowedReduction = Math.max(0, safeBaseDuration - 60);

        if (maxAllowedReduction <= 0) {
            return 0;
        }

        const requestedSeconds = Math.max(0, Number(option.seconds) || 0);
        const appliedReduction = Math.min(requestedSeconds, maxAllowedReduction);

        if (appliedReduction <= 0) {
            return 0;
        }

        if (option.source === "shop" && option.itemId) {
            const currentCount = this.getShopTimeBoostChargeCount(option.itemId);
            if (currentCount <= 0) {
                return 0;
            }

            CryptoZoo.state.shopItemCharges[option.itemId] = currentCount - 1;
            return appliedReduction;
        }

        if (option.source === "legacy") {
            const charges = this.getLegacyTimeBoostCharges();
            const index = charges.findIndex((seconds) => {
                return Math.max(0, Number(seconds) || 0) === requestedSeconds;
            });

            if (index < 0) {
                return 0;
            }

            CryptoZoo.state.expeditionStats.timeBoostCharges.splice(index, 1);
            return appliedReduction;
        }

        return 0;
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

        const safeBaseDuration = Math.max(60, Number(baseDuration) || 60);
        const maxAllowedReduction = Math.max(0, safeBaseDuration - 60);

        if (maxAllowedReduction <= 0) {
            return 0;
        }

        const options = this.getAvailableTimeBoostOptions();
        let bestOption = null;
        let bestApplied = 0;

        options.forEach((option) => {
            const safeCharge = Math.max(0, Number(option?.seconds) || 0);
            const applied = Math.min(safeCharge, maxAllowedReduction);

            if (applied > bestApplied) {
                bestApplied = applied;
                bestOption = option;
            }
        });

        if (!bestOption || bestApplied <= 0) {
            return 0;
        }

        return this.consumeSpecificTimeBoostCharge(bestOption.key, safeBaseDuration);
    },

    getUnlockRequirement(expedition) {
        const configExpedition = this.getById(expedition?.id);
        return Math.max(
            1,
            Math.floor(Number(configExpedition?.unlockLevel) || Number(expedition?.unlockLevel) || 1)
        );
    },

    getStartCostCoins(expedition) {
        const configExpedition = this.getById(expedition?.id);
        return Math.max(
            0,
            Math.floor(Number(configExpedition?.startCostCoins) || Number(expedition?.startCostCoins) || 0)
        );
    },

    getBaseCoinsReward(expedition) {
        const configExpedition = this.getById(expedition?.id);
        return Math.max(
            0,
            Math.floor(Number(configExpedition?.baseCoins) || Number(expedition?.baseCoins) || 0)
        );
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
        return 1 + boostLevel;
    },

    getTotalExpeditionRewardMultiplier() {
        const baseMultiplier = this.getExpeditionBoostMultiplier();
        const dailyMultiplier = Math.max(
            1,
            Number(CryptoZoo.shopSystem?.getDailyBoostMultiplier?.() || 1)
        );

        return baseMultiplier * dailyMultiplier;
    },

    getEffectiveDurationSeconds(expedition) {
        const configExpedition = this.getById(expedition?.id);

        return Math.max(
            60,
            Number(configExpedition?.baseDuration) ||
            Number(configExpedition?.duration) ||
            Number(expedition?.baseDuration) ||
            Number(expedition?.duration) ||
            60
        );
    },

    getEffectiveRareChance(expedition) {
        const configExpedition = this.getById(expedition?.id);
        const baseRareChance = Math.max(
            0,
            Number(configExpedition?.rareChance) || Number(expedition?.rareChance) || 0
        );
        const bonus = this.getRareChanceBonus();
        return Math.min(0.32, baseRareChance + bonus);
    },

    getEffectiveEpicChance(expedition) {
        const configExpedition = this.getById(expedition?.id);
        const baseEpicChance = Math.max(
            0,
            Number(configExpedition?.epicChance) || Number(expedition?.epicChance) || 0
        );
        const bonus = this.getEpicChanceBonus();
        return Math.min(0.10, baseEpicChance + bonus);
    },

    getEffectiveGemChance(expedition, rewardRarity = "common") {
        const configExpedition = this.getById(expedition?.id);
        const baseGemChance = Math.max(
            0,
            Number(configExpedition?.gemChance) || Number(expedition?.gemChance) || 0
        );

        let chance = baseGemChance;
        if (rewardRarity === "rare") chance += 0.008;
        if (rewardRarity === "epic") chance += 0.018;

        return Math.min(0.06, chance);
    },

    rollRewardRarity(expedition) {
        const epicChance = this.getEffectiveEpicChance(expedition);
        const rareChance = this.getEffectiveRareChance(expedition);
        const roll = Math.random();

        if (roll < epicChance) return "epic";
        if (roll < epicChance + rareChance) return "rare";
        return "common";
    },

    rollRewardGems(expedition, rewardRarity = "common") {
        const chance = this.getEffectiveGemChance(expedition, rewardRarity);
        if (Math.random() >= chance) {
            return 0;
        }

        if (rewardRarity === "epic") return 2;
        return 1;
    },

    getRewardTierMultiplier(expedition) {
        const expeditionId = String(expedition?.id || "").toLowerCase();

        const tierMap = {
            jungle_scout: 1.00,
            jungle_river: 1.03,
            jungle_ruins: 1.06,
            jungle_canopy: 1.10,
            jungle_depths: 1.14,
            jungle_temple: 1.18,
            jungle_king: 1.22,
            desert_outpost: 1.26,
            desert_dunes: 1.30
        };

        return Number(tierMap[expeditionId]) || 1.00;
    },

    calculateRewardBalancePreview(expedition) {
        if (!expedition) return 0;

        const durationSeconds = this.getEffectiveDurationSeconds(expedition);
        const hours = durationSeconds / 3600;
        const tierMultiplier = this.getRewardTierMultiplier(expedition);

        const rarity = this.normalizeRewardRarity(expedition.rewardRarity);
        let rarityMultiplier = 1;

        if (rarity === "rare") rarityMultiplier = 1.10;
        if (rarity === "epic") rarityMultiplier = 1.22;

        const boostMultiplier = this.getTotalExpeditionRewardMultiplier();

        let reward = hours * this.BASE_REWARD_PER_HOUR * tierMultiplier * rarityMultiplier * boostMultiplier;

        if (reward > 0 && reward < this.MIN_REWARD_PREVIEW) {
            reward = this.MIN_REWARD_PREVIEW;
        }

        reward = Math.min(reward, this.MAX_REWARD_PER_EXPEDITION);

        return Number(reward.toFixed(3));
    },

    getRewardBalanceAmount(expedition) {
        return this.calculateRewardBalancePreview(expedition);
    },

    finalizeRewardBalanceAmount(expedition) {
        let reward = this.calculateRewardBalancePreview(expedition);
        reward = this.applyRewardDiminishing(reward);
        reward = Math.min(reward, this.MAX_REWARD_PER_EXPEDITION);
        reward = this.applyRewardCap(reward);

        return Number(reward.toFixed(3));
    },

    getLocalRewardCoins(expeditionConfig, rewardRarity) {
        const baseCoins = this.getBaseCoinsReward(expeditionConfig);
        const totalMultiplier = this.getTotalExpeditionRewardMultiplier();

        let rarityMultiplier = 1;
        if (rewardRarity === "rare") rarityMultiplier = 1.15;
        if (rewardRarity === "epic") rarityMultiplier = 1.3;

        return Math.max(
            0,
            Math.floor(baseCoins * totalMultiplier * rarityMultiplier)
        );
    },

    buildLocalExpedition(expeditionConfig, selectedAnimals = []) {
        const now = Date.now();
        const normalizedSelectedAnimals = this.normalizeSelectedAnimals(selectedAnimals);
        const rewardRarity = this.rollRewardRarity(expeditionConfig);
        const baseDuration = this.getEffectiveDurationSeconds(expeditionConfig);
        const legacyReduction = this.getLegacyTimeReductionSeconds();
        const totalReduction = Math.min(
            Math.max(0, baseDuration - 60),
            Math.max(0, legacyReduction)
        );

        const duration = Math.max(60, baseDuration - totalReduction);
        const rewardCoins = this.getLocalRewardCoins(expeditionConfig, rewardRarity);
        const rewardGems = this.rollRewardGems(expeditionConfig, rewardRarity);
        const rewardBalance = this.getRewardBalanceAmount({
            ...expeditionConfig,
            rewardRarity,
            duration,
            baseDuration
        });

        return {
            id: String(expeditionConfig.id),
            regionId: String(this.getRegionId(expeditionConfig)),
            name: this.getExpeditionDisplayName(expeditionConfig),
            startTime: now,
            endTime: now + duration * 1000,
            baseDuration,
            duration,
            timeReductionUsed: totalReduction,
            rewardRarity,
            rewardCoins,
            rewardGems,
            selectedAnimals: normalizedSelectedAnimals,
            startCostCoins: this.getStartCostCoins(expeditionConfig),
            rewardBalance,
            claimed: false,
            collectedAt: 0
        };
    },

    async startLocalFallback(expeditionId, selectedAnimals = []) {
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

        CryptoZoo.state.coins = Math.max(
            0,
            this.getCurrentCoins() - startCostCoins
        );

        const expedition = this.buildLocalExpedition(expeditionConfig, selectedAnimals);
        CryptoZoo.state.expedition = expedition;

        const legacyReduction = this.getLegacyTimeReductionSeconds();
        if (legacyReduction > 0) {
            CryptoZoo.state.expeditionStats.timeReductionSeconds = 0;
        }

        CryptoZoo.dailyMissions?.recordStartExpedition?.(1);
        CryptoZoo.audio?.play?.("click");
        CryptoZoo.gameplay?.recalculateProgress?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.render?.();

        this.showFallbackEnabledToastOnce();
        this.showFallbackStartToast(expeditionConfig, startCostCoins);

        return true;
    },

    async useTimeBoostOnActiveExpeditionLocalFallback(optionKey = "") {
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

        const availableOptions = this.getAvailableTimeBoostOptions();
        if (!availableOptions.length) {
            CryptoZoo.ui?.showToast?.("Brak dostępnego boosta czasu");
            return false;
        }

        let selectedOption = null;

        if (String(optionKey || "").trim()) {
            selectedOption = this.getTimeBoostOptionByKey(optionKey);
        }

        if (!selectedOption) {
            if (availableOptions.length === 1) {
                selectedOption = availableOptions[0];
            } else {
                CryptoZoo.ui?.showToast?.("Wybierz rodzaj skrócenia czasu");
                return false;
            }
        }

        const reductionSeconds = this.consumeSpecificTimeBoostCharge(
            selectedOption.key,
            expedition.baseDuration || expedition.duration || 60
        );

        if (reductionSeconds <= 0) {
            CryptoZoo.ui?.showToast?.("Brak dostępnego boosta czasu");
            return false;
        }

        const minEndTime = Math.max(
            Number(expedition.startTime) || Date.now(),
            Date.now() + 1000
        );

        expedition.timeReductionUsed = Math.max(
            0,
            Number(expedition.timeReductionUsed) || 0
        ) + reductionSeconds;

        expedition.duration = Math.max(
            60,
            Number(expedition.duration) - reductionSeconds
        );

        expedition.endTime = Math.max(
            minEndTime,
            Number(expedition.endTime) - reductionSeconds * 1000
        );

        CryptoZoo.audio?.play?.("click");
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.render?.();

        this.showFallbackEnabledToastOnce();
        CryptoZoo.ui?.showToast?.(
            `⏩ Skrócono o ${CryptoZoo.ui?.formatDurationLabel?.(reductionSeconds) || `${reductionSeconds}s`}`
        );

        return true;
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
            if (this.isBackendOfflineError(error) && this.canUseLocalFallback()) {
                return this.startLocalFallback(expeditionId, selectedAnimals);
            }

            this.showExpeditionError(error, "Błąd startu ekspedycji");
            return false;
        }
    },

    async useTimeBoostOnActiveExpedition(optionKey = "") {
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

        const availableOptions = this.getAvailableTimeBoostOptions();
        if (!availableOptions.length) {
            CryptoZoo.ui?.showToast?.("Brak dostępnego boosta czasu");
            return false;
        }

        let selectedOption = null;

        if (String(optionKey || "").trim()) {
            selectedOption = this.getTimeBoostOptionByKey(optionKey);
        }

        if (!selectedOption) {
            if (availableOptions.length === 1) {
                selectedOption = availableOptions[0];
            } else {
                CryptoZoo.ui?.showToast?.("Wybierz rodzaj skrócenia czasu");
                return false;
            }
        }

        const requestedReductionSeconds = Math.max(
            0,
            Math.min(
                Number(selectedOption.seconds) || 0,
                Math.max(0, (Number(expedition.baseDuration) || Number(expedition.duration) || 60) - 60)
            )
        );

        if (requestedReductionSeconds <= 0) {
            CryptoZoo.ui?.showToast?.("Brak dostępnego boosta czasu");
            return false;
        }

        try {
            const response = await CryptoZoo.api.expeditionUseTimeReduction(requestedReductionSeconds);
            const usedReductionSeconds = Math.max(
                0,
                Number(response?.reductionSeconds) || requestedReductionSeconds
            );

            this.consumeSpecificTimeBoostCharge(
                selectedOption.key,
                expedition.baseDuration || expedition.duration || 60
            );

            CryptoZoo.audio?.play?.("click");
            CryptoZoo.api?.savePlayer?.();
            CryptoZoo.ui?.render?.();
            CryptoZoo.ui?.showToast?.(
                `⏩ Skrócono o ${CryptoZoo.ui?.formatDurationLabel?.(usedReductionSeconds) || `${usedReductionSeconds}s`}`
            );

            return true;
        } catch (error) {
            if (this.isBackendOfflineError(error) && this.canUseLocalFallback()) {
                return this.useTimeBoostOnActiveExpeditionLocalFallback(selectedOption.key);
            }

            this.showExpeditionError(error, "Błąd skrócenia ekspedycji");
            return false;
        }
    },

    async collectLocalFallback(skipInProgressCheck = false) {
        CryptoZoo.state = CryptoZoo.state || {};

        if (!skipInProgressCheck && this.collectInProgress) {
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
            const coins = Math.max(0, Number(expedition.rewardCoins) || 0);
            const gems = Math.max(0, Number(expedition.rewardGems) || 0);

            const rewardBalance = Math.max(
                0,
                Number(this.finalizeRewardBalanceAmount(expedition)) || 0
            );

            CryptoZoo.state.coins =
                Math.max(0, Number(CryptoZoo.state.coins) || 0) + coins;

            CryptoZoo.state.gems =
                Math.max(0, Number(CryptoZoo.state.gems) || 0) + gems;

            if (rewardBalance > 0) {
                CryptoZoo.state.rewardBalance = Number(
                    (
                        (Number(CryptoZoo.state.rewardBalance) || 0) +
                        rewardBalance
                    ).toFixed(3)
                );
            }

            expedition.claimed = true;
            expedition.collectedAt = Date.now();

            CryptoZoo.state.expedition = null;

            CryptoZoo.audio?.play?.("win");
            CryptoZoo.gameplay?.recalculateProgress?.();
            CryptoZoo.api?.savePlayer?.();
            CryptoZoo.ui?.render?.();

            const rewardText = [
                `+${CryptoZoo.formatNumber(coins)} coins`,
                gems > 0 ? `+${CryptoZoo.formatNumber(gems)} gem` : "",
                rewardBalance > 0
                    ? `+${rewardBalance.toFixed(3)} reward`
                    : ""
            ].filter(Boolean).join(" • ");

            this.showFallbackEnabledToastOnce();

            CryptoZoo.ui?.showToast?.(
                `🎁 Expedition complete • ${rewardText}`
            );

            return true;

        } finally {
            setTimeout(() => {
                this.collectInProgress = false;
            }, 250);
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

            let rewardBalance = Math.max(
                0,
                Number(rewards.rewardBalance) || 0
            );

            if (rewardBalance <= 0) {
                rewardBalance =
                    this.finalizeRewardBalanceAmount(expedition);

                if (rewardBalance > 0) {
                    CryptoZoo.state.rewardBalance = Number(
                        (
                            (Number(CryptoZoo.state.rewardBalance) || 0) +
                            rewardBalance
                        ).toFixed(3)
                    );

                    CryptoZoo.api?.savePlayer?.();
                }
            }

            CryptoZoo.audio?.play?.("win");
            CryptoZoo.gameplay?.recalculateProgress?.();
            CryptoZoo.ui?.render?.();

            const rewardText = [
                `+${CryptoZoo.formatNumber(coins)} coins`,
                gems > 0 ? `+${CryptoZoo.formatNumber(gems)} gem` : "",
                rewardBalance > 0
                    ? `+${rewardBalance.toFixed(3)} reward`
                    : ""
            ].filter(Boolean).join(" • ");

            CryptoZoo.ui?.showToast?.(
                `🎁 Expedition complete • ${rewardText}`
            );

            return true;

        } catch (error) {
            if (
                this.isBackendOfflineError(error) &&
                this.canUseLocalFallback()
            ) {
                this.collectInProgress = false;
                return this.collectLocalFallback(true);
            }

            this.showExpeditionError(
                error,
                "Błąd odbioru nagrody"
            );

            return false;

        } finally {
            setTimeout(() => {
                this.collectInProgress = false;
            }, 250);
        }
    }
};