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

        clearTimeout(window.cryptoZooToastTimeout);

        window.cryptoZooToastTimeout = setTimeout(function () {
            toast.style.display = "none";
        }, 2000);
    },

    showScreen(screenId) {
        const screens = document.querySelectorAll(".screen");
        const navButtons = document.querySelectorAll(".nav-btn");

        screens.forEach(function (screen) {
            screen.classList.remove("active-screen");
        });

        navButtons.forEach(function (btn) {
            btn.classList.remove("active-nav");
        });

        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add("active-screen");
        }

        navButtons.forEach(function (btn) {
            if (btn.getAttribute("data-screen") === screenId) {
                btn.classList.add("active-nav");
            }
        });
    },

    animateCoinsBurst() {
        const container = document.getElementById("coin-animation-container");
        if (!container) return;

        for (let i = 0; i < 8; i++) {
            const coin = document.createElement("div");
            coin.className = "flying-coin";

            const moveX = (Math.floor(Math.random() * 220) - 110) + "px";
            const moveY = (-70 - Math.floor(Math.random() * 140)) + "px";

            coin.style.left = "114px";
            coin.style.top = "114px";
            coin.style.setProperty("--moveX", moveX);
            coin.style.setProperty("--moveY", moveY);

            container.appendChild(coin);

            setTimeout(function () {
                coin.remove();
            }, 900);
        }
    },

    updateText(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    },

    render() {
        const state = CryptoZoo.state || {};
        const animals = state.animals || {};
        const animalsConfig = CryptoZoo.config.animals || {};

        this.updateText("coins-count", CryptoZoo.formatNumber(state.coins || 0));
        this.updateText("gems-count", CryptoZoo.formatNumber(state.gems || 0));
        this.updateText("level", CryptoZoo.formatNumber(state.level || 1));
        this.updateText("coins-per-click", CryptoZoo.formatNumber(state.coinsPerClick || 1));
        this.updateText("upgrade-cost", CryptoZoo.formatNumber(state.upgradeCost || 50));
        this.updateText("zoo-income", CryptoZoo.formatNumber(state.zooIncome || 0));

        let totalAnimals = 0;

        Object.keys(animalsConfig).forEach((type) => {
            const animal = animals[type] || { count: 0, level: 1 };

            totalAnimals += Number(animal.count) || 0;

            this.updateText(`${type}-count`, CryptoZoo.formatNumber(animal.count));
            this.updateText(`${type}-level`, CryptoZoo.formatNumber(animal.level));

            const upgradeBtn = document.getElementById(`upgrade-${type}-btn`);
            if (upgradeBtn && CryptoZoo.gameplay) {
                upgradeBtn.textContent = `Lvl Up (${CryptoZoo.formatNumber(CryptoZoo.gameplay.getAnimalUpgradeCost(type))})`;
            }
        });

        this.updateText("animals-total", CryptoZoo.formatNumber(totalAnimals));
    }
};