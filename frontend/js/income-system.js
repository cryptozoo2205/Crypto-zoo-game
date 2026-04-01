window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.incomeSystem = {
    timerStarted: false,
    dirtyTick: 0,

    getEffectiveIncome() {
        const baseIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        const boostMultiplier = Math.max(
            1,
            Number(CryptoZoo.boostSystem?.getMultiplier?.() || 1)
        );

        const income = baseIncome * boostMultiplier;

        if (!Number.isFinite(income) || income < 0) return 0;

        return Math.min(income, 1e15);
    },

    start() {
        if (this.timerStarted) return;
        this.timerStarted = true;

        setInterval(() => {
            CryptoZoo.state = CryptoZoo.state || {};

            CryptoZoo.state.playTimeSeconds =
                Math.max(0, Number(CryptoZoo.state.playTimeSeconds) || 0) + 1;

            const income = this.getEffectiveIncome();

            if (income > 0) {
                CryptoZoo.state.coins =
                    Math.max(0, Number(CryptoZoo.state.coins) || 0) + income;
            }

            CryptoZoo.state.lastLogin = Date.now();
            CryptoZoo.state.updatedAt = Date.now();

            CryptoZoo.gameplay?.recalculateLevel?.();

            const activeScreen = CryptoZoo.gameplay?.activeScreen || "game";

            if (activeScreen === "game") {
                CryptoZoo.ui?.renderTopHiddenStats?.();
                CryptoZoo.ui?.renderBoostStatus?.();
                CryptoZoo.ui?.renderDailyRewardStatus?.();
                CryptoZoo.ui?.renderXpBar?.();
                CryptoZoo.uiProfile?.renderTopBarOnly?.();
            } else if (activeScreen === "shop") {
                CryptoZoo.ui?.renderTopHiddenStats?.();
                CryptoZoo.ui?.renderBoostStatus?.();
            } else {
                CryptoZoo.ui?.renderTopHiddenStats?.();
            }

            this.dirtyTick += 1;

            if (this.dirtyTick >= 10) {
                this.dirtyTick = 0;
                CryptoZoo.api?.markDirty?.();
            }
        }, 1000);
    }
};