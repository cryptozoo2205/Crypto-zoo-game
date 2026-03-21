window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.incomeSystem = {
    timerStarted: false,

    start() {
        if (this.timerStarted) return;
        this.timerStarted = true;

        setInterval(() => {
            CryptoZoo.state = CryptoZoo.state || {};

            CryptoZoo.state.playTimeSeconds =
                (Number(CryptoZoo.state.playTimeSeconds) || 0) + 1;

            CryptoZoo.gameplay?.recalculateProgress?.();

            const income = CryptoZoo.gameplay?.getEffectiveZooIncome?.() || 0;

            if (income > 0) {
                CryptoZoo.state.coins = (Number(CryptoZoo.state.coins) || 0) + income;
                CryptoZoo.state.xp = (Number(CryptoZoo.state.xp) || 0) + 1;
            }

            CryptoZoo.state.lastLogin = Date.now();

            CryptoZoo.gameplay?.recalculateLevel?.();
            CryptoZoo.ui?.render?.();
            CryptoZoo.api?.savePlayer?.();
        }, 1000);
    }
};