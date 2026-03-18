window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.ui = {
    toastTimeout: null,

    showToast(message) {
        let toast = document.getElementById("toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";
            toast.style.position = "fixed";
            toast.style.left = "50%";
            toast.style.bottom = "96px";
            toast.style.transform = "translateX(-50%)";
            toast.style.background = "rgba(10, 18, 35, 0.96)";
            toast.style.color = "#ffffff";
            toast.style.padding = "12px 18px";
            toast.style.borderRadius = "14px";
            toast.style.zIndex = "99999";
            toast.style.display = "none";
            toast.style.fontWeight = "800";
            toast.style.boxShadow = "0 8px 28px rgba(0, 0, 0, 0.32)";
            toast.style.border = "1px solid rgba(255,255,255,0.08)";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.display = "block";

        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.style.display = "none";
        }, 1800);
    },

    animateCoin() {
        const tapButton = document.getElementById("tapButton");
        if (!tapButton || !tapButton.parentElement) return;

        const area = tapButton.parentElement;

        const baseClickValue =
            Number(CryptoZoo.state?.coinsPerClick) || 1;

        const multiplier = CryptoZoo.gameplay?.getBoost2xMultiplier?.() || 1;
        const clickValue = baseClickValue * multiplier;

        const pop = document.createElement("div");
        pop.className = "coin-pop";
        pop.textContent = "+" + clickValue;

        pop.style.left = "50%";
        pop.style.top = "50%";

        area.appendChild(pop);

        requestAnimationFrame(() => {
            pop.classList.add("animate");
        });

        setTimeout(() => {
            pop.remove();
        }, 900);
    },

    updateText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },

    renderHome() {
        const state = CryptoZoo.state || {};
        const multiplier = CryptoZoo.gameplay?.getBoost2xMultiplier?.() || 1;

        this.updateText("homeCoins", state.coins || 0);
        this.updateText("homeGems", state.gems || 0);
        this.updateText("homeRewardBalance", state.rewardBalance || 0);
        this.updateText("homeLevel", state.level || 1);
        this.updateText("homeCoinsPerClick", (state.coinsPerClick || 1) * multiplier);
        this.updateText("homeIncomeStripValue", (state.zooIncome || 0) * multiplier);
    },

    renderTopHiddenStats() {
        const state = CryptoZoo.state || {};

        this.updateText("coins", state.coins || 0);
        this.updateText("gems", state.gems || 0);
        this.updateText("rewardBalance", state.rewardBalance || 0);
        this.updateText("level", state.level || 1);
        this.updateText("coinsPerClick", state.coinsPerClick || 1);
        this.updateText("zooIncome", state.zooIncome || 0);
    },

    render() {
        this.renderHome();
        this.renderTopHiddenStats();
    }
};