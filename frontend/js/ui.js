window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.ui = {

    getEl(id) {
        return document.getElementById(id);
    },

    showToast(message) {
        const toast = this.getEl("toast");
        if (!toast) return;

        toast.textContent = message;
        toast.style.display = "block";

        setTimeout(() => {
            toast.style.display = "none";
        }, 2000);
    },

    showScreen(screenId) {

        const screens = document.querySelectorAll(".screen");
        const navButtons = document.querySelectorAll(".nav-btn");

        screens.forEach(screen => screen.classList.remove("active-screen"));
        navButtons.forEach(btn => btn.classList.remove("active-nav"));

        const target = this.getEl(screenId);

        if (target) target.classList.add("active-screen");

        navButtons.forEach(btn => {

            if (btn.dataset.screen === screenId) {
                btn.classList.add("active-nav");
            }

        });

    },

    updateText(id, value) {

        const el = this.getEl(id);
        if (!el) return;

        el.textContent = value;

    },

    render() {

        const state = CryptoZoo.state;

        this.updateText("coins-count", CryptoZoo.formatNumber(state.coins));
        this.updateText("level", state.level);
        this.updateText("coins-per-click", state.coinsPerClick);
        this.updateText("upgrade-cost", CryptoZoo.formatNumber(state.upgradeCost));
        this.updateText("zoo-income", CryptoZoo.formatNumber(state.zooIncome));

        const animals = state.animals;

        Object.keys(animals).forEach(type => {

            const count = animals[type].count;
            const level = animals[type].level;

            const countEl = document.getElementById(type + "-count");
            const levelEl = document.getElementById(type + "-level");

            if (countEl) countEl.textContent = count;
            if (levelEl) levelEl.textContent = level;

        });

    },

    animateCoinsBurst() {

        const container = document.getElementById("coin-animation-container");
        if (!container) return;

        for (let i = 0; i < 6; i++) {

            const coin = document.createElement("div");
            coin.className = "flying-coin";

            const moveX = (Math.random() * 200 - 100) + "px";
            const moveY = (-100 - Math.random() * 120) + "px";

            coin.style.setProperty("--moveX", moveX);
            coin.style.setProperty("--moveY", moveY);

            container.appendChild(coin);

            setTimeout(() => coin.remove(), 900);

        }

    }

};