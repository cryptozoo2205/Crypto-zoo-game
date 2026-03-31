window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.incomeSystem = {
    timerStarted: false,
    saveTick: 0,

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

            CryptoZoo.gameplay?.recalculateLevel?.();

            if (CryptoZoo.gameplay?.activeScreen === "game") {
                CryptoZoo.ui?.renderHome?.();
                CryptoZoo.ui?.renderTopHiddenStats?.();
            } else if (CryptoZoo.gameplay?.activeScreen === "zoo") {
                CryptoZoo.ui?.renderTopHiddenStats?.();
            } else if (CryptoZoo.gameplay?.activeScreen === "shop") {
                CryptoZoo.ui?.renderTopHiddenStats?.();
                CryptoZoo.ui?.renderBoostStatus?.();
            } else if (CryptoZoo.gameplay?.activeScreen === "missions") {
                CryptoZoo.ui?.renderTopHiddenStats?.();
                CryptoZoo.ui?.renderExpeditions?.();
            } else {
                CryptoZoo.ui?.renderTopHiddenStats?.();
            }

            this.saveTick += 1;

            if (this.saveTick >= 5) {
                this.saveTick = 0;
                CryptoZoo.api?.savePlayer?.();
            }
        }, 1000);
    }
};