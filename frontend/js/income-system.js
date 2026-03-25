window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.incomeSystem = {
    timerStarted: false,

    getEffectiveIncome() {
        const baseIncome = Math.max(0, Number(CryptoZoo.state?.zooIncome) || 0);
        const boostMultiplier = Math.max(
            1,
            Number(CryptoZoo.boostSystem?.getMultiplier?.() || 1)
        );

        const income = baseIncome * boostMultiplier;

        // HARD SAFETY (anti-bug / anti-exploit)
        if (!Number.isFinite(income) || income < 0) return 0;

        // soft cap (zabezpieczenie przed absurdami typu 1e300)
        return Math.min(income, 1e15);
    },

    start() {
        if (this.timerStarted) return;
        this.timerStarted = true;

        setInterval(() => {
            CryptoZoo.state = CryptoZoo.state || {};

            // playtime
            CryptoZoo.state.playTimeSeconds =
                Math.max(0, Number(CryptoZoo.state.playTimeSeconds) || 0) + 1;

            const income = this.getEffectiveIncome();

            if (income > 0) {
                CryptoZoo.state.coins =
                    Math.max(0, Number(CryptoZoo.state.coins) || 0) + income;
            }

            CryptoZoo.state.lastLogin = Date.now();

            // tylko core recalculation (lekki)
            CryptoZoo.gameplay?.recalculateLevel?.();

            // UI update
            CryptoZoo.ui?.render?.();

            // autosave co sekundę zostawiamy (Telegram idle game → OK)
            CryptoZoo.api?.savePlayer?.();
        }, 1000);
    }
};