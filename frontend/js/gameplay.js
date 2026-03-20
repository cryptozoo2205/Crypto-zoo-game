window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.gameplay = {
    maxOfflineSeconds: 4 * 60 * 60, // 4h

    init() {
        this.bindTap();
        this.bindDailyRewardButton();
        this.startPassiveIncome();
    },

    /* =========================
       TAP
    ========================= */

    bindTap() {
        const btn = document.getElementById("tapButton");
        if (!btn) return;

        btn.addEventListener("click", () => {
            const value = this.getEffectiveCoinsPerClick(1);

            CryptoZoo.state.coins += value;
            CryptoZoo.ui?.animateCoin?.(1);
            CryptoZoo.ui?.render?.();
        });
    },

    getEffectiveCoinsPerClick(multiplier = 1) {
        const base = Number(CryptoZoo.state.coinsPerClick) || 1;
        return base * multiplier * this.getBoost2xMultiplier();
    },

    /* =========================
       BOOST X2
    ========================= */

    activateBoost2x() {
        const now = Date.now();
        const duration = 10 * 60 * 1000;

        if ((CryptoZoo.state.gems || 0) < 1) {
            CryptoZoo.ui?.showToast?.("Za mało gems");
            return;
        }

        CryptoZoo.state.gems -= 1;
        CryptoZoo.state.boost2xActiveUntil = now + duration;

        CryptoZoo.ui?.showToast?.("Boost X2 aktywny!");
        CryptoZoo.ui?.render?.();
    },

    isBoost2xActive() {
        return Date.now() < (CryptoZoo.state.boost2xActiveUntil || 0);
    },

    getBoost2xMultiplier() {
        return this.isBoost2xActive() ? 2 : 1;
    },

    getBoost2xTimeLeft() {
        const left = (CryptoZoo.state.boost2xActiveUntil || 0) - Date.now();
        return Math.max(0, Math.floor(left / 1000));
    },

    /* =========================
       DAILY REWARD 🔥
    ========================= */

    getDailyRewardCooldownMs() {
        return 24 * 60 * 60 * 1000; // 24h
    },

    getLastDailyClaim() {
        return Number(localStorage.getItem("cz_daily_last")) || 0;
    },

    setLastDailyClaim() {
        localStorage.setItem("cz_daily_last", String(Date.now()));
    },

    canClaimDailyReward() {
        const last = this.getLastDailyClaim();
        const now = Date.now();

        return now - last >= this.getDailyRewardCooldownMs();
    },

    getDailyRewardTimeLeftMs() {
        const last = this.getLastDailyClaim();
        const now = Date.now();

        const left = this.getDailyRewardCooldownMs() - (now - last);
        return Math.max(0, left);
    },

    getDailyRewardCoinsAmount() {
        const level = Number(CryptoZoo.state.level) || 1;

        // 🔥 scaling nagrody
        return Math.floor(100 + level * 50);
    },

    getDailyRewardGemsAmount() {
        const level = Number(CryptoZoo.state.level) || 1;

        return level >= 5 ? 1 : 0;
    },

    claimDailyReward() {
        if (!this.canClaimDailyReward()) {
            CryptoZoo.ui?.showToast?.("Jeszcze nie możesz odebrać");
            return;
        }

        const coins = this.getDailyRewardCoinsAmount();
        const gems = this.getDailyRewardGemsAmount();

        CryptoZoo.state.coins += coins;
        CryptoZoo.state.gems += gems;

        this.setLastDailyClaim();

        CryptoZoo.ui?.render?.();

        CryptoZoo.ui?.showToast?.(
            `🎁 +${CryptoZoo.formatNumber(coins)} coins${gems ? " +" + gems + " gems" : ""}`
        );
    },

    bindDailyRewardButton() {
        const btn = document.getElementById("homeDailyBtn");
        if (!btn || btn.dataset.bound) return;

        btn.dataset.bound = "1";

        btn.addEventListener("click", () => {
            if (this.canClaimDailyReward()) {
                this.claimDailyReward();
            } else {
                const left = Math.ceil(this.getDailyRewardTimeLeftMs() / 1000);
                CryptoZoo.ui?.showToast?.(
                    `⏳ ${CryptoZoo.ui.formatTimeLeft(left)}`
                );
            }
        });
    },

    /* =========================
       PASSIVE INCOME
    ========================= */

    getEffectiveZooIncome() {
        return (Number(CryptoZoo.state.zooIncome) || 0) * this.getBoost2xMultiplier();
    },

    startPassiveIncome() {
        if (this._incomeInterval) return;

        this._incomeInterval = setInterval(() => {
            const income = this.getEffectiveZooIncome();

            CryptoZoo.state.coins += income;

            CryptoZoo.ui?.render?.();
        }, 1000);
    }
};