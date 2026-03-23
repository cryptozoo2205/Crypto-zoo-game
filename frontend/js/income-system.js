window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.incomeSystem = {
    timerStarted: false,

    getEffectiveIncome() {
        const baseIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        const boostMultiplier = Math.max(
            1,
            Number(CryptoZoo.boostSystem?.getMultiplier?.() || 1)
        );

        return baseIncome * boostMultiplier;
    },

    start() {
        if (this.timerStarted) return;
        this.timerStarted = true;

        setInterval(() => {
            CryptoZoo.state = CryptoZoo.state || {};

            CryptoZoo.state.playTimeSeconds =
                (Number(CryptoZoo.state.playTimeSeconds) || 0) + 1;

            const income = this.getEffectiveIncome();

            if (income > 0) {
                CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + income;
            }

            CryptoZoo.state.lastLogin = Date.now();

            CryptoZoo.gameplay?.recalculateProgress?.();
            CryptoZoo.ui?.render?.();
            CryptoZoo.api?.savePlayer?.();
        }, 1000);
    }
};