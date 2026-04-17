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

    consumeBestTimeBoostCharge(baseDuration) {
        this.ensureExpeditionStats();

        const charges = this.getTimeBoostCharges();
        if (!charges.length) return 0;

        const safeBaseDuration = Math.max(60, Number(baseDuration) || 60);
        const maxAllowedReduction = Math.max(0, safeBaseDuration - 60);

        if (maxAllowedReduction <= 0) {
            return 0;
        }

        let bestIndex = -1;
        let bestApplied = 0;

        charges.forEach((charge, index) => {
            const safeCharge = Math.max(0, Number(charge) || 0);
            const applied = Math.min(safeCharge, maxAllowed
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