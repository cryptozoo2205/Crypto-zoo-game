window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.expeditions = {
    getAll() {
        return Array.isArray(CryptoZoo.config?.expeditions)
            ? CryptoZoo.config.expeditions
            : [];
    },

    findById(id) {
        return this.getAll().find((expedition) => expedition.id === id) || null;
    },

    getUnlockRequirement(expeditionOrId) {
        const expedition = typeof expeditionOrId === "string"
            ? this.findById(expeditionOrId)
            : expeditionOrId;

        const duration = Number(expedition?.duration) || 0;

        if (duration >= 86400) return 50;
        if (duration >= 43200) return 35;
        if (duration >= 28800) return 26;
        if (duration >= 14400) return 18;
        if (duration >= 7200) return 12;
        if (duration >= 3600) return 8;
        if (duration >= 1800) return 5;
        if (duration >= 900) return 3;

        return 1;
    },

    isUnlocked(expeditionOrId) {
        const requiredLevel = this.getUnlockRequirement(expeditionOrId);
        const currentLevel = Math.max(1, Number(CryptoZoo.state?.level) || 1);
        return currentLevel >= requiredLevel;
    },

    getUnlockText(expeditionOrId) {
        const requiredLevel = this.getUnlockRequirement(expeditionOrId);
        return `Odblokuj poziom ${requiredLevel}`;
    },

    getRewardBalanceAmount(expedition) {
        if (!expedition) return 0;

        const durationSeconds = Math.max(
            0,
            (Number(expedition.endTime) || 0) - (Number(expedition.startTime) || 0)
        ) / 1000;
        const rarity = String(expedition.rewardRarity || "common");

        let rewardBalance = 0;

        if (durationSeconds >= 14400) rewardBalance += 1;
        if (durationSeconds >= 43200) rewardBalance += 1;
        if (durationSeconds >= 86400) rewardBalance += 1;

        if (rarity === "rare" && durationSeconds >= 14400) rewardBalance += 1;
        if (rarity === "epic" && durationSeconds >= 14400) rewardBalance += 2;

        return rewardBalance;
    },

    start(id) {
        const expedition = this.findById(id);
        if (!expedition) return false;

        if (!this.isUnlocked(expedition)) {
            CryptoZoo.ui?.showToast?.(this.getUnlockText(expedition));
            return false;
        }

        if (CryptoZoo.state?.expedition) {
            CryptoZoo.ui?.showToast?.("Ekspedycja już trwa");
            return false;
        }

        const now = Date.now();
        const rareRoll = Math.random();
        const epicRoll = Math.random();

        let rewardRarity = "common";
        let coinsMultiplier = 1;
        let gemsMultiplier = 1;

        if (epicRoll < expedition.epicChance) {
            rewardRarity = "epic";
            coinsMultiplier = 2.2;
            gemsMultiplier = 2;
        } else if (rareRoll < expedition.rareChance) {
            rewardRarity = "rare";
            coinsMultiplier = 1.5;
            gemsMultiplier = 1.5;
        }

        const bonus = 1 + (Number(CryptoZoo.state?.expeditionBoost) || 0);

        CryptoZoo.state.expedition = {
            id: expedition.id,
            name: expedition.name,
            startTime: now,
            endTime: now + expedition.duration * 1000,
            rewardRarity,
            rewardCoins: Math.floor(
                (Number(expedition.baseCoins) || 0) * coinsMultiplier * bonus
            ),
            rewardGems: Math.floor(
                (Number(expedition.baseGems) || 0) * gemsMultiplier * bonus
            )
        };

        CryptoZoo.state.lastLogin = Date.now();
        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();
        CryptoZoo.ui?.showToast?.("Ekspedycja rozpoczęta");

        return true;
    },

    collect() {
        const expedition = CryptoZoo.state?.expedition;
        if (!expedition) {
            CryptoZoo.ui?.showToast?.("Brak aktywnej ekspedycji");
            return false;
        }

        if (Date.now() < expedition.endTime) {
            CryptoZoo.ui?.showToast?.("Ekspedycja jeszcze trwa");
            return false;
        }

        const rewardBalanceReward = this.getRewardBalanceAmount(expedition);

        CryptoZoo.state.coins =
            (Number(CryptoZoo.state.coins) || 0) + (Number(expedition.rewardCoins) || 0);
        CryptoZoo.state.gems =
            (Number(CryptoZoo.state.gems) || 0) + (Number(expedition.rewardGems) || 0);
        CryptoZoo.state.rewardBalance =
            (Number(CryptoZoo.state.rewardBalance) || 0) + rewardBalanceReward;
        CryptoZoo.state.xp = (Number(CryptoZoo.state.xp) || 0) + 5;

        CryptoZoo.state.expedition = null;
        CryptoZoo.state.lastLogin = Date.now();

        CryptoZoo.gameplay?.recalculateLevel?.();

        CryptoZoo.ui?.render?.();
        CryptoZoo.api?.savePlayer?.();

        if (rewardBalanceReward > 0) {
            CryptoZoo.ui?.showToast?.(
                `Odebrano ekspedycję • +${CryptoZoo.formatNumber(rewardBalanceReward)} reward`
            );
        } else {
            CryptoZoo.ui?.showToast?.("Odebrano ekspedycję");
        }

        return true;
    }
};