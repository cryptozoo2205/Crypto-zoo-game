window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.incomeSystem = {
    timerStarted: false,
    dirtyTick: 0,
    uiTick: 0,
    lastLevelRecalcAt: 0,

    getEffectiveIncome() {
        const baseIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        const boostMultiplier = Math.max(
            1,
            Number(CryptoZoo.boostSystem?.getMultiplier?.() || 1)
        );

        const income = baseIncome * boostMultiplier;

        if (!Number.isFinite(income) || income < 0) {
            return 0;
        }

        return Math.min(income, 1e15);
    },

    renderLight(activeScreen) {
        CryptoZoo.ui?.renderTopHiddenStats?.();

        if (activeScreen === "game") {
            CryptoZoo.ui?.renderBoostStatus?.();
            CryptoZoo.ui?.renderDailyRewardStatus?.();
            CryptoZoo.ui?.renderXpBar?.();
            CryptoZoo.uiProfile?.renderTopBarOnly?.();
        } else if (activeScreen === "shop") {
            CryptoZoo.ui?.renderBoostStatus?.();
        }
    },

    maybeRecalculateLevel(now) {
        const minGapMs = 1200;

        if (now - this.lastLevelRecalcAt < minGapMs) {
            return;
        }

        this.lastLevelRecalcAt = now;
        CryptoZoo.gameplay?.recalculateLevel?.();
    },

    start() {
        if (this.timerStarted) return;
        this.timerStarted = true;

        setInterval(() => {
            const now = Date.now();

            CryptoZoo.state = CryptoZoo.state || {};

            CryptoZoo.state.playTimeSeconds =
                Math.max(0, Number(CryptoZoo.state.playTimeSeconds) || 0) + 1;

            const income = this.getEffectiveIncome();

            if (income > 0) {
                CryptoZoo.state.coins =
                    Math.max(0, Number(CryptoZoo.state.coins) || 0) + income;
            }

            CryptoZoo.state.lastLogin = now;
            CryptoZoo.state.updatedAt = now;

            this.maybeRecalculateLevel(now);

            const activeScreen = CryptoZoo.gameplay?.activeScreen || "game";

            this.uiTick += 1;
            if (this.uiTick >= 2) {
                this.uiTick = 0;

                // pełny render, żeby coins odświeżały się bez klikania
                CryptoZoo.ui?.render?.();

                // lekkie renderowanie dodatkowych elementów
                this.renderLight(activeScreen);
            }

            this.dirtyTick += 1;
            if (this.dirtyTick >= 10) {
                this.dirtyTick = 0;
                CryptoZoo.api?.markDirty?.();
            }
        }, 1000);
    }
};